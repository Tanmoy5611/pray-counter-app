// Firebase is initialized in firebase-init.js
// This file assumes firebase-init.js is loaded BEFORE this script

// Firebase services
const auth = firebase.auth();
const db = firebase.database();

// DOM elements
const textarea = document.getElementById("noteArea");
const saveStatus = document.getElementById("saveStatus");
const charCounter = document.getElementById("charCounter");

// Configuration
const MAX_CHARS = 100000;
let currentUser = null;

// ===============================
// AUTH STATE LISTENER
// ===============================
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    // If editing an existing note
    const editNoteId = localStorage.getItem("editNoteId");
    if (editNoteId) {
        loadNoteForEdit(editNoteId);
    }

    updateCharCount();
});

// ===============================
// LOAD NOTE FOR EDITING
// ===============================
function loadNoteForEdit(noteId) {
    db.ref(`notes/${currentUser.uid}/${noteId}`)
        .once("value")
        .then(snapshot => {
            if (snapshot.exists()) {
                textarea.value = snapshot.val().text || "";
                updateCharCount();
            }
        })
        .catch(error => {
            console.error("Error loading note:", error.message);
            showStatus("❌ Error loading note.", "red");
        });
}

// ===============================
// SAVE NOTE (NEW OR EDIT)
// ===============================
function saveNote() {
    if (!currentUser) {
        showStatus("⚠️ Please log in.", "orange");
        return;
    }

    const text = textarea.value.trim();

    if (!text) {
        showStatus("⚠️ Note is empty.", "orange");
        return;
    }

    const editNoteId = localStorage.getItem("editNoteId");

    // If editing → update existing note
    const noteRef = editNoteId
        ? db.ref(`notes/${currentUser.uid}/${editNoteId}`)
        : db.ref(`notes/${currentUser.uid}`).push();

    const data = {
        text: text,
        updatedAt: Date.now()
    };

    // Add createdAt only for new notes
    if (!editNoteId) {
        data.createdAt = Date.now();
    }

    noteRef.set(data)
        .then(() => {
            // FIXED: Now uses showStatus to handle the CSS opacity transition
            showStatus("✅ Note saved successfully.", "#25d366");

            localStorage.removeItem("editNoteId");
        })
        .catch(error => {
            console.error("Error saving note:", error.message);
            showStatus("❌ Error saving note.", "red");
        });
}

// ===============================
// CHARACTER COUNTER
// ===============================
function updateCharCount() {
    if (!textarea || !charCounter) return;

    let length = textarea.value.length;

    if (length > MAX_CHARS) {
        textarea.value = textarea.value.substring(0, MAX_CHARS);
        length = MAX_CHARS;
    }

    charCounter.textContent = `${length} characters`;
}

if (textarea) {
    textarea.addEventListener("input", updateCharCount);
}

// ===============================
// NAVIGATION
// ===============================
function goToCounter() {
    window.location.href = "index.html";
}

function goToAllNotes() {
    window.location.href = "all-notes.html";
}

// ===============================
// SIGN OUT
// ===============================
function signOut() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem("editNoteId");
            window.location.href = "login.html";
        })
        .catch(error => {
            console.error("Error signing out:", error.message);
            alert("Error signing out: " + error.message);
        });
}

// ===============================
// VOICE TO TEXT (DICTATION) - FIXED VERSION
// ===============================
let isListening = false;
const micIcon = document.getElementById('micIcon');
const dictationBtn = document.getElementById('dictationBtn');
const languageSelect = document.getElementById('languageSelect');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    // CRITICAL FIX: Disable interimResults to stop duplicate words/fragments.
    // Setting this to false ensures only 100% final sentences are sent to the textarea.
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        let newTranscript = "";

        // Loop through the results starting from the newest index
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                newTranscript += event.results[i][0].transcript;
            }
        }

        if (newTranscript !== "") {
            // Check if textarea is empty to avoid leading space, otherwise append with space
            const currentContent = textarea.value.trim();
            textarea.value = (currentContent ? currentContent + " " : "") + newTranscript.trim() + " ";

            // Sync the character counter
            updateCharCount();
        }
    };

    recognition.onstart = () => {
        isListening = true;
        dictationBtn.classList.add('listening');
        if (micIcon) micIcon.classList.replace('bi-mic', 'bi-mic-fill');
        showStatus(`Listening (${recognition.lang})...`, "#a280ff");
    };

    recognition.onend = () => {
        // Only restart if the user didn't intentionally click 'stop'
        // This prevents the "double instance" bug where two microphones listen at once
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.log("Auto-restart prevented:", e);
            }
        } else {
            stopDictationUI();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === 'not-allowed') {
            showStatus("❌ Mic access denied. Check settings.", "#ff4444");
            isListening = false;
            stopDictationUI();
        } else if (event.error === 'aborted') {
            console.log("Recognition aborted.");
        } else {
            showStatus(`Error: ${event.error}`, "#ff4444");
            isListening = false;
            stopDictationUI();
        }
    };

    window.toggleDictation = function() {
        if (!isListening) {
            recognition.lang = languageSelect ? languageSelect.value : 'en-US';
            try {
                recognition.start();
            } catch (e) {
                console.error("Start error:", e);
                // Force a stop then restart if it's stuck in an active state
                recognition.stop();
                setTimeout(() => recognition.start(), 300);
            }
        } else {
            // CRITICAL: Set isListening to false BEFORE calling stop()
            // so the onend event knows not to restart the mic.
            isListening = false;
            recognition.stop();
            stopDictationUI();
        }
    };

    function stopDictationUI() {
        dictationBtn.classList.remove('listening');
        if (micIcon) micIcon.classList.replace('bi-mic-fill', 'bi-mic');
        showStatus("Stopped listening", "#888");
    }

} else {
    console.warn("Speech Recognition not supported in this browser.");
    if (dictationBtn) dictationBtn.style.display = 'none';
    if (languageSelect) languageSelect.style.display = 'none';
}


// ===============================
// COPY TO CLIPBOARD
// ===============================
function copyToClipboard() {
    const copyIcon = document.getElementById('copyIcon');
    const copyBtn = document.getElementById('copyBtn');

    if (!textarea.value.trim()) {
        showStatus("Nothing to copy!", "#ff4444");
        return;
    }

    navigator.clipboard.writeText(textarea.value).then(() => {
        copyIcon.classList.replace('bi-clipboard', 'bi-check-lg');
        copyBtn.style.borderColor = "#25d366";
        copyBtn.style.color = "#25d366";

        setTimeout(() => {
            copyIcon.classList.replace('bi-check-lg', 'bi-clipboard');
            copyBtn.style.borderColor = "";
            copyBtn.style.color = "";
        }, 2000);

        showStatus("Copied to clipboard!", "#25d366");
    }).catch(err => {
        showStatus("Copy failed.", "#ff4444");
    });
}

// ===============================
// UI HELPERS
// ===============================
function showStatus(text, color) {
    if (!saveStatus) return;
    saveStatus.innerText = text;
    saveStatus.style.color = color;
    saveStatus.style.opacity = "1"; // Ensures visibility in your Elite UI

    setTimeout(() => {
        saveStatus.style.opacity = "0";
    }, 3000);
}

// ===============================
// EXPOSE FUNCTIONS FOR HTML
// ===============================
window.saveNote = saveNote;
window.goToCounter = goToCounter;
window.goToAllNotes = goToAllNotes;
window.signOut = signOut;
window.copyToClipboard = copyToClipboard;