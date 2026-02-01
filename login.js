// ✅ login.js

// IMPORTANT: Firebase is now initialized in 'firebase-init.js'.
// This file assumes 'firebase-init.js' is loaded BEFORE 'login.js' in your HTML.

// Access Firebase services directly, assuming they've been initialized
const auth = firebase.auth();

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const toggleTheme = document.getElementById("toggleTheme");

// Login functionality
loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email && password) {
        auth.signInWithEmailAndPassword(email, password) // Use the 'auth' object
            .then(() => {
                console.log("Login successful! Redirecting to index.html");
                window.location.href = "index.html";
            })
            .catch(err => {
                console.error("Login failed:", err.message);
                alert("❌ Login failed: " + err.message);
            });
    } else {
        alert("Please enter both email and password.");
    }
});

// Signup functionality
signupBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email && password) {
        auth.createUserWithEmailAndPassword(email, password) // Use the 'auth' object
            .then(() => {
                console.log("Signup successful!");
                alert("✅ Signup successful! You can now log in.");
                // Optionally clear fields or auto-login
            })
            .catch(err => {
                console.error("Signup error:", err.message);
                alert("❌ Signup error: " + err.message);
            });
    } else {
        alert("Please enter both email and password.");
    }
});

// Forgot password functionality
forgotPasswordBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("⚠️ Please enter your email address first.");
        return;
    }

    auth.sendPasswordResetEmail(email) // Use the 'auth' object
        .then(() => {
            console.log("Password reset email sent to:", email);
            alert("📧 Password reset sent to: " + email + ". Check your inbox!");
        })
        .catch(error => {
            console.error("Error sending password reset email:", error.message);
            alert("❌ Error: " + error.message);
        });
});

// Theme toggle functionality
toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
});

// Auto apply theme on load
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
    }
    // You might also want to set the initial state of the theme toggle button here
});
