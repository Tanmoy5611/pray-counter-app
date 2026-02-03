const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    db.ref(`users/${user.uid}/profile/name`)
        .once("value")
        .then(snap => {
            document.getElementById("nameInput").value =
                snap.val() || user.displayName || "";
        });
});

function saveProfileName() {
    const name = document.getElementById("nameInput").value.trim();
    if (!name || !currentUser) return;

    // Save to Auth
    currentUser.updateProfile({ displayName: name });

    // Save to DB
    db.ref(`users/${currentUser.uid}/profile`).update({
        name,
        updatedAt: Date.now()
    }).then(() => {
        document.getElementById("saveStatus").textContent = "✅ Saved successfully";

        // optional: go back after 1.2s
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    });
}