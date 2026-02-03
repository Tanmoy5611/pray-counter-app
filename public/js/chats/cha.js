// ======================================================================
// CHAT.JS — FINAL CLEAN BUILD (Keyboard & Scroll Optimized)
// ======================================================================

const auth = firebase.auth();
const db = firebase.database();

// DOM Elements
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatHeader = document.getElementById("chatHeader");
const typingStatus = document.getElementById("typingStatus");
const scrollBtn = document.getElementById("scrollToBottom");

// URL Params
const otherUid = new URLSearchParams(window.location.search).get("uid");
if (!otherUid) {
    alert("No user selected");
    location.href = "inbox.html";
}

// Utils
const getChatId = (a, b) => [a, b].sort().join("_");
const formatTime = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ======================================================================
// AUTH & CORE LOGIC
// ======================================================================
auth.onAuthStateChanged(user => {
    if (!user) return location.href = "login.html";

    const myUid = user.uid;
    const chatId = getChatId(myUid, otherUid);
    const chatRef = db.ref(`chats/${chatId}`);
    const messagesRef = chatRef.child("messages");

    // Online Status
    const meRef = db.ref(`users/${myUid}`);
    meRef.update({ online: true });
    meRef.onDisconnect().update({ online: false, lastSeen: Date.now() });

    // Other User Presence & Info
    db.ref(`users/${otherUid}`).on("value", snap => {
        const u = snap.val();
        if (!u) return;
        chatHeader.textContent = u.name || "Chat";

        // Handle Online Status vs Typing Status
        if (!window.isOtherTyping) {
            if (u.online) {
                typingStatus.textContent = "online";
            } else if (u.lastSeen) {
                const mins = Math.max(1, Math.floor((Date.now() - u.lastSeen) / 60000));
                typingStatus.textContent = `active ${mins} min ago`;
            }
        }
    });

    // Chat Members Setup
    chatRef.child("members").update({ [myUid]: true, [otherUid]: true });

    // Load Messages
    messagesRef.limitToLast(150).on("child_added", snap => {
        const msg = snap.val();
        renderMessage(msg, myUid);

        if (msg.to === myUid && !msg.read) {
            snap.ref.update({ read: true });
        }

        // Wait for DOM to paint before scrolling
        requestAnimationFrame(() => autoScroll());
    });

    // Send Message Function
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        const ts = Date.now();
        messagesRef.push({
            from: myUid,
            to: otherUid,
            text,
            timestamp: ts,
            read: false
        });

        chatRef.child("lastMessage").set({
            text, sender: myUid, timestamp: ts
        });

        input.value = "";
        typingRef.set(false);
        setTimeout(() => autoScroll(true), 50);
    };

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    // Typing Indicator Logic
    const typingRef = chatRef.child(`typing/${myUid}`);
    const otherTypingRef = chatRef.child(`typing/${otherUid}`);
    let typingTimer = null;

    input.addEventListener("input", () => {
        typingRef.set(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => typingRef.set(false), 1500);
    });

    otherTypingRef.on("value", snap => {
        window.isOtherTyping = snap.val();
        if (window.isOtherTyping) {
            typingStatus.textContent = "typing...";
            typingStatus.style.color = "#25d366";
        } else {
            // Re-trigger user info fetch to restore "online" text
            db.ref(`users/${otherUid}`).once("value", s => {
                if (s.val()?.online) typingStatus.textContent = "online";
            });
        }
    });
});

// ======================================================================
// UI FUNCTIONS
// ======================================================================
function renderMessage(msg, myUid) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + (msg.from === myUid ? "me" : "other");
    bubble.innerHTML = `
        <div class="message-text">${msg.text}</div>
        <div class="meta">
            <span>${formatTime(msg.timestamp)}</span>
            ${msg.from === myUid ? `<span class="seen">${msg.read ? "✓✓" : "✓"}</span>` : ""}
        </div>
    `;
    messagesDiv.appendChild(bubble);
}

function isNearBottom() {
    return (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 150);
}

function autoScroll(force = false) {
    if (force || isNearBottom()) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// Scroll Button Visibility
messagesDiv.addEventListener("scroll", () => {
    if (isNearBottom()) {
        scrollBtn.classList.remove('show');
    } else {
        scrollBtn.classList.add('show');
    }
});

scrollBtn.addEventListener("click", () => {
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
});

// ======================================================================
// THE CRITICAL MOBILE KEYBOARD FIX
// ======================================================================
const handleViewportResize = () => {
    if (window.visualViewport) {
        const vh = window.visualViewport.height;
        // Update the CSS variable with the TRUE visible height
        document.documentElement.style.setProperty("--vh", `${vh}px`);

        // Force the body to this height to prevent browser "panning"
        document.body.style.height = `${vh}px`;

        // Keep user at the bottom of the conversation
        autoScroll(true);
    }
};

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleViewportResize);
    window.visualViewport.addEventListener("scroll", handleViewportResize);
}

// Fix for iOS Safari specifically when input is focused
input.addEventListener("focus", () => {
    setTimeout(() => {
        autoScroll(true);
    }, 300);
});

// Initialize height
handleViewportResize();