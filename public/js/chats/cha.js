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
const formatTime = ts => new Date(ts).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

// Auth and core logic
auth.onAuthStateChanged(user => {
    if (!user) return location.href = "login.html";

    const myUid = user.uid;
    const chatId = getChatId(myUid, otherUid);
    const chatRef = db.ref(`chats/${chatId}`);
    const messagesRef = chatRef.child("messages");

    // Online Status
    const meRef = db.ref(`users/${myUid}`);
    meRef.update({online: true});
    meRef.onDisconnect().update({online: false, lastSeen: Date.now()});

    // Other User Presence & Info
    db.ref(`users/${otherUid}`).on("value", snap => {
        const u = snap.val();
        if (!u) return;
        chatHeader.textContent = u.name || "Chat";

        // Handle Online Status vs Typing Status
        if (!window.isOtherTyping) {
            if (u.online) {
                typingStatus.textContent = "online";
                typingStatus.style.color = "#25d366"; // green
            } else if (u.lastSeen) {
                const diffMs = Date.now() - u.lastSeen;
                typingStatus.textContent = `active ${formatLastSeen(diffMs)} ago`;
                typingStatus.style.color = ""; // Reset to default muted color
            }
        }
    });

    // Helper to convert milliseconds to "1d 2h 3m" format
    function formatLastSeen(ms) {
        const totalMinutes = Math.floor(ms / 60000);
        if (totalMinutes < 1) return "just now";

        const d = Math.floor(totalMinutes / 1440);
        const h = Math.floor((totalMinutes % 1440) / 60);
        const m = totalMinutes % 60;

        let result = "";
        if (d > 0) result += `${d}d `;
        if (h > 0) result += `${h}h `;
        if (m > 0 || result === "") result += `${m}m`;

        return result.trim();
    }

    // Chat Members Setup
    chatRef.child("members").update({[myUid]: true, [otherUid]: true});

    // Load Messages
    messagesRef.limitToLast(150).on("child_added", snap => {
        const msg = snap.val();
        const msgId = snap.key;
        renderMessage(msg, myUid, msgId); // Modified to pass msgId

        if (msg.to === myUid && !msg.read) {
            snap.ref.update({read: true});
        }

        // Wait for DOM to paint before scrolling
        requestAnimationFrame(() => autoScroll());
    });

    //  Real-time UI Removal when a message is deleted
    messagesRef.on("child_removed", snap => {
        const deletedMsgId = snap.key;
        const el = document.getElementById(`msg-${deletedMsgId}`);
        if (el) {
            el.style.opacity = "0";
            el.style.transform = "scale(0.8)";
            setTimeout(() => el.remove(), 300);
        }
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

// UI functions
function renderMessage(msg, myUid, msgId) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + (msg.from === myUid ? "me" : "other");
    bubble.id = `msg-${msgId}`; // Set ID for removal logic

    bubble.innerHTML = `
        <div class="message-text">${msg.text}</div>
        <div class="meta">
            <span>${formatTime(msg.timestamp)}</span>
            ${msg.from === myUid ? `<span class="seen">${msg.read ? "✓✓" : "✓"}</span>` : ""}
        </div>
    `;

    // Delete Logic (Right Click & Long Press)
    if (msg.from === myUid) {
        // Desktop: Right Click
        bubble.oncontextmenu = (e) => {
            e.preventDefault();
            confirmDeleteMessage(msgId);
        };

        // Mobile: Long Press
        let timer;
        bubble.ontouchstart = () => {
            timer = setTimeout(() => confirmDeleteMessage(msgId), 800);
        };
        bubble.ontouchend = () => clearTimeout(timer);
        bubble.ontouchmove = () => clearTimeout(timer); // Cancel if scrolling
    }

    messagesDiv.appendChild(bubble);
}

// Deletion Execution
let messageToDeleteId = null; // Track which message to delete

function confirmDeleteMessage(msgId) {
    messageToDeleteId = msgId;
    const modal = document.getElementById("deleteModal");

    // Provide haptic feedback via Android Bridge
    if (window.AndroidApp && window.AndroidApp.vibrate) {
        window.AndroidApp.vibrate(40);
    }

    // Show the custom modal
    modal.classList.add("show");

    // Set up the "Delete" button listener
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    confirmBtn.onclick = () => {
        const myUid = auth.currentUser.uid;
        const chatId = getChatId(myUid, otherUid);

        // Remove from Firebase
        db.ref(`chats/${chatId}/messages/${messageToDeleteId}`).remove()
            .then(() => {
                closeDeleteModal();
            })
            .catch(err => {
                console.error("Delete failed:", err);
                closeDeleteModal();
            });
    };
}

function closeDeleteModal() {
    const modal = document.getElementById("deleteModal");
    modal.classList.remove("show");
    messageToDeleteId = null;
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
    messagesDiv.scrollTo({top: messagesDiv.scrollHeight, behavior: "smooth"});
});


// Notification Logic
const notificationChatRef = db.ref("chats");

notificationChatRef.limitToLast(1).on("child_added", (snapshot) => {
    // currentUser needs to be defined from the auth listener or used from auth.currentUser
    const message = snapshot.val();
    const user = auth.currentUser;

    if (user && message.senderId !== user.uid) {
        showLocalNotification(message.senderName, message.text);
    }
});

function showLocalNotification(name, text) {
    if (Notification.permission === "granted") {
        new Notification(`New Message from ${name}`, {
            body: text,
            icon: "assets/icons/icon-72.png"
        });

        //  Vibrate the phone when a message arrives
        if (window.AndroidApp && window.AndroidApp.vibrate) {
            window.AndroidApp.vibrate(100);
        }
    } else {
        Notification.requestPermission();
    }
}

// Mobile keyboard fix
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