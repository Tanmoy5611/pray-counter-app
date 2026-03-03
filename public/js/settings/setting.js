const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;

// Vibration State Management
let currentVibeIntensity = localStorage.getItem('vibeIntensity') || 40;

// Haptic Feedback Function
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

// Auth & Data Loading
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;

    // Load Name
    db.ref(`users/${user.uid}/profile/name`)
        .once("value")
        .then(snap => {
            const savedName = snap.val() || user.displayName || "";
            const nameInput = document.getElementById("nameInput");
            if (nameInput) nameInput.value = savedName;
        });

    // Load Prayer Count (Home Page)
    db.ref("taps/" + user.uid)
        .once("value")
        .then(snap => {
            const countInput = document.getElementById("totalCountInput");
            if (countInput) countInput.value = snap.val() || 0;
        });

    // Load Nam Jaap Count (Nam Jaap Page)
    db.ref("jaap_taps/" + user.uid)
        .once("value")
        .then(snap => {
            const jaapInput = document.getElementById("jaapCountInput");
            if (jaapInput) jaapInput.value = snap.val() || 0;
        });

    // Load Loop Goal from LocalStorage
    const loopGoalInput = document.getElementById("loopGoalInput");
    if (loopGoalInput) {
        loopGoalInput.value = localStorage.getItem("loopGoal") || 33;
    }
});

// Save Profile & Multi-Count Logic
function saveProfileName() {
    const nameInput = document.getElementById("nameInput");
    const countInput = document.getElementById("totalCountInput");
    const jaapInput = document.getElementById("jaapCountInput");
    const loopGoalInput = document.getElementById("loopGoalInput"); // Added
    const status = document.getElementById("saveStatus");

    if (!currentUser || !nameInput || !countInput || !jaapInput) return;

    const name = nameInput.value.trim();
    const newCount = parseInt(countInput.value);
    const newJaapCount = parseInt(jaapInput.value);

    // Validation
    if (!name) {
        status.textContent = "❌ Name cannot be empty";
        status.style.color = "#ff4444";
        return;
    }

    if (isNaN(newCount) || newCount < 0 || isNaN(newJaapCount) || newJaapCount < 0) {
        status.textContent = "❌ Please enter valid positive numbers";
        status.style.color = "#ff4444";
        return;
    }

    // Save Loop Goal to LocalStorage (Target for /33 or /108)
    if (loopGoalInput) {
        const goalValue = parseInt(loopGoalInput.value) || 33;
        localStorage.setItem("loopGoal", goalValue);
    }

    // Prepare combined updates to avoid multiple separate calls
    const updates = {};
    updates[`users/${currentUser.uid}/profile/name`] = name;
    updates[`users/${currentUser.uid}/profile/updatedAt`] = Date.now();
    updates[`taps/${currentUser.uid}`] = newCount;
    updates[`jaap_taps/${currentUser.uid}`] = newJaapCount;

    // Update Firebase Auth Display Name
    currentUser.updateProfile({ displayName: name });

    // Execute all database updates simultaneously
    db.ref().update(updates)
        .then(() => {
            status.textContent = "✅ All Settings Updated!";
            status.style.color = "#a280ff";

            // Vibrate to confirm save
            hapticTap(60);

            // Return to home after delay
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1200);
        })
        .catch(err => {
            console.error("Save Error:", err);
            status.textContent = "❌ Error saving data";
        });
}

// Vibration Slider Logic-
document.addEventListener("DOMContentLoaded", () => {
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
            hapticTap();
        });
    }
});