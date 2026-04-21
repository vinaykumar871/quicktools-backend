function getSafeTasks(tasks) {
  return Array.isArray(tasks)
    ? tasks
    : Object.values(tasks || {});
}
// Safe get
function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

// Safe set
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function autoSaveInput(id, key) {
  const input = document.getElementById(id);

  if (!input) return;

  // Save while typing
  input.addEventListener("input", () => {
    localStorage.setItem(key, input.value);
  });

  // Load saved value
  input.value = localStorage.getItem(key) || "";
}

// 🌍 GLOBAL AUTO SAVE SYSTEM
function enableGlobalAutoSave() {
  const inputs = document.querySelectorAll("input, textarea");

  inputs.forEach((input) => {
    const key = input.id || input.name;

    if (!key) return; // skip if no id/name

    // Load saved value
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      input.value = saved;
    }

    // Save on input
    input.addEventListener("input", () => {
      localStorage.setItem(key, input.value);
    });
  });
}

// 🔥 SAVE DATA
function saveData(collection, data) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  return db.collection("users")
    .doc(user.uid)
    .collection(collection)
    .doc("main")
    .set(data);
}

// 🔥 LOAD DATA
function loadData(collection) {
  const user = firebase.auth().currentUser;
  if (!user) return Promise.resolve(null);

  return db.collection("users")
    .doc(user.uid)
    .collection(collection)
    .doc("main")
    .get()
    .then(doc => doc.exists ? doc.data() : null);
}

// ==========================
// FIREBASE DB
// ==========================

// ==========================
// SAVE DATA (LOCAL + CLOUD)
// ==========================
function saveData(key, data) {

  // ✅ Save locally (existing system)
  localStorage.setItem(key, JSON.stringify(data));

  // ✅ Save to Firebase (backup)
  const user = firebase.auth().currentUser;
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .collection("data")
    .doc(key)
    .set(data)
    .catch(err => console.log("Firebase Save Error:", err));
}

// ==========================
// LOAD DATA (LOCAL FIRST)
// ==========================
async function loadData(key) {

  // ✅ 1. Try localStorage first (fast)
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local);

  // ✅ 2. If not found → get from Firebase
  const user = firebase.auth().currentUser;
  if (!user) return null;

  const doc = await db.collection("users")
    .doc(user.uid)
    .collection("data")
    .doc(key)
    .get();

  if (doc.exists) {
    const data = doc.data();

    // 🔥 Sync back to localStorage
    localStorage.setItem(key, JSON.stringify(data));

    return data;
  }

  return null;
}
// ==========================
// REAL-TIME LISTENER
// ==========================
function listenData(key, callback) {

  const user = firebase.auth().currentUser;
  if (!user) return;

  return db.collection("users")
    .doc(user.uid)
    .collection("data")
    .doc(key)
    .onSnapshot(doc => {

      if (doc.exists) {
        const data = doc.data();

        // 🔥 Sync to localStorage
        localStorage.setItem(key, JSON.stringify(data));

        // 🔥 Send data to UI
        callback(data);
      }
    });
}
function updateWeeklyData() {

  let weeklyData = JSON.parse(localStorage.getItem("weeklyData")) || [0,0,0,0,0,0,0];

  const today = new Date().getDay(); // 0=Sun
  const index = today === 0 ? 6 : today - 1; // Mon=0

  const rawTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const rawHabits = JSON.parse(localStorage.getItem("habits")) || [];

  // ✅ FIX HERE
  const tasks = getSafeTasks(rawTasks);
  const habits = getSafeTasks(rawHabits);

  const taskDone = tasks.filter(t => t.done).length;
  const habitDone = habits.filter(h => h.done).length;

  weeklyData[index] = taskDone + habitDone;

  localStorage.setItem("weeklyData", JSON.stringify(weeklyData));
}