# Viveka College Website

Modern educational website with a branded public frontend and a JWT-protected admin API.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js
- Database: Supabase Postgres + Storage
- Authentication: JWT admin login
- Uploads: Multer to Supabase Storage, Cloudinary-ready structure

## Features

- Responsive home, about, courses, gallery, contact, and apply pages
- Dynamic course detail routes
- Search, category filters, and gallery lightbox
- Validation and toast notifications on forms
- Admin dashboard with protected API access
- REST APIs for auth, courses, gallery, applications, contact, and content
- SEO-friendly metadata, sitemap, and robots support

## Folder Structure

```text
vivekacollege/
├── client/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
└── server/
    ├── index.js
    └── src/
        ├── controllers/
        ├── lib/
        ├── middleware/
        └── routes/
```

## Installation

```bash
cd server
npm install

cd ../client
npm install
```

## Environment Setup

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=applications
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Create `client/.env.local` from `client/.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Default Admin

```text
admin@vivekacollege.edu
adminpassword123
```

## Development

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

## Deployment

Frontend:
- Build with `npm run build` in `client`
- Deploy on Vercel or any Node-capable host
- Set `NEXT_PUBLIC_API_URL` to the deployed API URL

Backend:
- Deploy `server` on Render, Railway, Fly.io, or a VM
- Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CLIENT_URL`, and Cloudinary variables
- Ensure the backend can reach Supabase Storage and the Supabase project is configured with the expected tables

Database:
- Use Supabase Postgres for production
- Create the admin record and the expected tables in Supabase, then manage access with Supabase RLS policies

## API Overview

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/courses`
- `GET /api/courses/slug/:slug`
- `POST /api/courses`
- `GET /api/gallery`
- `POST /api/gallery`
- `POST /api/applications`
- `GET /api/applications`
- `POST /api/contact`
- `GET /api/contact`
- `GET /api/content`
- `PUT /api/content/:key`

