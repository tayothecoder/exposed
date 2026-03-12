import { NextRequest, NextResponse } from "next/server";

// small delay helper
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const breaches: Array<{
    name: string;
    date: string;
    dataExposed: string[];
  }> = [];
  const errors: string[] = [];
  let emailReputation = null;

  // check emailrep.io
  try {
    const resp = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers: {
        "User-Agent": "Exposed-Scanner/1.0 (RGU Hack 2026)",
        Accept: "application/json",
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      emailReputation = {
        reputation: data.reputation || "unknown",
        suspicious: data.suspicious || false,
        references: data.references || 0,
      };
    } else {
      errors.push("emailrep.io returned " + resp.status);
    }
  } catch (e) {
    errors.push("emailrep.io unavailable");
  }

  await sleep(300);

  // check xposedornot - use breach-analytics for detailed info
  try {
    const resp = await fetch(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      {
        headers: { "User-Agent": "Exposed-Scanner/1.0" },
      }
    );
    if (resp.ok) {
      const text = await resp.text();
      // the response can be malformed json sometimes, parse carefully
      try {
        const data = JSON.parse(text);
        if (data.ExposedBreaches && data.ExposedBreaches.breaches_details) {
          for (const b of data.ExposedBreaches.breaches_details) {
            breaches.push({
              name: b.breach || "Unknown",
              date: b.xposed_date || "",
              dataExposed: b.xposed_data
                ? b.xposed_data.split(";").map((s: string) => s.trim()).filter(Boolean)
                : [],
            });
          }
        }
      } catch {
        // fallback: try the simpler check-email endpoint
        try {
          const resp2 = await fetch(
            `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
            { headers: { "User-Agent": "Exposed-Scanner/1.0" } }
          );
          if (resp2.ok) {
            const data2 = await resp2.json();
            if (data2.breaches && Array.isArray(data2.breaches)) {
              const names = Array.isArray(data2.breaches[0])
                ? data2.breaches[0]
                : data2.breaches;
              for (const b of names) {
                if (typeof b === "string") {
                  breaches.push({ name: b, date: "", dataExposed: [] });
                }
              }
            }
          }
        } catch {
          errors.push("xposedornot fallback failed");
        }
      }
    } else if (resp.status === 404) {
      // no breaches found
    } else {
      errors.push("xposedornot returned " + resp.status);
    }
  } catch (e) {
    errors.push("xposedornot unavailable");
  }

  const riskScore = Math.min(breaches.length * 8, 100);

  return NextResponse.json({
    breaches,
    riskScore,
    emailReputation,
    errors,
  });
}
