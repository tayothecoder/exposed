# Exposed

Student digital safety scanner built for RGUHack 2026 (Salus Technical Challenge).

Enter an email address and optional username to scan your digital exposure - breach history, email reputation, and username footprint across platforms.

## What it does

**Email breach check** - queries breach databases and email reputation services to find if your email has appeared in known data breaches. Returns breach names, dates, and what data was exposed.

**Username OSINT** - checks a username across platforms (GitHub, Reddit, Instagram, Twitter/X) to map your digital footprint. Pulls public info like avatars, join dates, and bios where available.

**Risk scoring** - calculates a combined exposure score based on breach severity, number of breaches, data types leaked, and how many platforms your username appears on. Higher score = more exposed.

## How it works

1. User enters an email and/or username
2. Backend API routes fan out requests to external services (emailrep.io, breach databases, platform APIs)
3. Results are aggregated and scored client-side
4. Everything is displayed in a dark terminal-style UI with real-time loading states

No data is stored. No accounts needed. Privacy first.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Server-side API routes for external service calls

## Running locally

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000`.

## Live

https://tayothecoder.com/exposed/

## License

MIT
