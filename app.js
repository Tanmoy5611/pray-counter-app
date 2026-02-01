// ✅ app.js – Tap Counter with Plus/Minus & Firebase Sync

let tapCount = 0;
let currentUser = null;

// Firebase services (initialized in firebase-init.js)
const auth = firebase.auth();
const db = firebase.database();

// DOM elements
const tapButton = document.getElementById("tapButton");
const tapDisplay = document.getElementById("tap-count");
const bubbleContainer = document.getElementById("bubbleContainer");

// NEW BUTTONS
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

// 🔔 Premium Haptic Feedback
function hapticTap() {
    if (navigator.vibrate) {
        navigator.vibrate(40);   // short vibration
    }
}

// -------------------------------------------------------
// 🔵 Bubble visual effect
// -------------------------------------------------------
function showBubbleEffect(x, y) {
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubbleContainer.appendChild(bubble);

    setTimeout(() => bubble.remove(), 1000);
}

// -------------------------------------------------------
// 🔵 Load tap count from Firebase
// -------------------------------------------------------
function loadTapCount() {
    if (!currentUser) return;

    const uid = currentUser.uid;

    db.ref("taps/" + uid)
        .once("value")
        .then(snapshot => {
            tapCount = snapshot.val() || 0;
            tapDisplay.textContent = tapCount;
        })
        .catch(err => {
            console.error("Error loading count:", err);
        });
}

// -------------------------------------------------------
// 🔵 Save tap count to Firebase
// -------------------------------------------------------
function saveTapCount() {
    if (!currentUser) return;

    const uid = currentUser.uid;

    db.ref("taps/" + uid)
        .set(tapCount)
        .then(() => console.log("Saved:", tapCount))
        .catch(err => console.error("Save error:", err));
}

// -------------------------------------------------------
// 🔵 Go to notes page
// -------------------------------------------------------
function goToNotes() {
    window.location.href = "notes.html";
}

// -------------------------------------------------------
// 🔵 Sign out
// -------------------------------------------------------
function signOut() {
    auth.signOut()
        .then(() => {
            tapCount = 0;
            tapDisplay.textContent = "0";
            window.location.href = "login.html";
        })
        .catch(err => {
            console.error("Signout error:", err);
        });
}

// -------------------------------------------------------
// 🔵 MAIN APP LOGIC
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

    // 🔥 Check login state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadTapCount();
        } else {
            window.location.href = "login.html";
        }
    });

    // ---------------------------------------------------
    // 🔥 TAP BUTTON — MAIN COUNTER
    // ---------------------------------------------------
    if (tapButton) {
        tapButton.addEventListener("click", e => {

            if (!currentUser) {
                alert("Please log in to continue.");
                return;
            }

            hapticTap();  // 🔥 added vibration

            tapCount++;
            tapDisplay.textContent = tapCount;

            showBubbleEffect(e.clientX, e.clientY);
            saveTapCount();
        });
    }

    // ---------------------------------------------------
    // 🔥 PLUS BUTTON — MANUAL +1
    // ---------------------------------------------------
    if (plusBtn) {
        plusBtn.addEventListener("click", () => {

            if (!currentUser) {
                alert("Please log in to adjust the counter!");
                return;
            }

            hapticTap(); // 🔥 added

            tapCount++;
            tapDisplay.textContent = tapCount;
            saveTapCount();
        });
    }

    // ---------------------------------------------------
    // 🔥 MINUS BUTTON — MANUAL -1
    // ---------------------------------------------------
    if (minusBtn) {
        minusBtn.addEventListener("click", () => {

            if (!currentUser) {
                alert("Please log in to adjust the counter!");
                return;
            }

            if (tapCount > 0) {
                hapticTap(); // 🔥 added

                tapCount--;
                tapDisplay.textContent = tapCount;
                saveTapCount();
            }
        });
    }

    // Make global for HTML buttons
    window.goToNotes = goToNotes;
    window.signOut = signOut;
});