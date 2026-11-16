# Product Lab — Product Research & Validation

A mobile-first product research workspace with **MongoDB Atlas cloud storage**.

## Features
- Product idea pipeline with search, status filters and sorting
- 10-factor opportunity scoring (0–100)
- Problem, audience, competitor, solution, pricing and channel research fields
- Validation evidence: interviews, leads, buyers, conversion and proof checkboxes
- Dashboard, validation tracker and research insights
- JSON backup export and import
- MongoDB Atlas persistence through a Node.js API
- Login-protected cloud data

## Architecture

```
GitHub Pages / Vercel frontend
        ↓ HTTPS
Node.js API (Vercel Functions)
        ↓ MongoDB Node.js Driver
MongoDB Atlas
        ↓
product_lab.products
```

MongoDB credentials are **server-side only**. Do not put the Atlas URI in `index.html`, `config.js`, or any public GitHub file.

## MongoDB setup

1. Create a MongoDB Atlas database user and cluster.
2. In the API deployment environment, add:
   - `MONGODB_URI`
   - `MONGODB_DB=product_lab`
   - `APP_USERNAME`
   - `APP_PASSWORD`
   - `JWT_SECRET`
   - `FRONTEND_ORIGIN`
3. Deploy the repository to Vercel so `/api/*` is available.
4. If the frontend remains on GitHub Pages, set `window.PRODUCT_LAB_API` to the Vercel API URL ending in `/api`.
5. Open the app and sign in.

## GitHub Pages

GitHub Pages can host the static HTML/JS frontend, but it cannot run the Node.js API itself. The MongoDB connection therefore lives behind the API. GitHub Pages remains useful for the frontend, while Vercel runs the API.

## Local fallback

If no `PRODUCT_LAB_API` is configured, the app continues to use browser localStorage. This is useful for offline testing, but it is **not** cloud storage.

## Security

- Never commit `.env` or Atlas credentials.
- Use a dedicated MongoDB database user with only the permissions the app needs.
- Keep `MONGODB_URI`, `APP_PASSWORD`, and `JWT_SECRET` in deployment environment variables.
- Rotate any database password that has been exposed or shared outside your secret manager.

## Deploy

MongoDB's current guidance recommends the official Node.js driver and a server-side application/API for MongoDB Atlas. Atlas Data API / HTTPS endpoints are no longer the recommended route.

### Vercel

Import this GitHub repository into Vercel and add the environment variables under **Project → Settings → Environment Variables**. Then redeploy after saving them.

### GitHub Pages

Keep the existing GitHub Actions Pages workflow for the static frontend. For the cloud API, use the Vercel deployment URL.

## Scoring note

The opportunity score is a prioritisation aid, not proof of demand. Validate with customer conversations and real purchase commitments before building.
