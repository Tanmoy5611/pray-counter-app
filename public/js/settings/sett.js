// =======================================================
// SETTINGS & PROFILE MANAGEMENT
// =======================================================

const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;

// Vibration State Management (Local to this page)
let currentVibeIntensity = localStorage.getItem('vibeIntensity') || 40;

// 🔔 Haptic Feedback Function (Needed for Slider Test)
function hapticTap(customIntensity = null) {
    const intensity = customIntensity || parseInt(currentVibeIntensity);
    if (intensity === 0) return;

    if (navigator.vibrate) {
        navigator.vibrate(intensity);
    }
    else if (window.AndroidApp && window.AndroidApp.vibrate) {
        window.AndroidApp.vibrate(intensity);
    }
}

// --- Auth & Data Loading ---
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;

    // Load name from Database
    db.ref(`users/${user.uid}/profile/name`)
        .once("value")
        .then(snap => {
            const savedName = snap.val() || user.displayName || "";
            const nameInput = document.getElementById("nameInput");
            if (nameInput) nameInput.value = savedName;
        });
});

// --- Save Profile Logic ---
function saveProfileName() {
    const nameInput = document.getElementById("nameInput");
    const status = document.getElementById("saveStatus");

    if (!nameInput || !currentUser) return;
    const name = nameInput.value.trim();

    if (!name) {
        status.textContent = "❌ Name cannot be empty";
        status.style.color = "#ff4444";
        return;
    }

    // Save to Firebase Auth
    currentUser.updateProfile({ displayName: name });

    // Save to Realtime Database
    db.ref(`users/${currentUser.uid}/profile`).update({
        name,
        updatedAt: Date.now()
    }).then(() => {
        status.textContent = "✅ Saved successfully";
        status.style.color = "#a280ff";

        // Vibrate to confirm save
        hapticTap(60);

        // Optional: Return to home
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    }).catch(err => {
        console.error(err);
        status.textContent = "❌ Error saving";
    });
}

// --- Vibration Slider Logic ---
document.addEventListener("DOMContentLoaded", () => {
    const vibeSlider = document.getElementById('vibeIntensity');
    const vibeValueDisplay = document.getElementById('vibeValue');

    if (vibeSlider) {
        // Initialize UI from memory
        vibeSlider.value = currentVibeIntensity;
        if (vibeValueDisplay) vibeValueDisplay.textContent = currentVibeIntensity + "ms";

        // Update display as user slides
        vibeSlider.addEventListener('input', (e) => {
            currentVibeIntensity = e.target.value;
            if (vibeValueDisplay) vibeValueDisplay.textContent = currentVibeIntensity + "ms";
        });

        // Save and Test Vibrate when user lets go
        vibeSlider.addEventListener('change', () => {
            localStorage.setItem('vibeIntensity', currentVibeIntensity);
            hapticTap();
        });
    }
});