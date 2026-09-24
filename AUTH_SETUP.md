# Email authentication setup

## 1. Install and configure

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` with an SMTP account. For Gmail, enable 2-Step Verification and create an App Password; do not use the normal Gmail password.

## 2. Run

```powershell
npm start
```

Open `http://localhost:3000`. The server serves the frontend and exposes:

- `POST /api/auth/register` - create a pending registration and send a 6-digit OTP
- `POST /api/auth/verify` - verify the OTP and create the user
- `POST /api/auth/resend` - send a new OTP
- `POST /api/auth/login` - log in with a verified account
- `GET /api/auth/me` - validate the session token
- `POST /api/auth/logout` - invalidate the session token

Without SMTP variables, development mode prints the OTP in the server terminal and returns it to the frontend for local testing. Never run that mode in production.

## 3. PostgreSQL database

The server supports PostgreSQL through the `DATABASE_URL` environment variable. Create a database with your provider (Neon, Supabase, Render, Railway, or a local PostgreSQL server), then add its connection string to `.env`:

```env
DATABASE_URL=postgresql://username:password@host:5432/arcade_hub
DATABASE_SSL=true
```

For a local PostgreSQL instance, use `DATABASE_SSL=false`. Run `npm start`; the server creates the `arcade_state` table automatically. On the first connection, existing data from `data/users.json` and `data/reports.json` is migrated into PostgreSQL. Once `DATABASE_URL` is present, new users, locks, reports, appeals, and notifications are stored in PostgreSQL.

Keep `.env` private and never commit the database password. If `DATABASE_URL` is omitted, the app keeps using the local JSON files for development.
