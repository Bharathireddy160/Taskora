import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
let allTasks = [];
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "login.html"; return; }
  $("tasks-user").textContent = user.displayName || user.email;
  await refresh(user.uid);
});
$("filter-status")?.addEventListener("change", render);
$("filter-category")?.addEventListener("change", render);

async function refresh(uid) {
  const q = query(collection(db, "users", uid, "tasks"), orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const today = localDate(new Date());
  const due = allTasks.filter(t => !t.completed && t.dueDate <= today);
  const banner = $("task-alert");
  if (due.length) {
    banner.hidden = false;
    banner.textContent = `⚠ Deadline alert: ${due.length} task(s) are overdue or due today. Complete them and tick the circle to mark them green.`;
  } else { banner.hidden = true; }
  render();
}
function render() {
  const host = $("all-tasks");
  host.innerHTML = "";
  const status = $("filter-status").value, category = $("filter-category").value;
  const tasks = allTasks.filter(t => {
    const statusMatch = status === "all" || (status === "done" ? t.completed : !t.completed);
    return statusMatch && (category === "all" || t.category === category);
  });
  $("task-count").textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  if (!tasks.length) { host.innerHTML = '<div class="empty-state">No tasks match this filter. Add a task from your dashboard.</div>'; return; }
  tasks.forEach(task => {
    const statusInfo = deadlineStatus(task.dueDate, task.completed);
    const row = document.createElement("article");
    row.className = `task-card ${task.completed ? "is-complete" : ""}`;
    const check = document.createElement("button");
    check.className = "complete-toggle";
    check.setAttribute("aria-label", task.completed ? "Mark task unfinished" : "Mark task complete");
    check.textContent = task.completed ? "✓" : "";
    check.addEventListener("click", () => toggleTask(task));
    const content = document.createElement("div"); content.className = "task-card-content";
    const title = document.createElement("h3"); title.textContent = task.title;
    const meta = document.createElement("p"); meta.textContent = `${task.category} · Due ${formatDate(task.dueDate)}`;
    content.append(title, meta);
    if (task.notes) { const note = document.createElement("p"); note.className = "task-note"; note.textContent = task.notes; content.append(note); }
    const pill = document.createElement("span"); pill.className = `status-pill ${statusInfo.className}`; pill.textContent = statusInfo.label;
    const del = document.createElement("button"); del.className = "delete-task"; del.textContent = "Delete"; del.addEventListener("click", () => removeTask(task));
    row.append(check, content, pill, del); host.appendChild(row);
  });
}
async function toggleTask(task) {
  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid, "tasks", task.id), {
      completed: !task.completed, completedAt: !task.completed ? serverTimestamp() : null
    });
    await refresh(auth.currentUser.uid);
  } catch (e) { alert("Could not update task: " + e.message); }
}
async function removeTask(task) {
  if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "tasks", task.id));
    await refresh(auth.currentUser.uid);
  } catch (e) { alert("Could not delete task: " + e.message); }
}
function localDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatDate(s) { return new Date(s + "T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); }
function deadlineStatus(date, completed) {
  if (completed) return {label:"Completed",className:"done"};
  const today=localDate(new Date());
  if (date < today) return {label:"Overdue",className:"overdue"};
  if (date === today) return {label:"Due today",className:"due"};
  return {label:"Upcoming",className:"upcoming"};
}
