// =======================================================
// PRAY COUNTER - FULL INTEGRATED ENGINE
// =======================================================

let tapCount = 0;
let currentUser = null;

// Firebase services (initialized in firebase-init.js)
const auth = firebase.auth();
const db = firebase.database();

// DOM elements
const tapButton = document.getElementById("tapButton");
const tapDisplay = document.getElementById("tap-count");
const bubbleContainer = document.getElementById("bubbleContainer");
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

// Vibration State Management
let currentVibeIntensity = localStorage.getItem('vibeIntensity') || 40;

// ===============================
// 🔔 DYNAMIC HAPTIC FEEDBACK
// ===============================
function hapticTap(customIntensity = null) {
    const intensity = customIntensity || parseInt(currentVibeIntensity);

    if (intensity === 0) return; // Silent mode

    // 1. Try standard Web API (Works in most mobile browsers)
    if (navigator.vibrate) {
        navigator.vibrate(intensity);
    }
    // 2. Fallback to Android Studio Java Bridge
    else if (window.AndroidApp && window.AndroidApp.vibrate) {
        window.AndroidApp.vibrate(intensity);
    }
}

// ===============================
// REAL-TIME GREETING + QUOTES
// ===============================
function setupGreeting(user) {
    const greetingLine = document.getElementById("greetingLine");
    const quoteEl = document.getElementById("spiritualQuote");

    if (!greetingLine || !quoteEl) return;

    const hour = new Date().getHours();
    let greeting = "";
    let quote = "";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning 🌅";
        quote = "Start the day with purity of thought and devotion.";
    }
    else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon ☀️";
        quote = "Perform your duty with a calm and steady mind.";
    }
    else {
        greeting = "Good Evening 🌙";
        quote = "Let go of the day, surrender all to the Divine.";
    }

    const name = user.displayName || "Seeker";
    greetingLine.textContent = `${greeting}, ${name}`;
    quoteEl.textContent = `“${quote}”`;
}

// ===============================
// VISUAL EFFECTS & DATA SYNC
// ===============================
function showBubbleEffect(x, y) {
    if (!bubbleContainer) return;
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubbleContainer.appendChild(bubble);

    setTimeout(() => bubble.remove(), 1000);
}

function loadTapCount() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    db.ref("taps/" + uid).once("value").then(snapshot => {
        tapCount = snapshot.val() || 0;
        if (tapDisplay) tapDisplay.textContent = tapCount;
    }).catch(err => console.error("Error loading count:", err));
}

function saveTapCount() {
    if (!currentUser) return;
    db.ref("taps/" + currentUser.uid).set(tapCount)
        .then(() => console.log("Saved:", tapCount))
        .catch(err => console.error("Save error:", err));
}

// ===============================
// MAIN APP LOGIC
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    // 1. Firebase Auth Listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadTapCount();
            setupGreeting(user);
        } else {
            // Only redirect if we aren't already on login
            if (!window.location.href.includes("login.html")) {
                window.location.href = "login.html";
            }
        }
    });

    // 2. Settings Slider Listener (If present on page)
    const vibeSlider = document.getElementById('vibeIntensity');
    const vibeValueDisplay = document.getElementById('vibeValue');

    if (vibeSlider) {
        vibeSlider.value = currentVibeIntensity;
        if (vibeValueDisplay) vibeValueDisplay.textContent = currentVibeIntensity + "ms";

        vibeSlider.addEventListener('input', (e) => {
            currentVibeIntensity = e.target.value;
            if (vibeValueDisplay) vibeValueDisplay.textContent = currentVibeIntensity + "ms";
        });

        vibeSlider.addEventListener('change', () => {
            localStorage.setItem('vibeIntensity', currentVibeIntensity);
            hapticTap(); // Feedback for the user
        });
    }

    // 3. Counter Interactions
    if (tapButton) {
        tapButton.addEventListener("click", e => {
            if (!currentUser) return alert("Please log in to continue.");

            hapticTap();
            tapCount++;
            tapDisplay.textContent = tapCount;
            showBubbleEffect(e.clientX, e.clientY);
            saveTapCount();
        });
    }

    if (plusBtn) {
        plusBtn.addEventListener("click", () => {
            if (!currentUser) return;
            hapticTap();
            tapCount++;
            tapDisplay.textContent = tapCount;
            saveTapCount();
        });
    }

    if (minusBtn) {
        minusBtn.addEventListener("click", () => {
            if (!currentUser) return;
            if (tapCount > 0) {
                hapticTap();
                tapCount--;
                tapDisplay.textContent = tapCount;
                saveTapCount();
            }
        });
    }

    // Global Functions for HTML onClick
    window.goToNotes = () => window.location.href = "notes.html";
    window.signOut = () => {
        auth.signOut().then(() => {
            tapCount = 0;
            window.location.href = "login.html";
        });
    };
});