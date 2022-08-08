# and-the-time-is

[![CodeQL](https://github.com/dev-asterix/and-the-time-is/actions/workflows/codeql.yml/badge.svg)](https://github.com/dev-asterix/and-the-time-is/actions/workflows/codeql.yml)
![latest](https://badgen.net/github/tag/dev-asterix/and-the-time-is)
![license](https://badgen.net/github/license/dev-asterix/and-the-time-is)

The app displays the current time in local timezone. The time is displayed in 24-hour format. User can add other timezones to the list. The app displays the time in the selected timezone.

**Find the app here: <http://timeis.astrx.dev>**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Features

- [x] Display current time in local timezone
- [x] Search other timezones by code or timezone name, add or remove them from the dashboard
- [x] Change UI layout from small / large tiles
- [x] Modify the date format with custom formatter support
- [x] Display the time then based on input for different timezones under `the time was`

## Technologies Used

- [Next.JS](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com/)
- [Redux-Toolkit](https://redux-toolkit.js.org/)

Thanks to <https://github.com/bigeasy/timezone> for the timezone mapping package

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

----
***Code.Share.Prosper***
