// firebase-init.js
// This file is your ONE central place for Firebase configuration.

const firebaseConfig = {
    apiKey: "AIzaSyCwS7rfzS3NTiPSZ5eocu6BVzBg5ySNn_s",
    authDomain: "tapcounterapp-72afb.firebaseapp.com",
    databaseURL: "https://tapcounterapp-72afb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tapcounterapp-72afb",
    storageBucket: "tapcounterapp-72afb.firebasestorage.app",
    messagingSenderId: "163708274881",
    appId: "1:163708274881:web:2d90b6ea18450e69182c40",
    measurementId: "G-VE39ZM4QMV"
};

// Initialize Firebase once!
firebase.initializeApp(firebaseConfig);

/* =========================
   OFFLINE SUPPORT
   ========================= */

// 1) Keep DB synced + cached locally (works in web + Android WebView)
firebase.database().ref().keepSynced(true);

// 2) Better offline caching in environments that support it
try {
    firebase.database().setPersistenceEnabled(true);
} catch (e) {
    // Some environments may not support this. Safe to ignore.
    console.log("Persistence already enabled or not supported:", e?.message || e);
}