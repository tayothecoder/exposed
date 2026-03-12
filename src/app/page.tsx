"use client";

import { useState } from "react";

// types for api responses
interface BreachResult {
  breaches: Array<{
    name: string;
    date: string;
    dataExposed: string[];
  }>;
  riskScore: number;
  emailReputation: {
    reputation: string;
    suspicious: boolean;
    references: number;
  } | null;
  errors: string[];
}

interface PlatformResult {
  platform: string;
  found: boolean;
  manual: boolean;
  url: string;
  avatar?: string;
  bio?: string;
  joinDate?: string;
  error?: string;
}

interface UsernameResult {
  platforms: PlatformResult[];
  errors: string[];
}

// calculate the footprint score from breach + username data
function calculateFootprintScore(
  breachData: BreachResult | null,
  usernameData: UsernameResult | null
): number {
  let score = 0;

  if (breachData) {
    const breachCount = breachData.breaches.length;
    // each breach adds points, diminishing returns
    score += Math.min(breachCount * 8, 50);

    // old breaches add more risk
    for (const b of breachData.breaches) {
      if (b.date) {
        const year = parseInt(b.date.substring(0, 4));
        if (year < 2018) score += 3;
      }
    }
  }

  if (usernameData) {
    const found = usernameData.platforms.filter(
      (p) => p.found && !p.manual
    ).length;
    score += found * 7;
  }

  return Math.min(score, 100);
}

