// ✅ Firebase v8 compatible config
const firebaseConfig = {
  apiKey: "AIzaSyAuS5190yP3hOjZgikINKMAlsJSZt3mf3Y",
  authDomain: "quicktools-e8c38.firebaseapp.com",
  projectId: "quicktools-e8c38",
  storageBucket: "quicktools-e8c38.appspot.com",
  messagingSenderId: "123099569074",
  appId: "1:123099569074:web:e4cec507a47ef610b022ab"
};

// ✅ Initialize Firebase ONLY ONCE
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Firestore
const db = firebase.firestore();

// ✅ Make global (VERY IMPORTANT)
window.db = db;