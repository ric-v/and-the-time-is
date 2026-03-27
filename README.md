# and-the-time-is

[![CodeQL](https://github.com/dev-asterix/and-the-time-is/actions/workflows/codeql.yml/badge.svg)](https://github.com/dev-asterix/and-the-time-is/actions/workflows/codeql.yml)
![latest](https://badgen.net/github/tag/dev-asterix/and-the-time-is)
![license](https://badgen.net/github/license/dev-asterix/and-the-time-is)

And The Time Is is a timezone dashboard built with Next.js. It helps you compare time across regions in real time, pin the zones you care about, and inspect details like UTC offset, abbreviation, and relative difference from your local timezone.

**Find the app here: <http://timeis.astrx.dev>**

## What This Project Does

- Shows your local time in a persistent hero clock.
- Lets you search and pin world timezones to a personal dashboard.
- Displays per-card live time, UTC offset, and relative offset from your local timezone.
- Supports a Time Was mode to evaluate historical/future timestamps across selected zones.
- Includes a modern timezone detail modal for deeper context when a card is clicked.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## App Modes

- Time Now: track live time for pinned timezones.
- Time Was: choose a date/time and compare that same timestamp across pinned timezones.

## Features

- [x] Live local hero clock with timezone context
- [x] Timezone search by city, IANA name, abbreviation, and UTC offset
- [x] Quick-add chips (IST, UTC, EST, PST, JST)
- [x] Popular suggestions and recent searches on focus
- [x] Pin/unpin timezone cards with persistent localStorage state
- [x] Card interactions: copy time, rename card label, remove card
- [x] Accurate UTC offsets derived from timezone data
- [x] Relative offset shown against local timezone (for example, +5h 30m)
- [x] Timezone details modal with live clock and metadata
- [x] Configurable display format (24h, 12h, ISO, Unix)
- [x] Time Was timestamp conversion support (date-time and unix input)

## Technologies Used

- [Next.JS](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [SWR](https://swr.vercel.app/)
- [countries-and-timezones](https://www.npmjs.com/package/countries-and-timezones)
- [timezone](https://github.com/bigeasy/timezone)

## Project Structure

- `pages/index.tsx`: Time Now page
- `pages/TimeWas.tsx`: Time Was page
- `pages/api/timezones.ts`: timezone search/suggestion API
- `components/Main.tsx`: shared app shell for both modes
- `components/ui-elements/Card.tsx`: timezone card rendering and actions
- `components/TimestampModal.tsx`: clicked-card details modal
- `utils/timeNow.ts`: time formatting, offset helpers, relative offset logic

## Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Run production server
npm run lint    # Run lint checks
```

## Notes

- Timezone data is persisted in localStorage.
- Search suggestions are served from `/api/timezones`.
- The API layer canonicalizes known legacy timezone aliases (for example, `Asia/Calcutta` to `Asia/Kolkata`).

## Learn More

To learn more about Next.js, take a look at these resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

----
***Code.Share.Prosper***
