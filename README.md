# Shelf

A digital bookstore and reader platform built with React, Node.js, Express and MongoDB.
Public-domain books are imported from Project Gutenberg; their text is fetched on demand
and cached on disk, so each book stays a few KB in the database.

## Features
- Browse page with search, genre filter, sorting and pagination; reader with chapter headings, saved reading progress and a dark/light theme
- Reviews (write, edit, delete your own; admins can moderate) and a profile page (name, password)
- Accounts with JWT (httpOnly cookie), email verification, password reset, genre onboarding, bookmarks, favourites and reviews
- Admin panel: add books, edit chapter titles, search and import from Project Gutenberg, add many Gutenberg books by pasting ids/links
- Upload your own books as PDF, EPUB or TXT (max 25 MB). They are split into chapters and pages automatically and saved as a
  draft: check the details, then tick Published. Scanned (picture-only) PDFs are rejected. Only upload books you have the rights to.
- Chapter list with search, reverse order, per-chapter bookmarks and reading folders (Reading, Completed, On-Hold, Plan to Read, Dropped)

## Stack
- **Client:** React 19, Vite, Tailwind 4, react-router, zustand, react-query
- **Server:** Express 5, Mongoose, JWT, zod validation, helmet, express-rate-limit

## Setup
Requires Node 18+ and a MongoDB instance.

```bash
git clone https://github.com/Mashrafi55/shelf.git
cd shelf

# server
cd server
cp .env.example .env      # then edit the values
npm install
npm run dev               # http://localhost:5000

# client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Server scripts (run from `server/`)
| Command | What it does |
|---|---|
| `npm run seed [id ...]` | Add Gutenberg books by ID (default: a list of popular classics). Stores metadata only. |
| `npm run warm` | Download and split every Gutenberg book into the disk cache (`server/cache`) so first reads are instant. |
| `npm run create-admin` | Create (or promote) an admin: `ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='...' npm run create-admin`. |
| `npm run export` | Dump users and books to `server/backups/<timestamp>.json`. |

## Environment variables
| Variable | Where | Description |
|---|---|---|
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret used to sign login tokens |
| `PORT` | server | API port (default 5000) |
| `CLIENT_ORIGIN` | server | Allowed CORS origin(s), comma-separated |
| `TRUST_PROXY` | server | Set to `1` behind a reverse proxy so rate limits see real IPs |
| `COOKIE_SAMESITE` | server | `lax` (default) or `none` for cross-site hosting over https |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | server | Email settings for verification and password reset. Without `SMTP_HOST`, emails are printed to the server console. |
| `CACHE_MAX_MB` | server | Size cap for the Gutenberg disk cache (default 500) |
| `VITE_API_URL` | client | API base URL (default `http://localhost:5000/api`) |
