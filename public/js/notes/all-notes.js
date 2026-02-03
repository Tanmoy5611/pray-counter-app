// ===============================
// all-notes.js (FIXED & STABLE)
// ===============================

// Firebase
const auth = firebase.auth();
const db = firebase.database();

// DOM
const notesList = document.getElementById("notesList");
const searchInput = document.getElementById("searchInput");

// State
let currentUser = null;
let allNotes = [];

// ===============================
// AUTH CHECK
// ===============================
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadNotes(user.uid);
});

// ===============================
// LOAD NOTES
// ===============================
function loadNotes(uid) {
    db.ref(`notes/${uid}`)
        .once("value")
        .then(snapshot => {
            allNotes = [];
            notesList.innerHTML = "";

            if (!snapshot.exists()) {
                notesList.innerHTML = "<p>No notes yet.</p>";
                return;
            }

            snapshot.forEach(noteSnap => {
                const data = noteSnap.val() || {};

                allNotes.push({
                    id: noteSnap.key,
                    text: data.text || "",
                    updatedAt: data.updatedAt || 0,
                    pinned: data.pinned || false
                });
            });

            sortNewest(); // default view
        })
        .catch(err => {
            console.error(err);
            notesList.innerHTML = "<p>❌ Error loading notes.</p>";
        });
}

// ===============================
// RENDER NOTES
// ===============================
// ===============================
// RENDER NOTES (UI ENHANCED)
// ===============================
function renderNotes(notes) {
    notesList.innerHTML = "";

    if (notes.length === 0) {
        notesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; opacity: 0.5;">
                <i class="bi bi-journal-x" style="font-size: 3rem;"></i>
                <p>No matching notes found.</p>
            </div>`;
        return;
    }

    notes.forEach((note, index) => {
        const dateText = note.updatedAt > 0
            ? new Date(note.updatedAt).toLocaleString()
            : "Unknown date";

        const div = document.createElement("div");
        div.className = "note-card";
        // Staggered animation delay
        div.style.animationDelay = `${index * 0.05}s`;

        div.innerHTML = `
            <div class="card-header">
                <h3>${dateText} ${note.pinned ? '<i class="bi bi-pin-fill" style="color: var(--accent-purple)"></i>' : ""}</h3>
            </div>

            <p class="note-text">
                ${note.text || "<em>(Empty note)</em>"}
            </p>

            <div class="note-actions">
                <button class="edit-btn" onclick="editNote('${note.id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>

                <button class="pin-btn" onclick="togglePin('${note.id}', ${note.pinned})">
                    <i class="bi bi-pin${note.pinned ? "-angle-fill" : ""}"></i>
                    ${note.pinned ? "Unpin" : "Pin"}
                </button>

                <button class="delete-btn" onclick="deleteNote('${note.id}')">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </div>
        `;

        notesList.appendChild(div);
    });
}


// ===============================
// SEARCH
// ===============================
searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    const filtered = allNotes.filter(n =>
        (n.text || "").toLowerCase().includes(q)
    );

    renderNotes(filtered);
});

// SORTING (PINNED NOTES ALWAYS TOP)
// ===============================
function sortNewest() {
    const sorted = [...allNotes].sort((a, b) => {
        // First priority: Pinned status
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        // Second priority: Date
        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    renderNotes(sorted);
}

function sortOldest() {
    const sorted = [...allNotes].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return (a.updatedAt || 0) - (b.updatedAt || 0);
    });
    renderNotes(sorted);
}

// ===============================
// PIN / UNPIN
// ===============================
function togglePin(noteId, isPinned) {
    db.ref(`notes/${currentUser.uid}/${noteId}/pinned`)
        .set(!isPinned)
        .then(() => loadNotes(currentUser.uid))
        .catch(err => console.error("Pin error:", err));
}

// ===============================
// EDIT
// ===============================
function editNote(noteId) {
    localStorage.setItem("editNoteId", noteId);
    window.location.href = "notes.html";
}

// ===============================
// DELETE
// ===============================
function deleteNote(noteId) {
    if (!confirm("Delete this note?")) return;

    db.ref(`notes/${currentUser.uid}/${noteId}`)
        .remove()
        .then(() => loadNotes(currentUser.uid))
        .catch(err => alert("Delete failed"));
}

// ===============================
// EXPORT
// ===============================
function exportNotes() {
    if (allNotes.length === 0) {
        alert("No notes to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("Prayer Notes", 105, y, { align: "center" });

    y += 10;

    doc.setFontSize(12);
    doc.setFont("times", "normal");

    allNotes
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .forEach((note, index) => {
            const date = note.updatedAt
                ? new Date(note.updatedAt).toLocaleString()
                : "Unknown date";

            if (y > 260) {
                doc.addPage();
                y = 20;
            }

            doc.setFont("times", "bold");
            doc.text(`${index + 1}. ${date}`, 10, y);
            y += 6;

            doc.setFont("times", "normal");
            const lines = doc.splitTextToSize(note.text || "(Empty note)", 180);
            doc.text(lines, 10, y);

            y += lines.length * 6 + 8;
        });

    doc.save("Prayer-Notes.pdf");
}

// ===============================
// NAV
// ===============================
function goBack() {
    window.location.href = "notes.html";
}


function focusSearch() {
    const input = document.getElementById("searchInput");
    if (input) {
        input.focus();
    }
}

window.focusSearch = focusSearch;

// ===============================
// GLOBALS
// ===============================
window.editNote = editNote;
window.deleteNote = deleteNote;
window.togglePin = togglePin;
window.sortNewest = sortNewest;
window.sortOldest = sortOldest;
window.exportNotes = exportNotes;
window.goBack = goBack;