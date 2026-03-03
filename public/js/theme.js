const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

if (!themeToggleBtn || !themeIcon) {
    console.warn("Theme toggle elements not found");
}

// Apply theme + update icon & tooltip
function applyTheme(theme) {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);

    // theme icon switch
    if (themeIcon) {
        themeIcon.className =
            theme === "dark"
                ? "bi bi-sun"
                : "bi bi-moon-stars";
    }

    // Tooltip text
    if (themeToggleBtn) {
        themeToggleBtn.title =
            theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode";
    }
}

// Load saved theme (or default)
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

// Toggle on click
themeToggleBtn?.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
});