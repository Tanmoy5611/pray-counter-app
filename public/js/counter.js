//  Firebase
const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;

//  Total jaap count (only stored in DB)
let jaapCount = 0;

//  CONFIG (Now loads from Settings)
let BEADS_PER_LOOP = parseInt(localStorage.getItem("loopGoal")) || 33;

//  DERIVED (computed, NEVER stored)
let loopCount = 0;
let beadCount = 0;

// Dom Elements (Match current HTML exactly)

//  Tap Area
const jaapArea = document.getElementById("jaapContainer");

//  Display Elements
const loopText    = document.getElementById("loopText");
const totalText   = document.getElementById("totalText");
const beadNumber  = document.getElementById("beadNumber");
const beadTotalUI = document.getElementById("beadTotal"); // The "/ 33 ✏️" display

//  Haptic Intensity
let currentVibe = localStorage.getItem("vibeIntensity") || 40;

// Haptic Feedback
function hapticFeedback() {
    if (window.AndroidApp) {
        window.AndroidApp.vibrate(parseInt(currentVibe));
    } else if (navigator.vibrate) {
        navigator.vibrate(parseInt(currentVibe));
    }
}

// Derived Loop + Bead from Total
function calculateDerivedCounts() {
    // Ensure to use the latest goal from local storage in case it changed
    BEADS_PER_LOOP = parseInt(localStorage.getItem("loopGoal")) || 33;

    loopCount = Math.floor(jaapCount / BEADS_PER_LOOP);
    beadCount = jaapCount % BEADS_PER_LOOP;

    //  exact loop boundary (e.g. 108 - bead 108, not 0)
    if (beadCount === 0 && jaapCount !== 0) {
        beadCount = BEADS_PER_LOOP;
        loopCount--;
    }
}

// update UI
function updateUI() {
    if (loopText) {
        const newText = `LOOP ${loopCount}`;

        if (loopText.textContent !== newText) {
            loopText.classList.remove("loop-animate");
            void loopText.offsetWidth; // reset animation
            loopText.textContent = newText;
            loopText.classList.add("loop-animate");
        }
    }

    if (totalText) {
        totalText.textContent = `Total ${jaapCount}`;
    }

    if (beadNumber) {
        beadNumber.textContent = beadCount;
    }

    // use to display the  show "/ 108 ✏️" instead of just "/ 33"
    if (beadTotalUI) {
        beadTotalUI.innerHTML = `/ ${BEADS_PER_LOOP} <i class="bi bi-sliders"></i>️`;
    }
}

// auth listener
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    db.ref("jaap_taps/" + user.uid)
        .once("value")
        .then(snapshot => {
            jaapCount = snapshot.val() || 0;

            calculateDerivedCounts();
            updateUI();
        });
});

// Tap handler
jaapArea.addEventListener("pointerdown", (e) => {
    if (!currentUser) return;

    // Prevent default behavior to ensure smooth multi-tap
    e.preventDefault();

    //  Increment TOTAL
    jaapCount++;

    //  Recalculate derived values
    calculateDerivedCounts();
    updateUI();

    // TRIGGER ANIMATION
    if (beadNumber) {
        // Remove class to reset
        beadNumber.classList.remove("pulse-text");

        // Trigger reflow to allow restart
        void beadNumber.offsetWidth;

        // Add class back to play animation
        beadNumber.classList.add("pulse-text");
    }

    //  Feedback
    hapticFeedback();

    //  Save (debounced)
    saveDebounced();
});

// Debounced save (Total only)
let saveTimer;
function saveDebounced() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        if (currentUser) {
            db.ref("jaap_taps/" + currentUser.uid).set(jaapCount);
        }
    }, 1000);
}