// ✅ notes.js

// IMPORTANT: Firebase is now initialized in 'firebase-init.js'.
// This file assumes 'firebase-init.js' is loaded BEFORE 'notes.js' in your HTML.

// Access Firebase services directly, assuming they've been initialized
const auth = firebase.auth();
const db = firebase.database();

const textarea = document.getElementById("noteArea");
const saveStatus = document.getElementById("saveStatus");
let currentUser = null; // Will store the authenticated user object

// ✅ Load note from Firebase for the current user
function loadNote(userId) {
    db.ref("notes/" + userId).once("value") // Use the 'db' object
        .then(snapshot => {
            const noteData = snapshot.val();
            if (noteData && noteData.content !== undefined) {
                textarea.value = noteData.content;
                console.log("Note loaded successfully.");
            } else {
                textarea.value = ""; // Clear textarea if no note exists
                console.log("No note found for this user.");
            }
        })
        .catch(error => {
            console.error("Error loading note:", error);
            saveStatus.textContent = "❌ Error loading note.";
            saveStatus.style.color = "red";
        });
}

// ✅ Save note to Firebase for the current user
function saveNote() {
    const note = textarea.value.trim();
    if (!currentUser) { // Guard clause for no user
        saveStatus.textContent = "⚠️ Please log in to save notes.";
        saveStatus.style.color = "orange";
        console.warn("Attempted to save note without a logged-in user.");
        return;
    }
    if (note.length === 0) { // Guard clause for empty note
        saveStatus.textContent = "⚠️ Note is empty. Nothing to save.";
        saveStatus.style.color = "red";
        return;
    }

    db.ref("notes/" + currentUser.uid).set({ // Use the 'db' object
        content: note,
        updatedAt: Date.now()
    })
        .then(() => {
            saveStatus.textContent = "✅ Note saved!";
            saveStatus.style.color = "green";
            console.log("Note saved successfully.");
            // Clear status after a few seconds
            setTimeout(() => saveStatus.textContent = "", 3000);
        })
        .catch(error => {
            console.error("Error saving note:", error);
            saveStatus.textContent = "❌ Error saving note.";
            saveStatus.style.color = "red";
        });
}

// 🔁 Go back to tap counter
function goToCounter() {
    window.location.href = "index.html";
}

// 🚪 Sign out
function signOut() {
    auth.signOut() // Use the 'auth' object
        .then(() => {
            console.log("User signed out from notes page.");
            window.location.href = "login.html";
        })
        .catch(error => {
            console.error("Error signing out:", error);
            alert("Error signing out: " + error.message);
        });
}

// ✅ Check login status when the script loads
// This listener will fire immediately if a user is already signed in
// or when a user's authentication state changes.
auth.onAuthStateChanged(user => { // Use the 'auth' object
    if (user) {
        currentUser = user;
        console.log("User is signed in on notes page:", user.email, user.uid);
        loadNote(user.uid); // Load the user's note
    } else {
        console.log("No user signed in on notes page. Redirecting to login.");
        window.location.href = "login.html"; // Redirect if not authenticated
    }
});

// Expose functions globally so they can be called from HTML `onclick` attributes
window.saveNote = saveNote;
window.goToCounter = goToCounter;
window.signOut = signOut;
