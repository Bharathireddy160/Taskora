import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, getDocs, doc, getDoc, addDoc, setDoc, serverTimestamp,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const taskForm = $("task-form");
const dateInput = $("task-date");
if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "login.html"; return; }
  $("welcome-name").textContent = (user.displayName || user.email.split("@")[0]).split(" ")[0];
  $("user-email").textContent = user.email || "";
  $("avatar").textContent = (user.displayName || user.email || "S").slice(0,1).toUpperCase();

  const profileRef = doc(db, "users", user.uid, "profile", "main");
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) {
    const profile = profileSnap.data();
    $("profile-name").textContent = profile.displayName || user.displayName || "Student";
  } else {
    await setDoc(profileRef, { displayName: user.displayName || "Student", email: user.email || "" }, { merge: true });
    $("profile-name").textContent = user.displayName || "Student";
  }
  await loadDashboard(user.uid);
});

taskForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const title = $("task-title").value.trim();
  const dueDate = $("task-date").value;
  if (!title || !dueDate) return;
  try {
    await addDoc(collection(db, "users", user.uid, "tasks"), {
      title, dueDate, category: $("task-category").value,
      notes: $("task-notes").value.trim(), completed: false,
      createdAt: serverTimestamp(), completedAt: null
    });
    taskForm.reset();
    dateInput.min = new Date().toISOString().slice(0, 10);
    $("add-message").textContent = "Task added to your planner!";
    await loadDashboard(user.uid);
  } catch (error) {
    $("add-message").textContent = "Could not save task: " + error.message;
  }
});

async function loadDashboard(uid) {
  const q = query(collection(db, "users", uid, "tasks"), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const today = localDate(new Date());
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  $("stat-total").textContent = tasks.length;
  $("stat-open").textContent = active.length;
  $("stat-done").textContent = completed.length;
  $("stat-due").textContent = active.filter(t => t.dueDate === today).length;
  const list = $("upcoming-list");
  list.innerHTML = "";
  const upcoming = active.slice(0, 4);
  if (!upcoming.length) list.innerHTML = '<div class="empty-state">✨ You’re all caught up. Add your next task above!</div>';
  upcoming.forEach(task => {
    const status = deadlineStatus(task.dueDate);
    const item = document.createElement("article");
    item.className = "task-row";
    item.innerHTML = `<div class="task-icon">${iconFor(task.category)}</div>
      <div class="task-main"><strong></strong><span></span></div>
      <span class="status-pill ${status.className}">${status.label}</span>`;
    item.querySelector("strong").textContent = task.title;
    item.querySelector("span").textContent = `${task.category} · Due ${formatDate(task.dueDate)}`;
    list.appendChild(item);
  });
  renderHeatmap(tasks);
  checkReminders(active);
}

function renderHeatmap(tasks) {
  const host = $("heatmap");
  host.innerHTML = "";
  const counts = {};
  tasks.filter(t => t.completed && t.completedAt).forEach(t => {
    const date = t.completedAt.toDate ? localDate(t.completedAt.toDate()) : "";
    if (date) counts[date] = (counts[date] || 0) + 1;
  });
  for (let i = 83; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = localDate(d), count = counts[key] || 0;
    const cell = document.createElement("span");
    cell.className = "heat-cell level-" + Math.min(count, 4);
    cell.title = `${key}: ${count} task(s) completed`;
    host.appendChild(cell);
  }
  const streak = calculateStreak(counts);
  $("streak-count").textContent = streak;
}

function calculateStreak(counts) {
  let streak = 0, date = new Date();
  if (!counts[localDate(date)]) date.setDate(date.getDate() - 1);
  while (counts[localDate(date)]) { streak++; date.setDate(date.getDate() - 1); }
  return streak;
}

function checkReminders(tasks) {
  const today = localDate(new Date());
  const due = tasks.filter(t => t.dueDate <= today);
  if (due.length) {
    $("reminder-banner").hidden = false;
    $("reminder-banner").textContent = due.some(t => t.dueDate < today)
      ? `Heads up! You have ${due.length} overdue or due-today task(s). Open My Tasks to review them.`
      : `Friendly reminder: ${due.length} task(s) are due today. You’ve got this!`;
    if ("Notification" in window && Notification.permission === "granted") {
      const key = `taskora-reminded-${today}`;
      if (!sessionStorage.getItem(key)) {
        new Notification("Taskora deadline reminder", { body: `${due.length} task(s) are due or overdue.` });
        sessionStorage.setItem(key, "yes");
      }
    }
  } else $("reminder-banner").hidden = true;
}

$("enable-notifications")?.addEventListener("click", async () => {
  if (!("Notification" in window)) { alert("This browser does not support notifications."); return; }
  const permission = await Notification.requestPermission();
  alert(permission === "granted" ? "Notifications enabled while Taskora is open." : "Notifications were not enabled. You can change this in browser settings.");
});

function localDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function formatDate(s) { return new Date(s + "T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); }
function deadlineStatus(date) {
  const today = localDate(new Date());
  if (date < today) return {label:"Overdue", className:"overdue"};
  if (date === today) return {label:"Due today", className:"due"};
  return {label:"Upcoming", className:"upcoming"};
}
function iconFor(category) { return ({Assignment:"📝",Exam:"🎓",Reading:"📚",Personal:"✨"})[category] || "📌"; }
