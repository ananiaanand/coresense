# Coresense — Dementia Care Pendant & Caregiver Simulation

> **"A Little Pendant. A Little More Peace of Mind."**  
> A dual-interface live pitch demo simulating an intelligent, discreet dementia care pendant and its companion family caregiver mobile application with real-time cross-device synchronization.

---

## 🌟 Pitch Setup (Two Interfaces)

- **Interface A — Hardware Simulator (`/simulator` or `/`)**  
  *Designed for laptop / presenter screen (landscape).*  
  Controls the pendant digital twin, 8 real-time sensor triggers, dynamic time-of-day slider, 5–7 day battery slider, interactive Kerala GPS map, live event log, pairing QR code, and DPDP Act 2023 privacy panel.

- **Interface B — Caregiver App (`/app`)**  
  *Designed for mobile phone / family member's view (portrait PWA).*  
  Receives telemetry in under 1 second. Displays wearer status, battery days remaining, live OpenStreetMap location, full-screen alert overlay with harmonic audio chime, vibration (`navigator.vibrate`), and action buttons (*Acknowledge*, *Call*, *Navigate*). Acknowledging transmits an instant callback back to the simulator screen.

---

## 🚀 Live Pitch Demo Script (Presenter's Guide)

Follow this exact sequence during your pitch presentation to maximize emotional impact and technical credibility:

| Step | Scenario Trigger | Presenter Narrative | What Happens on Screen |
| :--- | :--- | :--- | :--- |
| **1. Hook & Intro** | *Nominal / Safe* | *"Dementia care today forces families to choose between invasive cameras and clunky medical pendants. Coresense is a discreet pendant necklace designed for Indian families, starting in Kerala. It has zero cameras, zero mics, and 5 to 7 days of battery."* | Simulator shows green pulsating LED ring on the hexagonal twin. Phone displays *"Kalyani Amma • Safe & Rested"* with 5.7 days remaining. |
| **2. Dynamic Safe Zones** | *Slide Time to 2:00 PM* then *2:00 AM* | *"Coresense features adaptive geofencing. Notice how the garden courtyard is a safe zone at 2 PM when Kalyani Amma enjoys the sunlight, but automatically becomes restricted at 2 AM to mitigate sundowning risk."* | Map updates safe-zone circle colors dynamically from sage green to restricted peach. |
| **3. Critical Fall Detection** | Click **"Fall detected"** | *"If a sudden fall occurs, the on-device edge IMU detects the high-G impact and immediate floor orientation. Within less than a second..."* | Laptop LED turns pulsing soft red. Phone immediately chimes, vibrates, and triggers the full-screen alert overlay: *"വീഴ്ച തിരിച്ചറിഞ്ഞു! / Fall Detected!"*. |
| **4. Caregiver Feedback Loop** | Tap **"Acknowledge Alert"** on phone | *"The caregiver isn't helpless. Ananya taps 'Acknowledge'—instantly letting the simulator know help is on the way."* | Phone plays soothing ascending confirmation tone. Simulator displays green banner: *"Caregiver Responded in Real Time!"* with timestamp. |
| **5. Wandering & Outer Boundary** | Click **"Left safe zone (wandering)"** | *"If Kalyani Amma leaves the compound toward the main Kakkanad bypass unaccompanied..."* | Map pin shifts to outer junction road. Phone displays boundary breach alert with one-tap Google Maps navigation. |
| **6. Cellular Drop & SMS Backup** | Click **"Mobile data lost -> SMS backup"** | *"In real-world Kerala, 4G drops during monsoons. Coresense never goes dark. It switches automatically to an encrypted cellular SMS modem bridge."* | Alert on phone shifts into an authentic SMS notification bubble from `CORESENSE-ALERT-IN` via BSNL/Airtel fallback. |
| **7. Indian DPDP Act 2023 & Pilots** | Click **"Return to normal"** | *"All ML runs on-device. No audio or video is ever collected, complying fully with India's DPDP Act 2023. Prototype features and battery life will be validated in our upcoming field pilots."* | LED returns to calm green. Telemetry resets cleanly. |

