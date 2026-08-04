# PrinsGo Enterprise Customer App

The premium, production-ready mobile customer client for the PrinsGo ecosystem. Built on **Expo (SDK 51)** and **React Native**, this client is fully integrated with the live `prinsgo-backend` REST and real-time Socket.IO APIs.

---

## 🎨 Enterprise Design Language

The application follows the corporate design guidelines strictly to establish a premium and highly professional user experience:
- **White Background:** Pristine, uncluttered canvas (`#FFFFFF`) to present information clearly.
- **Premium Yellow Accent:** Distinct primary accent color (`#FFC72C`) utilized for core actions, buttons, active highlights, and state badges.
- **Dark Navy Typography:** Highly legible, modern, and sophisticated typographic hierarchy (`#0A0F24`).
- **Functional Semantics:** Functional colors are used only where semantically necessary (Green for success/completions, Red for errors/cancellations, Orange/Grey for minor highlights).

Branding, colors, and layout metrics are fully centralized in `src/utils/theme.js`.

---

## ⚡ Key Integrated Capabilities

Every screen in the customer app is fully active and wired to live backend services with **zero dummy data or fake endpoints**:

### 1. Secure Authentication & Onboarding
- **Onboarding & Splash:** Seamless onboarding with device session tracking using `AsyncStorage`.
- **OTP Verification:** Dynamic 6-digit numeric OTP request and authentication via `POST /api/auth/send-otp` and `/api/auth/verify-otp`.
- **Name Registration:** Intelligent first-time signup detector, prompting the user for their registration name upon the first OTP verification.
- **JWT Protection:** Automatic authorization token headers on every outbound request with secure storage.

### 2. Live Ride Bookings & Map Tracking
- **Fare Estimation:** Multi-vehicle fare estimates (Bike, Auto, Mini Car, Sedan) utilizing live distance matrix calculations from Google Maps.
- **Ride Booking:** Real-time dispatching to nearby drivers via `POST /api/rides/book`.
- **Live Ride Map Tracking:** Dynamic driver coordinate rendering on `MapView` utilizing Socket.IO channels (`join_ride_room`).
- **Verification OTP:** Driver verification code display to securely start trips.
- **Cancellation & Ratings:** Secure, pre-pickup cancellation alerts and completion feedback ratings.

### 3. Doorstep Parcel Logistics
- **Cargo Specifications:** Multi-category weight classifications (up to 1kg, 5kg, 10kg, 20kg) and custom parcel categorizations (document, food, electronics, clothing, fragile, other).
- **Consignment Details:** Dual-party sender and receiver contact validations.
- **Settle & Track:** Interactive drop-off receiver OTP verification and real-time transit status indicators.

### 4. Enterprise Wallet & Bank Settle
- **Audit Logs:** Full paginated transactions list displaying credit, debit, refund, referral, and manual adjustments.
- **UPI & Bank Top-ups:** Rich manual fund loading instructions reflecting live values (UPI ID, QR, Bank accounts) configured in `AdminSettings`.

### 5. Dynamic Admin Panels Integration (Option A)
- **Dynamic Banners Slider:** Slideshow representing active admin campaign banners retrieved from `GET /api/auth/banners`.
- **Feature Toggles:** Real-time locks. The app dynamically disables or hides Ride/Parcel modes if turned off by admin toggles.
- **Maintenance Mode:** Intercepts entry if `maintenance_mode` toggle is switched on by admins, rendering a clean under-maintenance interface.
- **Support Inbox:** Inbox notification records retrieved from `GET /api/auth/notifications`.

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (v18 or above recommended)
- npm or yarn

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure base endpoint inside `src/api/config.js`:
   ```javascript
   export const API_BASE_URL = 'https://prinsgo-backend.onrender.com';
   ```

3. Launch local bundler:
   ```bash
   npm start
   ```
