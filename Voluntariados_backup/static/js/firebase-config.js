// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkQhqLWGqjpIKY987VyEKWB9jvgib6bNo",
    authDomain: "campusvoluntariado-fbde7.firebaseapp.com",
    projectId: "campusvoluntariado-fbde7",
    storageBucket: "campusvoluntariado-fbde7.firebasestorage.app",
    messagingSenderId: "912829459788",
    appId: "1:912829459788:web:e796a9519626d1aaa4b3e9",
    measurementId: "G-WVVJLS8N55"
};

// Initialize Firebase when the page loads
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Make sure Firebase scripts are included before this script.');
        return;
    }

    try {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Make Firebase services available globally
        window.firebaseApp = app;
        window.firebaseAuth = auth;
        window.firebaseDb = db;

        // Firebase initialized successfully
        
        // Trigger custom event to notify other scripts Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
    }
}

// Initialize Firebase when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    // DOM is already loaded, initialize immediately
    initializeFirebase();
}