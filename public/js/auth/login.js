const auth = firebase.auth();
const db = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const loginForm = document.getElementById("loginForm");
    const signupBtn = document.getElementById("signupBtn");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const togglePassword = document.getElementById("togglePassword");

    // login
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        try {
            await auth.signInWithEmailAndPassword(
                emailInput.value.trim(),
                passwordInput.value.trim()
            );
            location.href = "index.html";
        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    });

    // Sign up
    signupBtn.addEventListener("click", async () => {
        try {
            // logout first
            if (auth.currentUser) {
                await auth.signOut();
            }

            const cred = await auth.createUserWithEmailAndPassword(
                emailInput.value.trim(),
                passwordInput.value.trim()
            );

            const name = prompt("Enter your name");
            if (name && name.trim()) {
                await cred.user.updateProfile({ displayName: name.trim() });
            }

            location.href = "index.html";
        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    });

    // Password Reset
    forgotPasswordBtn.addEventListener("click", async () => {
        if (!emailInput.value) {
            alert("Enter your email first");
            return;
        }
        try {
            await auth.sendPasswordResetEmail(emailInput.value);
            alert("Password reset email sent");
        } catch (err) {
            alert(err.message);
        }
    });

    // Password Visibility Toggle
    togglePassword.addEventListener("click", () => {
        const hidden = passwordInput.type === "password";
        passwordInput.type = hidden ? "text" : "password";
        togglePassword.className = hidden
            ? "bi bi-eye-slash toggle-eye"
            : "bi bi-eye toggle-eye";
    });
});

// User normalization
auth.onAuthStateChanged(async user => {
    if (!user) return;

    const userRef = db.ref(`users/${user.uid}`);
    const snap = await userRef.once("value");
    const data = snap.val() || {};

    const fixedName =
        data.name ||
        data.profile?.name ||
        user.displayName ||
        user.email.split("@")[0];

    await userRef.update({
        uid: user.uid,
        name: fixedName,
        email: user.email,
        online: true,
        lastSeen: Date.now()
    });

    userRef.onDisconnect().update({
        online: false,
        lastSeen: Date.now()
    });
});