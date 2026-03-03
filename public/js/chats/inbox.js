console.log("inbox.js loaded");

const auth = firebase.auth();
const db = firebase.database();

const chatList = document.getElementById("chatList");
const searchInput = document.getElementById("userSearch");

let currentUser = null;
let allUsers = {};

// Track chat to delete
let chatToDelete = null;

// AUTH
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    loadAllUsers(() => {
        loadChats();
    });
});

// load all users (for inbox + search)
function loadAllUsers(callback) {
    db.ref("users").on("value", snap => {
        allUsers = snap.val() || {};
        if (callback) callback();
    });
}

// Load chats (inbox list)
function loadChats() {
    db.ref("chats").on("value", snap => {
        chatList.innerHTML = "";

        snap.forEach(chatSnap => {
            const chat = chatSnap.val();
            const chatId = chatSnap.key; // Get the unique chat ID (e.g., uid1_uid2)

            if (!chat.members || !chat.members[currentUser.uid]) return;

            const otherUid = Object.keys(chat.members)
                .find(uid => uid !== currentUser.uid);

            const user = allUsers[otherUid];
            if (!user) return;

            const name =
                user.name ||
                user.profile?.name ||
                "Unknown";

            const lastText = chat.lastMessage?.text || "No messages yet";
            const lastTime = formatTime(chat.lastMessage?.timestamp);

            const li = document.createElement("li");
            li.className = "chat-item";

            //  Delete button inside the HTML template
            li.innerHTML = `
                <div class="chat-left">
                    <span class="dot ${user.online ? "online" : ""}"></span>
                    <div class="chat-info">
                        <div class="chat-name">${name}</div>
                        <div class="chat-preview">${lastText}</div>
                    </div>
                </div>
                <div class="chat-right">
                    <div class="chat-time">${lastTime}</div>
                    <!-- Delete button -->
                    <button class="delete-chat-btn"
                        onclick="deleteChat(event, '${chatId}')">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            `;

            li.onclick = () => {
                window.location.href = `chat.html?uid=${otherUid}`;
            };

            chatList.appendChild(li);
        });
    });
}

// Delete chat (chat-style modal)
function deleteChat(event, chatId) {
    event.stopPropagation(); // prevent opening chat

    chatToDelete = chatId;

    // Haptic feedback
    if (window.AndroidApp?.vibrate) {
        window.AndroidApp.vibrate(40);
    }

    // SHOW STATIC MODAL (same as chat page)
    document.getElementById("deleteModal").classList.add("show");
}

// Close modal (shared pattern)
function closeDeleteModal() {
    const modal = document.getElementById("deleteModal");
    modal.classList.remove("show");
    chatToDelete = null;
}

//  Confirm delete (shared pattern)
function confirmDeleteChat() {
    if (!chatToDelete) return;

    db.ref("chats/" + chatToDelete).remove()
        .then(() => {
            // Optional haptic
            if (window.AndroidApp?.vibrate) {
                window.AndroidApp.vibrate(60);
            }
            closeDeleteModal();
        })
        .catch(err => {
            console.error("Delete failed:", err);
            closeDeleteModal();
        });
}

//  Bind confirm button ONCE
document.getElementById("confirmDeleteBtn").onclick = confirmDeleteChat;

// Search users - Start new chat
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    chatList.innerHTML = "";

    if (!q) {
        loadChats();
        return;
    }

    Object.entries(allUsers).forEach(([uid, user]) => {
        if (uid === currentUser.uid) return;

        const name =
            user.name ||
            user.profile?.name ||
            "";

        if (!name.toLowerCase().includes(q)) return;

        const li = document.createElement("li");
        li.className = "chat-item";

        li.innerHTML = `
            <div class="chat-left">
                <span class="dot ${user.online ? "online" : ""}"></span>
                <div class="chat-info">
                    <div class="chat-name">${name}</div>
                    <div class="chat-preview">Start chat</div>
                </div>
            </div>
        `;

        li.onclick = () => startChat(uid);
        chatList.appendChild(li);
    });
});

// Start / Open chat/
function startChat(otherUid) {
    const chatId = [currentUser.uid, otherUid].sort().join("_");
    const chatRef = db.ref("chats/" + chatId);

    chatRef.once("value").then(snap => {
        if (!snap.exists()) {
            chatRef.set({
                members: {
                    [currentUser.uid]: true,
                    [otherUid]: true
                },
                lastMessage: {
                    text: "",
                    sender: "",
                    timestamp: Date.now()
                }
            });
        }

        window.location.href = `chat.html?uid=${otherUid}`;
    });
}

// Time format
function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}