# PrayCounter App

A Minimal Spiritual Counter (Web + Android APK)

## Overview

PrayCounter is a minimal and distraction-free spiritual counting application built as a web app and packaged as an Android APK using Capacitor.

The app allows users to:

* Count daily prayers / dhikr / mantra repetitions
* Track loop-based bead goals (e.g., 33, 108, custom value)
* View total lifetime count
* Customize vibration intensity
* Use ultra-dim night mode for meditation focus

The design philosophy is calm, minimal, and non-distracting, focused on devotion and presence.

## Platforms

*  **Web Application** (Firebase hosted)
* **Android APK** (Capacitor build)
*  **Firebase Authentication & Realtime Database**
*  **Native vibration support** (Android bridge + navigator.vibrate fallback)

## Core Features

### Counter System
* Tap anywhere to increment
* Loop system (Beads per loop configurable)
* Total tap count stored in Firebase
* Derived loop + bead calculation
* Clean pulse animation on tap

### Ultra-Dim Night Mode
* CSS-only toggle
* Reduced glow and brightness
* Meditation-friendly UI
* Maintains animation consistency

### Haptic Feedback
* Adjustable vibration intensity (ms)
* **Uses:**
    * `window.AndroidApp.vibrate()` (APK native)
    * `navigator.vibrate()` (browser fallback)
* Works even if phone is on silent mode (Android).

### User System
* Firebase Authentication
* Per-user stored tap history
* Auth state protection
* Redirect if not logged in

### Profile Settings
* Edit display name
* View total taps
* View loop count
* Change beads per loop
* Adjust vibration intensity
* Save settings locally (localStorage) + Firebase

### Notes System
* Create notes
* Edit notes
* Character counter
* Save to Firebase
* Auth-protected notes

## Chat & Messaging Module

PrayCounter includes a lightweight in-app chat/messaging system for quick communication between users, designed to stay minimal while still being functional.

### Features

* **Send messages in real-time** (Firebase-backed)
* **Conversation-based UI** (thread style)
* **Delete message support**
  * Allows removing messages from the chat thread
  * Keeps the UI consistent after deletion
* **Active / Inactive user status**
  * Users can be marked as active or inactive
  * UI reflects presence/state (useful for understanding if the user is currently using the app)

### Security & Isolation

* Auth-protected chat access
* Messages are stored under user-specific / conversation-specific nodes
* Only logged-in users can read/write their permitted chat threads

### Engineering Notes

Chat is intentionally kept simple (no heavy framework) to maintain:
* Fast load time
* Low distraction
* Clean database writes

**Delete** is handled as a proper state update (not only UI removal), ensuring consistency across devices.

## Project Structure

```text
PrayCounterApp/
│
├── index.html
├── counter.html
├── settings.html
├── notes.html
├── inbox.html
├── login.html
│
├── js/
│   ├── counter.js
│   ├── settings.js
│   ├── theme.js
│   ├── notes.js
│   └── firebase/
│       └── firebase-init.js
│
├── public/
├── resources/
│
├── capacitor.config.json
├── firebase.json
└── package.json
```

# Architecture Overview

## Data Model

Only one value is permanently stored:
Loop and bead numbers are derived:
* `loopCount = Math.floor(jaapCount / BEADS_PER_LOOP)`
* `beadCount = jaapCount % BEADS_PER_LOOP`

This ensures:
* No redundant storage
* Clean calculation logic
* Flexible loop goals

## Firebase Integration

### Services Used
* Firebase Auth
* Firebase Realtime Database

---

## APK Build

The web app is wrapped using Capacitor.

### Build Process
```bash
npm install
npx cap add android
npx cap copy
npx cap open android
```
APK generated via Android Studio.

The Android version enables native vibration using:
`window.AndroidApp.vibrate(intensity)`

## UI Philosophy
* Dark-first design
* Minimal contrast
* Soft animation
* Spiritual tone
* No bright distracting colors
* Clean typography
* Large tap surface
* Mobile-first layout

## Animation System
* Counter uses CSS pulse animation

## Offline Behavior
* Counter increments locally
* Save to Firebase is debounced
* If offline, save waits until reconnect
* APK logic remains functional

## Tech Stack
* HTML5
* CSS3 (custom, no heavy frameworks)
* Vanilla JavaScript
* Firebase v8
* Capacitor
* Bootstrap Icons
* LocalStorage

## Future Improvements
* Version control kill switch
* Loop completion vibration pattern
* Export tap history
* Analytics dashboard
* iOS PWA optimization
* Admin control panel
* Daily streak tracking

## Purpose
This project was built to combine:
* Spiritual discipline
* Clean UI design
* Real-time backend architecture
* Mobile packaging experience
* Firebase security practice

**It serves both as:**
* A usable devotional tool
* A portfolio-ready full-stack mini project

## License

Personal project.  
Copyright © 2026 **[Tanmoy Das]** Not for commercial redistribution without permission.