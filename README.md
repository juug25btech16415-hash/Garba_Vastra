# Garba Vastra

A chaniya choli storefront: guest browsing, live stock counts, Razorpay checkout, order tracking, and an admin dashboard to manage products and orders.

## Stack
- **Frontend:** React + Vite + Tailwind, deployed free on Vercel
- **Database + Auth + Realtime + Image storage:** Supabase (free tier)
- **Payments:** Razorpay
- **Backend logic:** Two serverless functions in `/api`, run free on Vercel

## One-time setup

1. **Database:** In Supabase → SQL Editor, run `supabase-schema.sql` (this replaces any earlier tables).
2. **Admin login:** In Supabase → Authentication → Users → Add User, create your own login (the email/password you'll use at `/admin/login`).
3. **Environment variables:** Copy `.env.example` to `.env` and fill in the real values for local dev. On Vercel, add the same variables under Project Settings → Environment Variables (see below — some are frontend-safe, some must stay server-only).
4. **Install & run locally:**
   ```
   npm install
   npm run dev
   ```

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel + `.env` | Safe to expose |
| `VITE_SUPABASE_ANON_KEY` | Vercel + `.env` | Safe to expose (this key only allows what RLS policies permit) |
| `VITE_RAZORPAY_KEY_ID` | Vercel + `.env` | Safe to expose (public key) |
| `SUPABASE_URL` | Vercel only | Same URL, used server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | **Secret.** Bypasses all security rules — never expose to the browser or commit it |
| `RAZORPAY_KEY_ID` | Vercel only | Same as above, used server-side |
| `RAZORPAY_KEY_SECRET` | Vercel only | **Secret.** Used to create orders and verify payment signatures |

## Deploying

1. Push this code to your GitHub repo.
2. On vercel.com → Add New Project → Import your repo.
3. Add all 7 environment variables above.
4. Deploy. Vercel auto-detects Vite for the frontend and turns `/api/*.js` into serverless functions.

## Going live with real payments

Right now `RAZORPAY_KEY_ID`/`SECRET` should be your **Test Mode** keys, so you can place test orders safely. When ready for real sales: finish Razorpay KYC, switch to **Live Mode** keys in the Razorpay dashboard, and swap the 4 Razorpay-related env vars on Vercel to the live versions.

## Admin dashboard

Visit `/admin/login`, sign in, and you can:
- Add products — by pasting an image URL **or** uploading a photo directly (stored in Supabase for free)
- Edit price, stock, sizes, colors, visibility
- One-click restock
- View orders and update status / add courier tracking info, which customers see live at `/track`