function ScoreDisplay({ score }: { score: number }) {
  let color = "#22c55e";
  let label = "Low Exposure";
  if (score > 60) {
    color = "#ef4444";
    label = "High Risk";
  } else if (score > 30) {
    color = "#eab308";
    label = "Moderate";
  }

  return (
    <div className="border border-neutral-800 p-6 mt-6">
      <h2 className="text-lg mb-4 text-neutral-400">
        Digital Footprint Score
      </h2>
      <div className="flex items-center gap-6">
        <div
          className="text-5xl font-bold"
          style={{ color }}
        >
          {score}
        </div>
        <div>
          <div style={{ color }} className="text-xl">
            {label}
          </div>
          <div className="text-sm text-neutral-500 mt-1">out of 100</div>
        </div>
      </div>
      {/* score bar */}
      <div className="mt-4 h-2 bg-neutral-800 w-full">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {/* recommendations */}
      <div className="mt-6">
        <h3 className="text-sm text-neutral-400 mb-2">Recommendations</h3>
        <ul className="text-sm text-neutral-500 space-y-1">
          {score > 20 && (
            <li>- Change passwords on breached sites</li>
          )}
          {score > 10 && (
            <li>- Enable 2FA on all accounts</li>
          )}
          {score > 40 && (
            <li>- Review privacy settings on social platforms</li>
          )}
          {score > 60 && (
            <li>- Consider using a password manager</li>
          )}
          {score > 60 && (
            <li>- Check for reused passwords across services</li>
          )}
          {score <= 10 && (
            <li>- Looking good, keep it up</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function BreachResults({ data }: { data: BreachResult }) {
  return (
    <div className="border border-neutral-800 p-6 mt-6">
      <h2 className="text-lg mb-4 text-neutral-400">
        Breach Results
      </h2>

      {data.emailReputation && (
        <div className="mb-4 text-sm">
          <span className="text-neutral-500">Email reputation: </span>
          <span
            className={
              data.emailReputation.suspicious
                ? "text-red-500"
                : "text-green-500"
            }
          >
            {data.emailReputation.reputation}
          </span>
          <span className="text-neutral-600 ml-2">
            ({data.emailReputation.references} references found)
          </span>
        </div>
      )}

      {data.breaches.length === 0 ? (
        <p className="text-green-500 text-sm">
          No breaches found for this email
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-red-500 text-sm">
            Found in {data.breaches.length} breach
            {data.breaches.length !== 1 ? "es" : ""}
          </p>
          {data.breaches.map((b, i) => (
            <div
              key={i}
              className="border border-neutral-800 p-3 text-sm"
            >
              <div className="text-red-400 font-bold">{b.name}</div>
              {b.date && (
                <div className="text-neutral-500 text-xs mt-1">
                  Date: {b.date}
                </div>
              )}
              {b.dataExposed.length > 0 && (
                <div className="text-neutral-500 text-xs mt-1">
                  Exposed: {b.dataExposed.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.errors.length > 0 && (
        <div className="mt-3 text-xs text-neutral-600">
          {data.errors.map((e, i) => (
            <div key={i}>note: {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsernameResults({ data }: { data: UsernameResult }) {
  return (
    <div className="border border-neutral-800 p-6 mt-6">
      <h2 className="text-lg mb-4 text-neutral-400">
        Username OSINT
      </h2>
      <div className="space-y-3">
        {data.platforms.map((p, i) => (
          <div
            key={i}
            className="border border-neutral-800 p-3 text-sm flex items-start gap-3"
          >
            {p.avatar && (
              <img
                src={p.avatar}
                alt=""
                className="w-10 h-10 rounded"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-neutral-300">{p.platform}</span>
                {p.manual ? (
                  <span className="text-neutral-600 text-xs">
                    [check manually]
                  </span>
                ) : p.found ? (
                  <span className="text-red-400 text-xs">[found]</span>
                ) : p.error ? (
                  <span className="text-neutral-600 text-xs">
                    [unavailable]
                  </span>
                ) : (
                  <span className="text-green-500 text-xs">
                    [not found]
                  </span>
                )}
              </div>
              {p.bio && (
                <div className="text-neutral-500 text-xs mt-1">
                  {p.bio}
                </div>
              )}
              {p.joinDate && (
                <div className="text-neutral-600 text-xs">
                  Joined: {p.joinDate}
                </div>
              )}
              {(p.found || p.manual) && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 text-xs underline"
                >
                  {p.url}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.errors.length > 0 && (
        <div className="mt-3 text-xs text-neutral-600">
          {data.errors.map((e, i) => (
            <div key={i}>note: {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [breachData, setBreachData] = useState<BreachResult | null>(null);
  const [usernameData, setUsernameData] = useState<UsernameResult | null>(
    null
  );

  async function handleScan() {
    if (!email && !username) return;
    setLoading(true);
    setBreachData(null);
    setUsernameData(null);

    try {
      // run both in parallel if both provided
      const promises: Promise<void>[] = [];

      if (email) {
        promises.push(
          fetch("/api/breach-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
            .then((r) => r.json())
            .then((d) => setBreachData(d))
        );
      }

      if (username) {
        promises.push(
          fetch("/api/username-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          })
            .then((r) => r.json())
            .then((d) => setUsernameData(d))
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("scan failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const score =
    breachData || usernameData
      ? calculateFootprintScore(breachData, usernameData)
      : null;

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto pt-16">
        {/* logo */}
        <h1 className="text-4xl font-bold text-center tracking-tight mb-2">
          EXPOSED
        </h1>
        <p className="text-center text-neutral-500 text-sm mb-12">
          student digital safety scanner
        </p>

        {/* input section */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-neutral-700 px-4 py-3 text-sm placeholder-neutral-600"
          />
          <input
            type="text"
            placeholder="username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent border border-neutral-700 px-4 py-3 text-sm placeholder-neutral-600"
          />
          <button
            onClick={handleScan}
            disabled={loading || (!email && !username)}
            className={`w-full py-3 text-sm font-bold tracking-widest border ${
              loading
                ? "scanning border-red-500 text-red-500"
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-black"
            } disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
          >
            {loading ? "SCANNING..." : "SCAN"}
          </button>
        </div>

        {/* loading indicator */}
        {loading && (
          <div className="mt-4 h-1 bg-neutral-900 loading-bar" />
        )}

        {/* results */}
        {score !== null && <ScoreDisplay score={score} />}
        {breachData && <BreachResults data={breachData} />}
        {usernameData && <UsernameResults data={usernameData} />}

        {/* footer */}
        <div className="text-center text-neutral-700 text-xs mt-16 pb-8">
          RGU Hack 2026 / Salus Technical Challenge
          <br />
          no data is stored - privacy first
        </div>
      </div>
    </main>
  );
}
