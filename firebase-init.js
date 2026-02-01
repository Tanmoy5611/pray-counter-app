// firebase-init.js
// This file is your ONE central place for Firebase configuration.

const firebaseConfig = {
    apiKey: "AIzaSyCwS7rfzS3NTiPSZ5eocu6BVzBg5ySNn_s",
    authDomain: "tapcounterapp-72afb.firebaseapp.com",
    databaseURL: "https://tapcounterapp-72afb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tapcounterapp-72afb",
    storageBucket: "tapcounterapp-72afb.firebasestorage.app", // Note: This should probably be .appspot.com as it was in your index.html config
    messagingSenderId: "163708274881",
    appId: "1:163708274881:web:2d90b6ea18450e69182c40",
    measurementId: "G-VE39ZM4QMV"
};

// Initialize Firebase once!
firebase.initializeApp(firebaseConfig);

// Optional: You can also get common service references here
// const auth = firebase.auth();
// const db = firebase.database();
// (If you do this, you might need to adjust how you access them in other files,
// but for simplicity for now, just initializing is enough. The 'firebase' global object
// will be available after this file runs.)
