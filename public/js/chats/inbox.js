console.log("inbox.js loaded");

const auth = firebase.auth();
const db = firebase.database();

const chatList = document.getElementById("chatList");
const searchInput = document.getElementById("userSearch");

let currentUser = null;
let allUsers = {};

// =====================================
// AUTH
// =====================================
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

// =====================================
// LOAD ALL USERS (for inbox + search)
// =====================================
function loadAllUsers(callback) {
    db.ref("users").on("value", snap => {
        allUsers = snap.val() || {};
        if (callback) callback();
    });
}

// =====================================
// LOAD CHATS (INBOX LIST)
// =====================================
function loadChats() {
    db.ref("chats").on("value", snap => {
        chatList.innerHTML = "";

        snap.forEach(chatSnap => {
            const chat = chatSnap.val();

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

            li.innerHTML = `
                <div class="chat-left">
                    <span class="dot ${user.online ? "online" : ""}"></span>
                    <div class="chat-info">
                        <div class="chat-name">${name}</div>
                        <div class="chat-preview">${lastText}</div>
                    </div>
                </div>
                <div class="chat-time">${lastTime}</div>
            `;

            li.onclick = () => {
                window.location.href = `chat.html?uid=${otherUid}`;
            };

            chatList.appendChild(li);
        });
    });
}

// =====================================
// SEARCH USERS → START NEW CHAT
// =====================================
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

// =====================================
// START / OPEN CHAT
// =====================================
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

// =====================================
// TIME FORMAT (SAFE)
// =====================================
function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}