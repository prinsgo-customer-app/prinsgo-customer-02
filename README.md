# PrinsGo Customer App — Phase 1

Built against `prinsgo-backend` routes: `/api/auth`, `/api/rides`, `/api/parcels`, `/api/wallet`, `/api/places`.

## ⚠️ Do this first
Your uploaded `.env.example` had **real, live credentials** in it (Mongo password,
JWT secret, Razorpay keys, Cloudinary secret, Firebase private key). Rotate all of
these now if the repo is public, and keep only placeholder values in `.env.example`
going forward — real values belong only in a local `.env` that's git-ignored.

## Setup (Termux / any machine with Node)
```bash
cd prinsgo-customer
npm install
```
Edit `src/api/config.js` and set `API_BASE_URL` to your deployed backend
(e.g. `https://prinsgo-backend.onrender.com`).

```bash
npx expo start
```
Scan the QR with Expo Go on your phone.

## What's included (Phase 1 — working end to end)
- Phone OTP login/register (`/api/auth/send-otp`, `/verify-otp`)
- Home screen with Ride/Parcel toggle
- Place search + autocomplete (`/api/places/search`, `/details`)
- Fare estimate → vehicle selection → book ride (`/api/rides/estimate`, `/book`)
- Live ride tracking via Socket.IO (driver location, status, OTP for driver)
- Cancel ride, rate ride after completion

## Not yet built (Phase 2 — next)
- Parcel booking + tracking screens (stubbed as "coming soon")
- Profile, saved addresses management
- Wallet screen, transaction history
- Ride/parcel history list
- Push notifications (FCM token registration)
- Coupons/offers, banners

Tell me when you want Phase 2 and I'll build on this same structure.