---

## 🎨 Design System: Neumorphic Soft UI

- **Dark Theme (Default)**:
  - Base Background: `#2A2527` (warm charcoal)
  - Surface Raised: `#302A2C`
  - Neumorphic Shadows: dark `#1F1B1C`, light `#382F32`
  - Primary Text: `#F5EFE9` • Muted Text: `#B8A9A0`
  - Accent Peach: `#F0A9A0` (primary tactile buttons)
  - Status Colors: Sage Green `#9CCDB0` (Safe), Sky Blue `#A9C8E3` (Info), Peach `#F0A9A0` (Warning), Soft Red `#E57373` (Critical)
- **Light Theme**: Warm base `#F1ECE6`, soft shadows `#D4CEC6 / #FFFFFF`
- **Typography**: Google Font *Plus Jakarta Sans* with tight-tracking bold headings and rounded radii (24px to 40px).

---

## ⚡ Real-Time Sync Setup (Supabase)

Coresense uses **Supabase Realtime Broadcast channels** to sync events between any two devices across the internet without requiring database tables or servers:

1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project (e.g., `coresense-demo`).
3. In your Supabase Dashboard, navigate to **Project Settings** → **API**.
4. Copy your **Project URL** and **Project API Key (`anon` `public`)**.
5. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. Open `/simulator` on your laptop and scan the QR code with your phone (`/app?room=XXXX`). Both devices join `coresense-room-XXXX` and synchronize in under 400ms.

---

## 🚢 Deployment to Vercel

Coresense is pre-configured with `vercel.json` SPA rewrites so that `/simulator` and `/app` route cleanly on Vercel without 404 errors.

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Via GitHub & Vercel Dashboard
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New...** → **Project** and import your repository.
3. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
4. Click **Deploy**.
5. Once deployed:
   - Open `https://your-app.vercel.app/simulator` on your laptop.
   - Scan the on-screen QR code with your phone camera to pair.

---

## 📁 Project Structure

```
CoreSense/
├── public/
│   ├── icon.svg             # Hexagonal pendant necklace PWA emblem
│   └── manifest.json        # PWA manifest for "Add to Home Screen"
├── src/
│   ├── components/
│   │   ├── KeralaMap.tsx    # Leaflet map centered in Kerala with safe-zone circles
│   │   └── PendantDigitalTwin.tsx # Neumorphic hexagon twin with pulsing LED ring
│   ├── services/
│   │   ├── data.ts          # Kerala home coordinates, safe zones, and scenario logic
│   │   ├── i18n.ts          # Authentic English & Malayalam translations
│   │   ├── realtime.ts      # Multi-client Supabase broadcast & offline fallback engine
│   │   ├── sound.ts         # Web Audio API harmonic alert chimes & SMS tones
│   │   └── vibration.ts     # Navigator.vibrate mobile haptics
│   ├── views/
│   │   ├── SimulatorView.tsx    # Interface A (Laptop simulator)
│   │   └── CaregiverAppView.tsx # Interface B (Mobile Caregiver PWA)
│   ├── types/
│   │   └── index.ts         # Telemetry, AlertEvent, and PendantState TypeScript types
│   ├── App.tsx              # Central router and dark/light theme engine
│   ├── main.tsx             # React entry point
│   └── index.css            # Neumorphic styling tokens and custom scrollbars
├── .env.example             # Supabase configuration template
├── package.json             # React 18, Vite, Tailwind, Framer Motion, Leaflet, Lucide
├── tailwind.config.js       # Neumorphic palette, shadows, and radii
├── tsconfig.json            # TypeScript bundler configuration
└── vercel.json              # Vercel SPA rewrites for client-side routes
```
