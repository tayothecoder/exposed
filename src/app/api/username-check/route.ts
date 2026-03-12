import { NextRequest, NextResponse } from "next/server";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { error: "username required" },
      { status: 400 }
    );
  }

  const platforms: PlatformResult[] = [];
  const errors: string[] = [];

  // github
  try {
    const resp = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "Exposed-Scanner/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      platforms.push({
        platform: "GitHub",
        found: true,
        manual: false,
        url: `https://github.com/${username}`,
        avatar: data.avatar_url || undefined,
        bio: data.bio || undefined,
        joinDate: data.created_at
          ? data.created_at.substring(0, 10)
          : undefined,
      });
    } else if (resp.status === 404) {
      platforms.push({
        platform: "GitHub",
        found: false,
        manual: false,
        url: `https://github.com/${username}`,
      });
    } else {
      platforms.push({
        platform: "GitHub",
        found: false,
        manual: false,
        url: `https://github.com/${username}`,
        error: "api returned " + resp.status,
      });
    }
  } catch {
    platforms.push({
      platform: "GitHub",
      found: false,
      manual: false,
      url: `https://github.com/${username}`,
      error: "unavailable",
    });
  }

  await sleep(300);

  // reddit
  try {
    const resp = await fetch(
      `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`,
      {
        headers: {
          "User-Agent": "Exposed-Scanner/1.0",
        },
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.data && data.data.name) {
        platforms.push({
          platform: "Reddit",
          found: true,
          manual: false,
          url: `https://reddit.com/user/${username}`,
          avatar: data.data.icon_img
            ? data.data.icon_img.split("?")[0]
            : undefined,
          joinDate: data.data.created_utc
            ? new Date(data.data.created_utc * 1000)
                .toISOString()
                .substring(0, 10)
            : undefined,
        });
      } else {
        platforms.push({
          platform: "Reddit",
          found: false,
          manual: false,
          url: `https://reddit.com/user/${username}`,
        });
      }
    } else if (resp.status === 404) {
      platforms.push({
        platform: "Reddit",
        found: false,
        manual: false,
        url: `https://reddit.com/user/${username}`,
      });
    } else {
      platforms.push({
        platform: "Reddit",
        found: false,
        manual: false,
        url: `https://reddit.com/user/${username}`,
        error: "api returned " + resp.status,
      });
    }
  } catch {
    platforms.push({
      platform: "Reddit",
      found: false,
      manual: false,
      url: `https://reddit.com/user/${username}`,
      error: "unavailable",
    });
  }

  // instagram - manual only
  platforms.push({
    platform: "Instagram",
    found: false,
    manual: true,
    url: `https://instagram.com/${username}`,
  });

  // twitter - manual only
  platforms.push({
    platform: "Twitter/X",
    found: false,
    manual: true,
    url: `https://x.com/${username}`,
  });

  return NextResponse.json({ platforms, errors });
}
