// ✅ theme.js

const themeToggleBtn = document.getElementById("themeToggle");

// ⬅️ Update button text based on theme
function updateThemeText(theme) {
    themeToggleBtn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// ⬅️ Apply theme (remove old, add new)
function applyTheme(theme) {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
    updateThemeText(theme);
}

// ✅ Load theme from localStorage or default to light
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

// ✅ Toggle theme on button click
themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
});