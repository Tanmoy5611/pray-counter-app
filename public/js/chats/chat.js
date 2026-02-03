// ======================================================================
// CHAT.JS — FINAL CLEAN BUILD (Mobile Keyboard + Scroll Safe)
// ======================================================================

const auth = firebase.auth();
const db = firebase.database();

// DOM
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatHeader = document.getElementById("chatHeader");
const typingStatus = document.getElementById("typingStatus");
const scrollBtn = document.getElementById("scrollToBottom");

// URL PARAM
const otherUid = new URLSearchParams(window.location.search).get("uid");
if (!otherUid) {
    alert("No user selected");
    location.href = "inbox.html";
}

// UTIL
const getChatId = (a, b) => [a, b].sort().join("_");

const formatTime = ts =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ======================================================================
// AUTH
// ======================================================================
auth.onAuthStateChanged(user => {
    if (!user) return location.href = "login.html";

    const myUid = user.uid;
    const chatId = getChatId(myUid, otherUid);
    const chatRef = db.ref(`chats/${chatId}`);
    const messagesRef = chatRef.child("messages");

    // ==============================================================
    // ONLINE / LAST SEEN
    // ==============================================================
    const meRef = db.ref(`users/${myUid}`);
    meRef.update({ online: true });
    meRef.onDisconnect().update({
        online: false,
        lastSeen: Date.now()
    });

    // ==============================================================
    // OTHER USER INFO
    // ==============================================================
    db.ref(`users/${otherUid}`).on("value", snap => {
        const u = snap.val();
        if (!u) return;

        chatHeader.textContent = u.name || "Chat";

        if (u.online) {
            typingStatus.textContent = "online";
        } else if (u.lastSeen) {
            const mins = Math.max(1, Math.floor((Date.now() - u.lastSeen) / 60000));
            typingStatus.textContent = `active ${mins} min ago`;
        } else {
            typingStatus.textContent = "";
        }
    });

    // ==============================================================
    // MEMBERS
    // ==============================================================
    chatRef.child("members").update({
        [myUid]: true,
        [otherUid]: true
    });

    // ==============================================================
    // LOAD MESSAGES
    // ==============================================================
    messagesRef.limitToLast(150).on("child_added", snap => {
        const msg = snap.val();
        renderMessage(msg, myUid);

        if (msg.to === myUid && !msg.read) {
            snap.ref.update({ read: true });
        }

        autoScroll();
    });

    // ==============================================================
    // SEND MESSAGE
    // ==============================================================
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
            text,
            sender: myUid,
            timestamp: ts
        });

        input.value = "";
        typingRef.set(false);
        autoScroll(true);
    };

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    // ==============================================================
    // TYPING INDICATOR
    // ==============================================================
    const typingRef = chatRef.child(`typing/${myUid}`);
    const otherTypingRef = chatRef.child(`typing/${otherUid}`);
    let typingTimer = null;

    input.addEventListener("input", () => {
        typingRef.set(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => typingRef.set(false), 900);
    });

    otherTypingRef.on("value", snap => {
        if (snap.val()) {
            typingStatus.textContent = "typing…";
        }
    });
});

// ======================================================================
// RENDER MESSAGE
// ======================================================================
function renderMessage(msg, myUid) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + (msg.from === myUid ? "me" : "other");

    bubble.innerHTML = `
        ${msg.text}
        <div class="meta">
            <span>${formatTime(msg.timestamp)}</span>
            ${
        msg.from === myUid
            ? `<span class="seen">${msg.read ? "✓✓" : "✓"}</span>`
            : ""
    }
        </div>
    `;

    messagesDiv.appendChild(bubble);
}

// ======================================================================
// SCROLL LOGIC (SMART)
// ======================================================================
function isNearBottom() {
    return (
        messagesDiv.scrollHeight -
        messagesDiv.scrollTop -
        messagesDiv.clientHeight < 120
    );
}

function autoScroll(force = false) {
    if (force || isNearBottom()) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        scrollBtn.style.display = "none";
    }
}

// Scroll button
messagesDiv.addEventListener("scroll", () => {
    scrollBtn.style.display = isNearBottom() ? "none" : "flex";
});

scrollBtn.addEventListener("click", () => {
    messagesDiv.scrollTo({
        top: messagesDiv.scrollHeight,
        behavior: "smooth"
    });
});

// ======================================================================
// MOBILE KEYBOARD FIX (STABLE)
// ======================================================================
const setVH = () => {
    document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
    );
};

setVH();
window.addEventListener("resize", setVH);

// Force scroll when keyboard opens
input.addEventListener("focus", () => {
    setTimeout(() => autoScroll(true), 300);
});