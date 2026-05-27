/* ============================================
   STATE
   ============================================ */
const state = {
  theme: 'dark',
  checklists: [],
  activeChecklistId: null,
  filter: 'all',
  sortBy: 'order',
  categoryFilter: '',
  searchQuery: '',
  completedExpanded: true,
  sidebarCollapsed: false,
  selectedTaskId: null,
  view: 'dashboard',
  todayMode: false,
  focusMode: false,
  multiSelect: false,
  selectedTaskIds: [],
  streak: 0,
  completedHistory: [],
  lastActiveDate: null,
};

/* ============================================
   DOM REFS
   ============================================ */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

const dom = {
  html: document.documentElement,
  body: document.body,
  sidebar: $('#sidebar'),
  sidebarBackdrop: $('#sidebar-backdrop'),
  menuToggle: $('#menu-toggle'),
  homeBtn: $('#home-btn'),
  checklistList: $('#checklist-list'),
  checklistCount: $('#checklist-count'),
  content: $('#content'),
  searchInput: $('#search-input'),
  searchClear: $('#search-clear'),
  header: $('#header'),
  newChecklistBtn: $('#new-checklist-btn'),
  newChecklistSidebar: $('#new-checklist-btn-sidebar'),
  modalOverlay: $('#modal-overlay'),
  modal: $('#modal'),
  modalTitle: $('#modal-title'),
  modalBody: $('#modal-body'),
  modalFooter: $('#modal-footer'),
  modalClose: $('#modal-close'),
  confirmOverlay: $('#confirm-overlay'),
  confirmMessage: $('#confirm-message'),
  confirmOk: $('#confirm-ok'),
  confirmCancel: $('#confirm-cancel'),
  toastContainer: $('#toast-container'),
  shortcutsBtn: $('#keyboard-shortcuts-btn'),
  shortcutsOverlay: $('#shortcuts-overlay'),
  shortcutsClose: $('#shortcuts-close'),
  themeToggle: $('#theme-toggle'),
  settingsBtn: $('#settings-btn'),
  avatar: $('#avatar'),
  avatarInitials: $('#avatar-initials'),
  fabAdd: $('#fab-add'),
  focusToggle: $('#focus-toggle'),
  detailPanel: $('#detail-panel'),
  detailClose: $('#detail-close'),
  detailBody: $('#detail-body'),
  statTotal: $('#stat-total'),
  statCompleted: $('#stat-completed'),
  statRemaining: $('#stat-remaining'),
  statStreak: $('#stat-streak'),
  cmdOverlay: $('#cmd-palette-overlay'),
  cmdInput: $('#cmd-palette-input'),
  cmdResults: $('#cmd-palette-results'),
  quickAddOverlay: $('#quick-add-overlay'),
  quickAddInput: $('#quick-add-input'),
  quickAddClose: $('#quick-add-close'),
  bottomNav: $('#bottom-nav'),
  sidebarCollapse: $('#sidebar-collapse'),
};

/* ============================================
   HELPERS
   ============================================ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const diff = d.getTime() - today.getTime();
  const day = Math.round(diff / 86400000);
  if (day === 0) return 'Today';
  if (day === 1) return 'Tomorrow';
  if (day === -1) return 'Yesterday';
  if (day > 0 && day < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

function isDueToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

function priorityWeight(p) { return p === 'high' ? 3 : p === 'medium' ? 2 : 1; }

function getSortFn(sortBy) {
  const fns = {
    order: (a, b) => (a.completed === b.completed ? ((a.order ?? 0) - (b.order ?? 0)) : a.completed ? 1 : -1),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    alpha: (a, b) => a.text.localeCompare(b.text),
    priority: (a, b) => (priorityWeight(b.priority) - priorityWeight(a.priority)) || ((a.order ?? 0) - (b.order ?? 0)),
    dueDate: (a, b) => {
      if (!a.dueDate && !b.dueDate) return (a.order ?? 0) - (b.order ?? 0);
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    },
  };
  return fns[sortBy] || fns.order;
}

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

/* ============================================
   TREE HELPERS
   ============================================ */
function findTask(tasks, id) {
  for (const t of tasks) {
    if (t.id === id) return t;
    if (t.children && t.children.length) {
      const found = findTask(t.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeTask(tasks, id) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) { const [removed] = tasks.splice(idx, 1); return removed; }
  for (const t of tasks) {
    if (t.children && t.children.length) {
      const removed = removeTask(t.children, id);
      if (removed) return removed;
    }
  }
  return null;
}

function forEachTask(tasks, fn) {
  for (const t of tasks) {
    fn(t);
    if (t.children && t.children.length) forEachTask(t.children, fn);
  }
}

function flattenTree(tasks) {
  const result = [];
  function walk(list, depth) {
    for (const t of list) {
      result.push({ ...t, _depth: depth });
      if (t.children && t.children.length && !t.collapsed) walk(t.children, depth + 1);
    }
  }
  walk(tasks, 0);
  return result;
}

function countTasks(tasks) {
  let c = 0;
  for (const t of tasks) { c++; if (t.children) c += countTasks(t.children); }
  return c;
}

function countCompleted(tasks) {
  let c = 0;
  for (const t of tasks) { if (t.completed) c++; if (t.children) c += countCompleted(t.children); }
  return c;
}

function filterTree(tasks, fn) {
  return tasks.filter(t => {
    if (t.children) t.children = filterTree(t.children, fn);
    return fn(t);
  });
}

function filterTreeIncomplete(tasks) {
  const result = [];
  for (const t of tasks) {
    if (!t.completed) {
      const clone = { ...t, children: t.children ? filterTreeIncomplete(t.children) : [] };
      result.push(clone);
    }
  }
  return result;
}

function getParentOfTask(tasks, id, parent = null) {
  for (const t of tasks) {
    if (t.id === id) return parent;
    if (t.children && t.children.length) {
      const found = getParentOfTask(t.children, id, t);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/* Smart date parsing */
function parseSmartDate(input) {
  const lower = input.toLowerCase().trim();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (lower === 'today') return getTodayStr();
  if (lower === 'tomorrow') { const d = new Date(today); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }
  if (lower === 'next week') { const d = new Date(today); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; }
  if (lower === 'next month') { const d = new Date(today); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; }
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lower === 'next ' + days[i]) {
      const d = new Date(today);
      const currentDay = d.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }
  return null;
}

/* Quick add parsing: "task text #high @work tomorrow" */
function parseQuickAdd(input) {
  let text = input;
  let priority = 'medium';
  let category = '';
  let dueDate = null;

  const priorityMatch = text.match(/#(high|medium|low)\b/i);
  if (priorityMatch) { priority = priorityMatch[1].toLowerCase(); text = text.replace(priorityMatch[0], '').trim(); }

  const catMatch = text.match(/@(work|personal|urgent|ideas)\b/i);
  if (catMatch) { category = catMatch[1].toLowerCase(); text = text.replace(catMatch[0], '').trim(); }

  const datePhrases = ['next week', 'next month', 'next sunday', 'next monday', 'next tuesday', 'next wednesday', 'next thursday', 'next friday', 'next saturday', 'today', 'tomorrow'];
  for (const phrase of datePhrases) {
    const re = new RegExp('\\b' + phrase + '\\b', 'i');
    if (re.test(text)) {
      dueDate = parseSmartDate(phrase);
      text = text.replace(re, '').trim();
      break;
    }
  }

  return { text: text || input.trim(), priority, category, dueDate };
}

/* ============================================
   DATA PERSISTENCE
   ============================================ */
function saveData() {
  try {
    const data = {
      version: 2,
      theme: state.theme,
      checklists: state.checklists,
      activeChecklistId: state.activeChecklistId,
      filter: state.filter,
      sortBy: state.sortBy,
      categoryFilter: state.categoryFilter,
      searchQuery: state.searchQuery,
      completedExpanded: state.completedExpanded,
      sidebarCollapsed: state.sidebarCollapsed,
      view: state.view,
      focusMode: state.focusMode,
      streak: state.streak,
      completedHistory: state.completedHistory,
      lastActiveDate: state.lastActiveDate,
    };
    localStorage.setItem('checklist-app-v2', JSON.stringify(data));
  } catch (e) { console.warn('Save failed:', e); }
}

function loadData() {
  try {
    const raw = localStorage.getItem('checklist-app-v2');
    if (!raw) return false;
    const data = JSON.parse(raw);
    Object.assign(state, {
      theme: data.theme || 'dark',
      checklists: data.checklists || [],
      activeChecklistId: data.activeChecklistId || null,
      filter: data.filter || 'all',
      sortBy: data.sortBy || 'order',
      categoryFilter: data.categoryFilter || '',
      searchQuery: data.searchQuery || '',
      completedExpanded: data.completedExpanded !== false,
      sidebarCollapsed: data.sidebarCollapsed || false,
      view: data.view || 'dashboard',
      focusMode: data.focusMode || false,
      streak: data.streak || 0,
      completedHistory: data.completedHistory || [],
      lastActiveDate: data.lastActiveDate || null,
    });
    if (state.activeChecklistId) {
      const exists = state.checklists.some(c => c.id === state.activeChecklistId);
      if (!exists) state.activeChecklistId = state.checklists.length > 0 ? state.checklists[0].id : null;
    } else if (state.checklists.length > 0) {
      state.activeChecklistId = state.checklists[0].id;
    }
    return true;
  } catch (e) { console.warn('Load failed:', e); return false; }
}

/* ============================================
   STREAK TRACKING
   ============================================ */
function updateStreak() {
  const today = getTodayStr();
  const completedToday = state.checklists.some(cl => {
    let found = false;
    forEachTask(cl.tasks, t => { if (t.completed && t.completedAt && t.completedAt.startsWith(today)) found = true; });
    return found;
  });
  if (!state.lastActiveDate || state.lastActiveDate !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (state.lastActiveDate === yesterdayStr) {
      if (completedToday) state.streak++;
    } else if (state.lastActiveDate !== today) {
      state.streak = completedToday ? 1 : 0;
    }
    if (completedToday) state.lastActiveDate = today;
    const historyEntry = state.completedHistory.find(e => e.date === today);
    let todayCount = 0;
    state.checklists.forEach(cl => { forEachTask(cl.tasks, t => { if (t.completed && t.completedAt && t.completedAt.startsWith(today)) todayCount++; }); });
    if (historyEntry) { historyEntry.count = todayCount; } else { state.completedHistory.push({ date: today, count: todayCount }); }
    state.completedHistory = state.completedHistory.slice(-30);
    saveData();
  }
}

function getWeekHistory() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const entry = state.completedHistory.find(e => e.date === ds);
    days.push({ date: ds, count: entry ? entry.count : 0, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) });
  }
  return days;
}

/* ============================================
   THEME
   ============================================ */
function applyTheme() {
  dom.html.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveData();
  showToast(state.theme === 'dark' ? 'Dark mode' : 'Light mode', 'info');
}

/* ============================================
   CHECKLIST OPERATIONS
   ============================================ */
function getActiveChecklist() {
  return state.checklists.find(c => c.id === state.activeChecklistId) || null;
}

function createChecklist(title) {
  const cl = { id: uid(), title: title.trim(), createdAt: new Date().toISOString(), tasks: [] };
  state.checklists.push(cl);
  state.activeChecklistId = cl.id;
  state.view = 'checklist';
  saveData(); render();
  showToast('List created', 'success');
}

function renameChecklist(id, title) {
  const cl = state.checklists.find(c => c.id === id);
  if (!cl) return;
  cl.title = title.trim();
  saveData(); render();
}

function deleteChecklist(id) {
  const idx = state.checklists.findIndex(c => c.id === id);
  if (idx === -1) return;
  state.checklists.splice(idx, 1);
  if (state.activeChecklistId === id) {
    state.activeChecklistId = state.checklists.length > 0 ? state.checklists[0].id : null;
    if (!state.activeChecklistId) state.view = 'dashboard';
  }
  saveData(); render();
  showToast('List deleted', 'info');
}

/* ============================================
   TASK OPERATIONS
   ============================================ */
function addTask(text, priority, dueDate, category, parentId = null) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const parent = parentId ? findTask(cl.tasks, parentId) : null;
  const target = parent ? parent.children : cl.tasks;
  const activeInLevel = target.filter(t => !t.completed);
  const maxOrder = activeInLevel.length > 0 ? Math.max(...activeInLevel.map(t => t.order ?? 0)) : -1;
  const task = {
    id: uid(), text: text.trim(), description: '', completed: false,
    priority: priority || 'medium', dueDate: dueDate || null, category: category || '',
    order: maxOrder + 1, createdAt: new Date().toISOString(),
    children: [], collapsed: false,
  };
  target.push(task);
  if (parent && parent.collapsed) parent.collapsed = false;
  saveData(); render();
  showToast('Task added', 'success', { cb: () => { removeTask(cl.tasks, task.id); saveData(); render(); } });
}

function editTask(taskId, updates) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const task = findTask(cl.tasks, taskId);
  if (!task) return;
  Object.assign(task, updates);
  saveData(); render();
  updateDetailPanel();
}

function deleteTask(taskId) {
  const cl = getActiveChecklist();
  if (!cl) return;
  removeTask(cl.tasks, taskId);
  if (state.selectedTaskId === taskId) { state.selectedTaskId = null; }
  state.selectedTaskIds = state.selectedTaskIds.filter(id => id !== taskId);
  saveData(); render(); closeDetailPanel();
  showToast('Task deleted', 'info');
}

function toggleTask(taskId, cascade = false) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const task = findTask(cl.tasks, taskId);
  if (!task) return;
  const wasCompleted = task.completed;
  task.completed = !wasCompleted;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  if (cascade && task.children) {
    forEachTask(task.children, child => {
      child.completed = task.completed;
      child.completedAt = task.completed ? new Date().toISOString() : null;
    });
  }
  saveData(); render();
  updateDetailPanel();
  updateStreak();
  if (!wasCompleted) {
    showToast('Task completed', 'success', { cb: () => toggleTask(taskId, cascade) });
  }
}

function reorderTasks(taskId, newOrder) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const parent = getParentOfTask(cl.tasks, taskId);
  const siblings = parent ? parent.children : cl.tasks;
  const task = findTask(cl.tasks, taskId);
  if (!task) return;
  const activeTasks = siblings.filter(t => !t.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = activeTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  activeTasks.splice(idx, 1);
  activeTasks.splice(newOrder, 0, task);
  activeTasks.forEach((t, i) => { t.order = i; });
  saveData(); render();
}

function addSubTask(parentId, text, priority, dueDate, category) {
  addTask(text, priority, dueDate, category, parentId);
}

function toggleCollapse(taskId) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const task = findTask(cl.tasks, taskId);
  if (!task) return;
  task.collapsed = !task.collapsed;
  saveData(); render();
}

function indentTask(taskId) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const parent = getParentOfTask(cl.tasks, taskId);
  const siblings = parent ? parent.children : cl.tasks;
  const idx = siblings.findIndex(t => t.id === taskId);
  if (idx <= 0) return;
  const newParent = siblings[idx - 1];
  const [task] = siblings.splice(idx, 1);
  if (!newParent.children) newParent.children = [];
  newParent.children.push(task);
  newParent.collapsed = false;
  saveData(); render();
}

function outdentTask(taskId) {
  const cl = getActiveChecklist();
  if (!cl) return;
  const parent = getParentOfTask(cl.tasks, taskId);
  if (!parent) return;
  const grandparent = getParentOfTask(cl.tasks, parent.id);
  const siblings = parent.children;
  const idx = siblings.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  const [task] = siblings.splice(idx, 1);
  const target = grandparent ? grandparent.children : cl.tasks;
  const parentIdx = target.findIndex(t => t.id === parent.id);
  target.splice(parentIdx + 1, 0, task);
  saveData(); render();
}

function clearCompleted() {
  const cl = getActiveChecklist();
  if (!cl) return;
  function removeCompleted(tasks) {
    return tasks.filter(t => {
      if (t.children) t.children = removeCompleted(t.children);
      return !t.completed;
    });
  }
  cl.tasks = removeCompleted(cl.tasks);
  saveData(); render();
  showToast('Completed tasks cleared', 'info');
}

function bulkCompleteTasks(taskIds) {
  const cl = getActiveChecklist();
  if (!cl) return;
  taskIds.forEach(id => {
    const task = findTask(cl.tasks, id);
    if (task && !task.completed) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
    }
  });
  state.selectedTaskIds = [];
  state.multiSelect = false;
  saveData(); render();
  showToast(`${taskIds.length} tasks completed`, 'success');
  updateStreak();
}

function bulkDeleteTasks(taskIds) {
  const cl = getActiveChecklist();
  if (!cl) return;
  taskIds.forEach(id => { removeTask(cl.tasks, id); });
  state.selectedTaskIds = [];
  state.multiSelect = false;
  saveData(); render();
  showToast(`${taskIds.length} tasks deleted`, 'info');
}

/* ============================================
   FILTERED / SORTED TASKS
   ============================================ */
function getProcessedTasks() {
  const cl = getActiveChecklist();
  if (!cl) return [];
  let tasks = flattenTree(cl.tasks);
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    tasks = tasks.filter(t => t.text.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
  }
  if (state.todayMode) {
    const today = getTodayStr();
    tasks = tasks.filter(t => !t.completed && t.dueDate === today);
  }
  if (state.categoryFilter) {
    tasks = tasks.filter(t => t.category === state.categoryFilter);
  }
  if (state.filter === 'active') tasks = tasks.filter(t => !t.completed);
  else if (state.filter === 'completed') tasks = tasks.filter(t => t.completed);
  const sortFn = getSortFn(state.sortBy);
  tasks.sort(sortFn);
  return tasks;
}

/* ============================================
   TOAST
   ============================================ */
function showToast(message, type = 'info', undoData = null) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const icon = document.createElement('span');
  icon.className = `toast-icon ${type}`;
  icon.innerHTML = icons[type] || icons.info;
  const msg = document.createElement('span');
  msg.className = 'toast-message';
  msg.textContent = message;
  toast.append(icon, msg);
  if (undoData) {
    const ub = document.createElement('button');
    ub.className = 'toast-undo-btn';
    ub.textContent = 'Undo';
    ub.onclick = () => { undoData.cb(); toast.classList.add('removing'); setTimeout(() => toast.remove(), 180); };
    toast.append(ub);
  }
  dom.toastContainer.append(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 180); }, 3000);
}

/* ============================================
   MODAL
   ============================================ */
let modalResolve = null;

function showModal({ title, bodyHTML, footerHTML, onClose }) {
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = bodyHTML;
  dom.modalFooter.innerHTML = footerHTML || '';
  dom.modalOverlay.classList.remove('hidden');
  dom.searchInput.blur();
  const close = () => {
    dom.modalOverlay.classList.add('hidden');
    if (onClose) onClose();
    if (modalResolve) { modalResolve(null); modalResolve = null; }
  };
  dom.modalClose.onclick = close;
  const fi = dom.modalBody.querySelector('input, select, button, textarea');
  if (fi) setTimeout(() => fi.focus(), 100);
}

function awaitModalClose() {
  return new Promise(r => { modalResolve = r; });
}

function closeModal() {
  dom.modalOverlay.classList.add('hidden');
  if (modalResolve) { modalResolve(null); modalResolve = null; }
}

dom.modalOverlay.addEventListener('click', e => { if (e.target === dom.modalOverlay) closeModal(); });

/* ============================================
   CONFIRM
   ============================================ */
let confirmResolve = null;

function showConfirm(message) {
  dom.confirmMessage.textContent = message;
  dom.confirmOverlay.classList.remove('hidden');
  dom.confirmCancel.focus();
  return new Promise(r => { confirmResolve = r; });
}

function closeConfirm(result) {
  dom.confirmOverlay.classList.add('hidden');
  if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
}

dom.confirmOk.onclick = () => closeConfirm(true);
dom.confirmCancel.onclick = () => closeConfirm(false);
dom.confirmOverlay.addEventListener('click', e => { if (e.target === dom.confirmOverlay) closeConfirm(false); });

/* ============================================
   DETAIL PANEL
   ============================================ */
function openDetailPanel(taskId) {
  state.selectedTaskId = taskId;
  dom.detailPanel.classList.remove('hidden');
  updateDetailPanel();
}

function closeDetailPanel() {
  state.selectedTaskId = null;
  dom.detailPanel.classList.add('hidden');
}

dom.detailClose.addEventListener('click', closeDetailPanel);

function updateDetailPanel() {
  if (!state.selectedTaskId || dom.detailPanel.classList.contains('hidden')) return;
  const cl = getActiveChecklist();
  if (!cl) { closeDetailPanel(); return; }
  const task = findTask(cl.tasks, state.selectedTaskId);
  if (!task) { closeDetailPanel(); return; }

  const todayStr = getTodayStr();
  const categories = ['', 'work', 'personal', 'urgent', 'ideas'];
  const catOptions = categories.map(c => `<option value="${c}"${task.category === c ? ' selected' : ''}>${c ? c.charAt(0).toUpperCase() + c.slice(1) : 'None'}</option>`).join('');

  const parent = getParentOfTask(cl.tasks, task.id);
  const hasChildren = task.children && task.children.length > 0;
  const childTotal = hasChildren ? countTasks(task.children) : 0;
  const childDone = hasChildren ? countCompleted(task.children) : 0;

  let hierarchyInfo = '';
  if (parent) {
    hierarchyInfo += `<div class="detail-field"><div class="detail-field-label">Parent</div><div class="detail-field-input" style="color:var(--text-tertiary)">${escapeHtml(parent.text)}</div></div>`;
  }
  if (hasChildren) {
    hierarchyInfo += `<div class="detail-field"><div class="detail-field-label">Subtasks</div><div class="detail-field-input" style="color:var(--text-tertiary)">${childDone}/${childTotal} complete</div></div>`;
  }

  dom.detailBody.innerHTML = `
    ${hierarchyInfo}
    <div class="detail-field">
      <div class="detail-field-label">Task</div>
      <input class="detail-field-input" id="detail-text" value="${escapeHtml(task.text)}">
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Description</div>
      <textarea class="detail-field-textarea" id="detail-desc">${escapeHtml(task.description || '')}</textarea>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Priority</div>
      <select class="detail-field-select" id="detail-priority">
        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
      </select>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Category</div>
      <select class="detail-field-select" id="detail-category">${catOptions}</select>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Due Date</div>
      <input class="detail-field-input" type="date" id="detail-due" value="${task.dueDate || ''}">
    </div>
    ${hasChildren ? '<div style="margin-top:12px;display:flex;gap:8px"><button class="btn btn-secondary btn-sm" id="detail-toggle-children">' + (task.collapsed ? 'Expand' : 'Collapse') + ' subtasks</button></div>' : ''}`;

  const save = () => {
    editTask(task.id, {
      text: ($('#detail-text')?.value || '').trim(),
      description: ($('#detail-desc')?.value || '').trim(),
      priority: $('#detail-priority')?.value || 'medium',
      category: $('#detail-category')?.value || '',
      dueDate: $('#detail-due')?.value || null,
    });
  };
  dom.detailBody.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('change', save);
    el.addEventListener('blur', save);
  });
  $('#detail-text')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  });
  $('#detail-toggle-children')?.addEventListener('click', () => {
    toggleCollapse(task.id);
    updateDetailPanel();
  });
}

/* ============================================
   DASHBOARD RENDER
   ============================================ */
function renderDashboard() {
  const allTasks = [];
  state.checklists.forEach(cl => { forEachTask(cl.tasks, t => allTasks.push(t)); });
  const total = allTasks.length;
  const done = allTasks.filter(t => t.completed).length;
  const today = getTodayStr();
  const overdue = allTasks.filter(t => !t.completed && t.dueDate && isOverdue(t.dueDate));
  const dueToday = allTasks.filter(t => !t.completed && t.dueDate && isDueToday(t.dueDate));
  const weekHistory = getWeekHistory();
  const maxCount = Math.max(...weekHistory.map(d => d.count), 1);
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  let html = `
    <div class="dashboard-view">
      <div class="dashboard-greeting">${greeting}.</div>
      <div class="dashboard-subtitle">${state.checklists.length} list${state.checklists.length !== 1 ? 's' : ''} · ${done}/${total} tasks done</div>

      <div class="dashboard-stats-row">
        <div class="dashboard-stat-card">
          <div class="dashboard-stat-number ${overdue.length > 0 ? 'overdue' : ''}">${overdue.length}</div>
          <div class="dashboard-stat-label">Overdue</div>
        </div>
        <div class="dashboard-stat-card">
          <div class="dashboard-stat-number today">${dueToday.length}</div>
          <div class="dashboard-stat-label">Due today</div>
        </div>
        <div class="dashboard-stat-card">
          <div class="dashboard-stat-number">${total - done}</div>
          <div class="dashboard-stat-label">Remaining</div>
        </div>
        <div class="dashboard-stat-card">
          <div class="dashboard-stat-number streak">${state.streak}</div>
          <div class="dashboard-stat-label">Day streak</div>
        </div>
      </div>`;

  if (state.checklists.length > 0) {
    html += `<div class="dashboard-section-title">Overdue</div>
      <div class="dashboard-task-list">`;
    if (overdue.length === 0) {
      html += `<div class="dashboard-task-empty">No overdue tasks. You're on track!</div>`;
    } else {
      overdue.slice(0, 5).forEach(t => {
        const cl = state.checklists.find(c => findTask(c.tasks, t.id));
        html += `<div class="dashboard-task-item" data-dash-task="${t.id}" data-dash-list="${cl ? cl.id : ''}">
          <div class="dashboard-task-dot ${t.priority}"></div>
          <span class="dashboard-task-text">${escapeHtml(t.text)}</span>
          <span class="dashboard-task-list-name">${cl ? escapeHtml(cl.title) : ''}</span>
        </div>`;
      });
    }
    html += `</div>`;

    html += `<div class="dashboard-section-title">Due today</div>
      <div class="dashboard-task-list">`;
    if (dueToday.length === 0) {
      html += `<div class="dashboard-task-empty">No tasks due today. Enjoy your day!</div>`;
    } else {
      dueToday.slice(0, 5).forEach(t => {
        const cl = state.checklists.find(c => findTask(c.tasks, t.id));
        html += `<div class="dashboard-task-item" data-dash-task="${t.id}" data-dash-list="${cl ? cl.id : ''}">
          <div class="dashboard-task-dot ${t.priority}"></div>
          <span class="dashboard-task-text">${escapeHtml(t.text)}</span>
          <span class="dashboard-task-list-name">${cl ? escapeHtml(cl.title) : ''}</span>
        </div>`;
      });
    }
    html += `</div>`;
  }

  html += `<div class="dashboard-section-title">This week</div>
    <div class="dashboard-chart">
      ${weekHistory.map(d => `
        <div class="dashboard-chart-bar${d.count > 0 ? ' has-data' : ''}${d.date === today ? ' today-bar' : ''}" style="height:${Math.max(4, (d.count / maxCount) * 100)}%">
          ${d.count > 0 ? `<span class="dashboard-chart-count">${d.count}</span>` : ''}
          <span class="dashboard-chart-label">${d.dayName}</span>
        </div>`).join('')}
    </div>`;

  html += `<div class="dashboard-section-title">Quick actions</div>
    <div class="quick-actions">
      <button class="btn btn-primary" data-dash-new-list><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New list</button>
      ${state.checklists.length > 0 ? state.checklists.map(cl => `
        <button class="btn btn-secondary btn-sm" data-dash-open="${cl.id}">${escapeHtml(cl.title)}</button>`).join('') : ''}
    </div>
  </div>`;

  dom.content.innerHTML = html;

  $$('[data-dash-task]', dom.content).forEach(el => {
    el.addEventListener('click', () => {
      const listId = el.dataset.dashList;
      const taskId = el.dataset.dashTask;
      if (listId) {
        state.activeChecklistId = listId;
        state.view = 'checklist';
        state.filter = 'all';
        saveData(); render();
        setTimeout(() => {
          const taskEl = dom.content.querySelector(`[data-task-id="${taskId}"]`);
          if (taskEl) taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  });

  $('[data-dash-new-list]', dom.content)?.addEventListener('click', handleNewChecklist);
  $$('[data-dash-open]', dom.content).forEach(el => {
    el.addEventListener('click', () => {
      state.activeChecklistId = el.dataset.dashOpen;
      state.view = 'checklist';
      saveData(); render();
    });
  });
}

/* ============================================
   RENDER
   ============================================ */
function render() {
  applyTheme();
  renderSidebar();
  if (state.view === 'dashboard' || !getActiveChecklist()) {
    state.view = 'dashboard';
    renderDashboard();
  } else {
    renderContent();
  }
  updateSearchUI();
  updateStats();
  updateAvatar();
  dom.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
  dom.body.classList.toggle('focus-mode', state.focusMode);
  dom.body.classList.toggle('multi-select-active', state.multiSelect);
  dom.fabAdd.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  updateBottomNav();
}

function updateBottomNav() {
  $$('.bottom-nav-btn').forEach(btn => {
    const view = btn.dataset.view;
    const isToday = view === 'today' && state.todayMode;
    const isInbox = view === 'inbox' && !state.todayMode && state.view === 'checklist' && state.filter === 'active';
    btn.classList.toggle('active', view === state.view || isToday || isInbox);
  });
}

function updateStats() {
  let total = 0, done = 0;
  state.checklists.forEach(cl => { total += countTasks(cl.tasks); done += countCompleted(cl.tasks); });
  dom.statTotal.textContent = total;
  dom.statCompleted.textContent = done;
  dom.statRemaining.textContent = total - done;
  dom.statStreak.innerHTML = `<span style="color:var(--warning)">${state.streak}</span> days`;
  dom.checklistCount.textContent = state.checklists.length;
}

function updateAvatar() {
  const cl = getActiveChecklist();
  const name = cl ? cl.title : 'U';
  dom.avatarInitials.textContent = name.charAt(0).toUpperCase();
}

function updateSearchUI() {
  dom.searchClear.classList.toggle('hidden', !state.searchQuery);
}

function renderSidebar() {
  dom.checklistList.innerHTML = '';
  if (state.checklists.length === 0) {
    const e = document.createElement('div');
    e.style.cssText = 'padding: 28px 12px; text-align: center; font-size: var(--text-sm); color: var(--text-tertiary);';
    e.textContent = 'No lists yet';
    dom.checklistList.appendChild(e);
    return;
  }
  const colors = ['#5b5fe7', '#e55353', '#3dcd6a', '#dba12e', '#5b9bef', '#c084fc', '#ec4899', '#14b8a6'];
  state.checklists.forEach((cl, i) => {
    const total = countTasks(cl.tasks);
    const done = countCompleted(cl.tasks);
    const item = document.createElement('div');
    item.className = `checklist-item${cl.id === state.activeChecklistId ? ' active' : ''}`;
    item.dataset.id = cl.id;
    item.setAttribute('role', 'listitem');
    item.tabIndex = 0;
    const dot = document.createElement('div');
    dot.className = 'checklist-color';
    dot.style.setProperty('--checklist-color', colors[i % colors.length]);
    const info = document.createElement('div');
    info.className = 'checklist-info';
    const title = document.createElement('span');
    title.className = 'checklist-title';
    title.textContent = cl.title;
    const count = document.createElement('span');
    count.className = 'checklist-count';
    count.textContent = total > 0 ? `${done}/${total}` : '0';
    info.append(title, count);
    const del = document.createElement('button');
    del.className = 'checklist-delete-btn';
    del.setAttribute('aria-label', `Delete ${cl.title}`);
    del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    del.addEventListener('click', e => { e.stopPropagation(); handleDeleteChecklist(cl.id); });
    item.append(dot, info, del);
    item.addEventListener('click', () => {
      state.activeChecklistId = cl.id;
      state.view = 'checklist';
      state.todayMode = false;
      state.filter = 'all';
      state.categoryFilter = '';
      state.searchQuery = '';
      dom.searchInput.value = '';
      closeDetailPanel();
      saveData(); render();
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter') { item.click(); }
    });
    dom.checklistList.appendChild(item);
  });
}

function renderContent() {
  const cl = getActiveChecklist();
  if (!cl) {
    renderDashboard();
    return;
  }

  const processedTasks = getProcessedTasks();
  const allTasks = cl.tasks;
  const totalTasks = countTasks(allTasks);
  const doneCount = countCompleted(allTasks);
  const processedActive = processedTasks.filter(t => !t.completed);
  const processedCompleted = processedTasks.filter(t => t.completed);

  const getCategories = () => {
    const cats = new Set();
    forEachTask(allTasks, t => { if (t.category) cats.add(t.category); });
    return [...cats];
  };

  const isToday = state.todayMode;
  let html = `
    <div class="checklist-view">
      <div class="checklist-view-header">
        <div class="checklist-view-title-wrapper">
          <h1 class="checklist-view-title">${isToday ? 'Today' : escapeHtml(cl.title)}</h1>
          <p class="checklist-view-meta">${isToday ? 'Tasks due today' : `${totalTasks} task${totalTasks !== 1 ? 's' : ''} · ${doneCount} complete`}</p>
        </div>
        <div class="checklist-view-actions">
          ${isToday ? '' : `<button class="icon-btn" data-rename-checklist aria-label="Rename list"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`}
          ${isToday ? '' : `<button class="icon-btn" data-delete-checklist aria-label="Delete list"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`}
        </div>
      </div>

      <div class="progress-wrapper">
        <div class="progress-header">
          <span class="progress-label">Progress</span>
          <span class="progress-text">${totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0}%</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0}%"></div></div>
      </div>

      <div class="toolbar">
        <div class="filter-bar">
          <button class="filter-btn${state.filter === 'all' ? ' active' : ''}" data-filter="all">All <span class="filter-count">${totalTasks}</span></button>
          <button class="filter-btn${state.filter === 'active' ? ' active' : ''}" data-filter="active">Active <span class="filter-count">${totalTasks - doneCount}</span></button>
          <button class="filter-btn${state.filter === 'completed' ? ' active' : ''}" data-filter="completed">Completed <span class="filter-count">${doneCount}</span></button>
        </div>
        <select class="sort-select" data-sort>
          <option value="order" ${state.sortBy === 'order' ? 'selected' : ''}>Custom</option>
          <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="oldest" ${state.sortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
          <option value="alpha" ${state.sortBy === 'alpha' ? 'selected' : ''}>A-Z</option>
          <option value="priority" ${state.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
          <option value="dueDate" ${state.sortBy === 'dueDate' ? 'selected' : ''}>Due date</option>
        </select>
        ${getCategories().length > 0 ? `
        <select class="sort-select" data-category-filter style="max-width:140px">
          <option value="">All categories</option>
          ${getCategories().map(c => `<option value="${c}"${state.categoryFilter === c ? ' selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
        </select>` : ''}
        <div class="toolbar-actions">
          ${doneCount > 0 ? `<button class="btn btn-ghost btn-sm" data-clear-completed>Clear completed</button>` : ''}
        </div>
      </div>

      ${!state.searchQuery ? `
      <div class="checklist-weekly-section">
        <div class="dashboard-section-title">Weekly overview</div>
        <div class="dashboard-chart" style="height:80px;padding:8px 0;">
          ${(() => {
            const wh = getWeekHistory();
            const mx = Math.max(...wh.map(d => d.count), 1);
            const t = getTodayStr();
            return wh.map(d => `
              <div class="dashboard-chart-bar${d.count > 0 ? ' has-data' : ''}${d.date === t ? ' today-bar' : ''}" style="height:${Math.max(4, (d.count / mx) * 100)}%">
                ${d.count > 0 ? `<span class="dashboard-chart-count">${d.count}</span>` : ''}
                <span class="dashboard-chart-label">${d.dayName}</span>
              </div>`).join('');
          })()}
        </div>
      </div>` : ''}`;

  if (state.searchQuery && processedTasks.length === 0) {
    html += `<div class="empty-state task-list-empty"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><h3 class="empty-state-title">No results found</h3><p class="empty-state-desc">No tasks match "${escapeHtml(state.searchQuery)}"</p></div>`;
  } else if (isToday && processedTasks.length === 0) {
    html += `<div class="empty-state task-list-empty"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h3 class="empty-state-title">Nothing due today</h3><p class="empty-state-desc">All tasks are on track for the days ahead.</p></div>`;
  } else if (totalTasks === 0) {
    html += `<div class="empty-state task-list-empty"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><h3 class="empty-state-title">Your workspace is clear</h3><p class="empty-state-desc">Create your first task to begin organizing your workflow.</p></div>`;
  } else if (state.filter === 'active' && processedActive.length === 0) {
    html += `<div class="empty-state task-list-empty"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h3 class="empty-state-title">All clear</h3><p class="empty-state-desc">No active tasks. Great work!</p></div>`;
  } else if (state.filter === 'completed' && processedCompleted.length === 0) {
    html += `<div class="empty-state task-list-empty"><div class="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><h3 class="empty-state-title">No completed tasks</h3><p class="empty-state-desc">Complete a task to see it here.</p></div>`;
  } else {
    html += `<div class="task-list" data-task-list>`;
    if (state.searchQuery || state.todayMode) {
      const flat = state.filter === 'completed' ? processedCompleted : processedActive;
      flat.forEach(t => { html += renderTaskItem({ ...t, children: [] }, t._depth || 0); });
    } else if (state.filter === 'completed') {
      const completedTree = [];
      function buildCompletedTree(nodes, target) {
        for (const t of nodes) {
          if (t.completed) {
            const clone = { ...t, children: [] };
            target.push(clone);
            if (t.children) buildCompletedTree(t.children, clone.children);
          } else if (t.children && t.children.length) {
            const partial = { ...t, children: [] };
            buildCompletedTree(t.children, partial.children);
            if (partial.children.length > 0) target.push(partial);
          }
        }
      }
      buildCompletedTree(allTasks, completedTree);
      html += renderTreeToList(completedTree, 0);
    } else {
      const treeToRender = filterTreeIncomplete(allTasks);
      html += renderTreeToList(treeToRender, 0);
    }
    html += `</div>`;
    if (state.filter !== 'completed' && !state.searchQuery && !state.todayMode && doneCount > 0) {
      html += renderCompletedSection(allTasks);
    }
  }

  if (!state.searchQuery && state.filter !== 'completed') {
    const todayStr = getTodayStr();
    html += `
      <div class="add-task-form">
        <div class="checkbox-placeholder"></div>
        <input type="text" id="add-task-input" placeholder="Add a task..." aria-label="Add a new task" autocomplete="off" spellcheck="false">
        <div class="add-task-extra">
          <select id="add-priority">
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
          <input type="date" id="add-due" value="${todayStr}">
          <button class="btn btn-primary btn-sm" id="add-task-btn" style="padding:3px 10px;">Add</button>
        </div>
      </div>`;
  }

  html += `</div>`;
  dom.content.innerHTML = html;
  bindContentEvents();
}

function renderTaskItem(task, depth = 0) {
  const dueDate = task.dueDate;
  let dueClass = '';
  let dueLabel = '';
  if (dueDate) {
    if (isOverdue(dueDate) && !task.completed) dueClass = 'overdue';
    else if (isDueToday(dueDate) && !task.completed) dueClass = 'due-today';
    dueLabel = formatDate(dueDate);
  }
  const pLabel = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium';
  const catLabel = task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : '';
  const isSelected = state.selectedTaskIds.includes(task.id);
  const hasChildren = task.children && task.children.length > 0;
  const childCount = hasChildren ? countTasks(task.children) : 0;
  const childDone = hasChildren ? countCompleted(task.children) : 0;
  const hasSubTree = hasChildren && !task.collapsed;

  let treeToggle = '';
  if (hasChildren) {
    treeToggle = `<div class="task-collapse-toggle" data-toggle-collapse role="button" tabindex="0" aria-label="${task.collapsed ? 'Expand' : 'Collapse'} subtasks">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:${task.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};transition:transform 0.2s">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>`;
  } else {
    treeToggle = '<div class="task-collapse-spacer"></div>';
  }

  let childInfo = '';
  if (hasChildren) {
    childInfo = `<span class="child-count-badge">${childDone}/${childCount}</span>`;
  }

  return `
    <div class="task-item${task.completed ? ' completed' : ''}${state.selectedTaskId === task.id ? ' selected' : ''}${isSelected ? ' selected' : ''}" data-task-id="${task.id}" draggable="${!task.completed}" style="--task-depth: ${depth}">
      ${treeToggle}
      <div class="task-drag-handle" aria-label="Drag to reorder" data-drag-handle>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
      </div>
      <div class="task-checkbox">
        <div class="checkbox-input${task.completed ? ' checked' : ''}" role="checkbox" aria-checked="${task.completed}" tabindex="0" data-toggle-task></div>
      </div>
      <div class="task-check-multi"></div>
      <div class="task-body">
        <div class="task-text">${escapeHtml(task.text)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${dueDate ? `<span class="task-due-date ${dueClass}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${escapeHtml(dueLabel)}</span>` : ''}
          ${task.priority ? `<span class="priority-badge ${task.priority}">${pLabel}</span>` : ''}
          ${task.category ? `<span class="category-badge ${task.category}">${catLabel}</span>` : ''}
          ${childInfo}
        </div>
      </div>
      <div class="task-actions">
        ${depth < 5 ? `<button class="task-action-btn" aria-label="Add subtask" data-add-subtask>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>` : ''}
        <button class="task-action-btn" aria-label="Open details" data-detail-task>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </button>
        ${task.completed ? `<button class="task-action-btn restore-btn" aria-label="Undo complete" data-toggle-task><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>` : ''}
        <button class="task-action-btn delete-btn" aria-label="Delete task" data-delete-task>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    ${hasSubTree ? task.children.map(c => renderTaskItem(c, depth + 1)).join('') : ''}`;
}

function renderTreeToList(tasks, depth = 0) {
  let html = '';
  for (const task of tasks) {
    html += renderTaskItem(task, depth);
  }
  return html;
}

function renderCompletedSection(tasks) {
  const completedTree = [];
  function collectCompleted(nodes, target) {
    for (const t of nodes) {
      if (t.completed) {
        const clone = { ...t, children: [] };
        target.push(clone);
        if (t.children) collectCompleted(t.children, clone.children);
      } else if (t.children && t.children.length) {
        const partial = { ...t, children: [] };
        collectCompleted(t.children, partial.children);
        if (partial.children.length > 0) target.push(partial);
      }
    }
  }
  collectCompleted(tasks, completedTree);
  const totalCompleted = countCompleted(tasks);
  return `
    <div class="completed-section">
      <div class="completed-header" data-toggle-completed>
        <svg class="completed-header-arrow${state.completedExpanded ? '' : ' collapsed'}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="completed-header-text">Completed</span>
        <span class="completed-header-count">${totalCompleted}</span>
      </div>
      <div class="completed-tasks${state.completedExpanded ? '' : ' collapsed'}" data-completed-tasks>
        ${renderTreeToList(completedTree, 0)}
      </div>
    </div>`;
}

/* ============================================
   BIND CONTENT EVENTS
   ============================================ */
function bindContentEvents() {
  $$('.filter-btn', dom.content).forEach(btn => {
    btn.addEventListener('click', () => { state.filter = btn.dataset.filter; saveData(); render(); });
  });

  $('[data-sort]', dom.content)?.addEventListener('change', e => {
    state.sortBy = e.target.value; saveData(); render();
  });

  $('[data-category-filter]', dom.content)?.addEventListener('change', e => {
    state.categoryFilter = e.target.value; saveData(); render();
  });

  $('[data-clear-completed]', dom.content)?.addEventListener('click', clearCompleted);

  $('[data-rename-checklist]', dom.content)?.addEventListener('click', handleRenameChecklist);

  $('[data-delete-checklist]', dom.content)?.addEventListener('click', () => {
    const cl = getActiveChecklist(); if (cl) handleDeleteChecklist(cl.id);
  });

  /* Tree collapse/expand */
  $$('[data-toggle-collapse]', dom.content).forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const item = el.closest('[data-task-id]');
      if (item) toggleCollapse(item.dataset.taskId);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

  /* Add subtask */
  $$('[data-add-subtask]', dom.content).forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const item = el.closest('[data-task-id]');
      if (!item) return;
      const parentId = item.dataset.taskId;
      showModal({
        title: 'Add Subtask',
        bodyHTML: '<div class="form-group"><label class="form-label" for="subtask-text">Task</label><input type="text" class="form-input" id="subtask-text" placeholder="e.g. Review section 3" autocomplete="off"></div>',
        footerHTML: '<button class="btn btn-ghost" data-modal-cancel>Cancel</button><button class="btn btn-primary" data-modal-submit>Add</button>',
      });
      const submit = dom.modalFooter.querySelector('[data-modal-submit]');
      const cancel = dom.modalFooter.querySelector('[data-modal-cancel]');
      const input = dom.modalBody.querySelector('#subtask-text');
      if (input) input.addEventListener('keydown', e2 => { if (e2.key === 'Enter') submit.click(); });
      submit.addEventListener('click', () => {
        if (input && input.value.trim()) {
          addTask(input.value, 'medium', null, '', parentId);
          closeModal();
        }
      });
      cancel.addEventListener('click', closeModal);
      setTimeout(() => input?.focus(), 100);
    });
  });

  /* Multi-select shift-click */
  let lastClickedTaskId = null;
  $$('[data-toggle-task]', dom.content).forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const item = el.closest('[data-task-id]');
      if (!item) return;
      const taskId = item.dataset.taskId;
      if (state.multiSelect) {
        if (e.shiftKey && lastClickedTaskId) {
          const allItems = [...dom.content.querySelectorAll('.task-item:not(.completed)')];
          const startIdx = allItems.findIndex(x => x.dataset.taskId === lastClickedTaskId);
          const endIdx = allItems.findIndex(x => x.dataset.taskId === taskId);
          if (startIdx !== -1 && endIdx !== -1) {
            const [from, to] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
            for (let i = from; i <= to; i++) {
              const id = allItems[i].dataset.taskId;
              if (id && !state.selectedTaskIds.includes(id)) state.selectedTaskIds.push(id);
            }
          }
        } else {
          const idx = state.selectedTaskIds.indexOf(taskId);
          if (idx > -1) state.selectedTaskIds.splice(idx, 1);
          else state.selectedTaskIds.push(taskId);
        }
        lastClickedTaskId = taskId;
        saveData(); render();
      } else {
        toggleTask(taskId, e.altKey);
      }
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const item = el.closest('[data-task-id]'); if (item) toggleTask(item.dataset.taskId); }
    });
  });

  /* Task item click for multi-select */
  $$('.task-item', dom.content).forEach(el => {
    el.addEventListener('click', e => {
      if (state.multiSelect && !e.target.closest('[data-toggle-task]') && !e.target.closest('[data-toggle-collapse]') && !e.target.closest('[data-delete-task]') && !e.target.closest('[data-detail-task]') && !e.target.closest('[data-drag-handle]') && !e.target.closest('[data-add-subtask]')) {
        const taskId = el.dataset.taskId;
        const idx = state.selectedTaskIds.indexOf(taskId);
        if (idx > -1) state.selectedTaskIds.splice(idx, 1);
        else state.selectedTaskIds.push(taskId);
        saveData(); render();
      }
    });
  });

  $$('[data-detail-task]', dom.content).forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); const item = el.closest('[data-task-id]'); if (item) openDetailPanel(item.dataset.taskId); });
  });

  $$('[data-delete-task]', dom.content).forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); const item = el.closest('[data-task-id]'); if (item) handleDeleteTask(item.dataset.taskId); });
  });

  const addInput = $('#add-task-input', dom.content);
  if (addInput) {
    const doAddTask = () => {
      if (!addInput.value.trim()) return;
      const priority = $('#add-priority', dom.content)?.value || 'medium';
      const dueDate = $('#add-due', dom.content)?.value || null;
      addTask(addInput.value, priority, dueDate);
      addInput.value = '';
      if ($('#add-due', dom.content)) $('#add-due', dom.content).value = '';
      addInput.focus();
    };
    addInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doAddTask();
    });
    $('#add-task-btn', dom.content)?.addEventListener('click', doAddTask);
    setTimeout(() => addInput.focus(), 50);
  }

  $('[data-toggle-completed]', dom.content)?.addEventListener('click', () => {
    state.completedExpanded = !state.completedExpanded; saveData(); render();
  });

  setupDragAndDrop();
}

/* ============================================
   DRAG AND DROP
   ============================================ */
let dragState = null;
let touchDragState = null;

function setupDragAndDrop() {
  $$('.task-item', dom.content).forEach(item => {
    item.addEventListener('dragstart', e => {
      if (item.classList.contains('completed')) { e.preventDefault(); return; }
      dragState = item.dataset.taskId;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragState);
    });
    item.addEventListener('dragend', () => {
      $$('.task-item', dom.content).forEach(el => el.classList.remove('dragging', 'drag-over'));
      dragState = null;
    });
    item.addEventListener('dragover', e => e.preventDefault());
    item.addEventListener('dragenter', e => {
      e.preventDefault();
      if (item.dataset.taskId !== dragState && !item.classList.contains('completed')) item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!dragState || item.dataset.taskId === dragState || item.classList.contains('completed')) return;
      const cl = getActiveChecklist();
      if (!cl) return;
      const dragParent = getParentOfTask(cl.tasks, dragState);
      const targetParent = getParentOfTask(cl.tasks, item.dataset.taskId);
      if (dragParent === targetParent) {
        const siblings = dragParent ? dragParent.children : cl.tasks;
        const activeSiblings = siblings.filter(t => !t.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const fromIdx = activeSiblings.findIndex(t => t.id === dragState);
        const toTask = findTask(siblings, item.dataset.taskId);
        const toIdx = toTask ? activeSiblings.findIndex(t => t.id === item.dataset.taskId) : -1;
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) reorderTasks(dragState, toIdx);
      } else {
        indentTask(dragState);
      }
    });
    const handle = item.querySelector('[data-drag-handle]');
    if (handle) {
      handle.addEventListener('touchstart', e => {
        const ti = e.currentTarget.closest('[data-task-id]');
        if (!ti || ti.classList.contains('completed')) return;
        const touch = e.touches[0];
        touchDragState = { taskId: ti.dataset.taskId, item: ti, clone: null, offset: 0 };
        const h = e.currentTarget;
        h.addEventListener('touchmove', tm, { passive: false });
        h.addEventListener('touchend', te, { passive: false });
        h.addEventListener('touchcancel', te, { passive: false });
      }, { passive: false });
    }
  });
}

function tm(e) {
  if (!touchDragState) return;
  e.preventDefault();
  const touch = e.touches[0];
  const taskList = dom.content.querySelector('[data-task-list]');
  if (!taskList) return;
  const items = [...taskList.querySelectorAll('.task-item:not(.completed)')];
  if (!touchDragState.clone) {
    touchDragState.clone = touchDragState.item.cloneNode(true);
    touchDragState.clone.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;opacity:0.9;transform:scale(1.02);box-shadow:var(--shadow-lg);';
    document.body.appendChild(touchDragState.clone);
    const rect = touchDragState.item.getBoundingClientRect();
    touchDragState.clone.style.width = rect.width + 'px';
    touchDragState.offset = touch.clientY - rect.top;
    touchDragState.item.style.opacity = '0.3';
  }
  const rect = touchDragState.item.getBoundingClientRect();
  touchDragState.clone.style.left = rect.left + 'px';
  touchDragState.clone.style.top = (touch.clientY - touchDragState.offset) + 'px';
  items.forEach(el => el.classList.remove('drag-over'));
  const closest = items.reduce((best, el) => {
    if (el.dataset.taskId === touchDragState.taskId) return best;
    const r = el.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    const dist = Math.abs(touch.clientY - mid);
    return dist < best.dist ? { el, dist } : best;
  }, { el: null, dist: Infinity });
  if (closest.el) { closest.el.classList.add('drag-over'); touchDragState.dropTarget = closest.el; }
}

function te() {
  if (!touchDragState) return;
  if (touchDragState.clone) touchDragState.clone.remove();
  touchDragState.item.style.opacity = '1';
  if (touchDragState.dropTarget) {
    touchDragState.dropTarget.classList.remove('drag-over');
    const cl = getActiveChecklist();
    if (cl) {
      const dragParent = getParentOfTask(cl.tasks, touchDragState.taskId);
      const targetParent = getParentOfTask(cl.tasks, touchDragState.dropTarget.dataset.taskId);
      if (dragParent === targetParent) {
        const siblings = dragParent ? dragParent.children : cl.tasks;
        const activeSiblings = siblings.filter(t => !t.completed).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const fromIdx = activeSiblings.findIndex(t => t.id === touchDragState.taskId);
        const toIdx = activeSiblings.findIndex(t => t.id === touchDragState.dropTarget.dataset.taskId);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) reorderTasks(touchDragState.taskId, toIdx);
      } else {
        indentTask(touchDragState.taskId);
      }
    }
  }
  const handle = touchDragState.item.querySelector('[data-drag-handle]');
  if (handle) {
    handle.removeEventListener('touchmove', tm);
    handle.removeEventListener('touchend', te);
    handle.removeEventListener('touchcancel', te);
  }
  touchDragState = null;
}

/* ============================================
   SEARCH
   ============================================ */
dom.searchInput.addEventListener('input', () => {
  state.searchQuery = dom.searchInput.value;
  saveData(); render();
});

dom.searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    dom.searchInput.value = '';
    state.searchQuery = '';
    saveData(); render();
    dom.searchInput.blur();
  }
});

dom.searchClear.addEventListener('click', () => {
  dom.searchInput.value = '';
  state.searchQuery = '';
  saveData(); render();
  dom.searchInput.focus();
});

/* ============================================
   COMMAND PALETTE
   ============================================ */
let cmdHighlightedIdx = -1;

function openCmdPalette() {
  dom.cmdOverlay.classList.remove('hidden');
  dom.cmdInput.value = '';
  dom.cmdInput.focus();
  cmdHighlightedIdx = -1;
  renderCmdResults('');
}

function closeCmdPalette() {
  dom.cmdOverlay.classList.add('hidden');
  dom.cmdInput.blur();
}

function renderCmdResults(query) {
  const q = query.toLowerCase();
  const commands = [
    { id: 'new-list', label: 'New list', shortcut: 'n', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', action: () => { closeCmdPalette(); handleNewChecklist(); } },
    { id: 'dashboard', label: 'Go to dashboard', shortcut: 'd', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', action: () => { closeCmdPalette(); state.view = 'dashboard'; saveData(); render(); } },
    { id: 'focus', label: 'Toggle focus mode', shortcut: 'f', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>', action: () => { closeCmdPalette(); toggleFocusMode(); } },
    { id: 'theme', label: 'Toggle theme', shortcut: '', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/></svg>', action: () => { closeCmdPalette(); toggleTheme(); } },
    { id: 'settings', label: 'Open settings', shortcut: '⌘S', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', action: () => { closeCmdPalette(); handleSettings(); } },
    { id: 'quick-add', label: 'Quick add task', shortcut: '/', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', action: () => { closeCmdPalette(); openQuickAdd(); } },
    { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: '?', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 7 4"/><line x1="9" y1="9" x2="5" y2="5"/></svg>', action: () => { closeCmdPalette(); dom.shortcutsOverlay.classList.remove('hidden'); } },
    { id: 'multi-select', label: 'Toggle multi-select', shortcut: '', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', action: () => { closeCmdPalette(); toggleMultiSelect(); } },
  ];
  const filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q)) : commands;
  dom.cmdResults.innerHTML = filtered.map((c, i) =>
    `<div class="cmd-palette-item${i === cmdHighlightedIdx ? ' highlighted' : ''}" data-cmd-id="${c.id}">
      ${c.icon}
      <span class="cmd-palette-item-label">${c.label}</span>
      ${c.shortcut ? `<span class="cmd-palette-item-shortcut">${c.shortcut}</span>` : ''}
    </div>`
  ).join('');
  $$('.cmd-palette-item', dom.cmdResults).forEach(el => {
    el.addEventListener('click', () => {
      const cmd = commands.find(c => c.id === el.dataset.cmdId);
      if (cmd) cmd.action();
    });
  });
  cmdHighlightedIdx = filtered.length > 0 ? Math.min(cmdHighlightedIdx, filtered.length - 1) : -1;
}

dom.cmdInput.addEventListener('input', () => {
  cmdHighlightedIdx = -1;
  renderCmdResults(dom.cmdInput.value);
});

dom.cmdInput.addEventListener('keydown', e => {
  const items = $$('.cmd-palette-item', dom.cmdResults);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cmdHighlightedIdx = Math.min(cmdHighlightedIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === cmdHighlightedIdx));
    if (cmdHighlightedIdx >= 0) items[cmdHighlightedIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cmdHighlightedIdx = Math.max(cmdHighlightedIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === cmdHighlightedIdx));
    if (cmdHighlightedIdx >= 0) items[cmdHighlightedIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const highlighted = $('.cmd-palette-item.highlighted', dom.cmdResults);
    if (highlighted) { highlighted.click(); return; }
    if (items.length > 0) items[0].click();
  } else if (e.key === 'Escape') {
    closeCmdPalette();
  }
});

dom.cmdOverlay.addEventListener('click', e => { if (e.target === dom.cmdOverlay) closeCmdPalette(); });

/* ============================================
   QUICK ADD
   ============================================ */
function openQuickAdd() {
  dom.quickAddOverlay.classList.remove('hidden');
  dom.quickAddInput.value = '';
  dom.quickAddInput.focus();
}

function closeQuickAdd() {
  dom.quickAddOverlay.classList.add('hidden');
  dom.quickAddInput.blur();
}

dom.quickAddClose.addEventListener('click', closeQuickAdd);
dom.quickAddOverlay.addEventListener('click', e => { if (e.target === dom.quickAddOverlay) closeQuickAdd(); });

dom.quickAddInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeQuickAdd(); }
  if (e.key === 'Enter' && dom.quickAddInput.value.trim()) {
    const parsed = parseQuickAdd(dom.quickAddInput.value);
    if (state.checklists.length === 0) {
      showToast('Create a list first', 'error');
      closeQuickAdd();
      return;
    }
    if (!getActiveChecklist()) {
      state.activeChecklistId = state.checklists[0].id;
      state.view = 'checklist';
    }
    addTask(parsed.text, parsed.priority, parsed.dueDate, parsed.category);
    closeQuickAdd();
    showToast(`Task added: ${parsed.text}${parsed.dueDate ? ' (' + formatDate(parsed.dueDate) + ')' : ''}`, 'success');
  }
});

/* ============================================
   FOCUS MODE
   ============================================ */
function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  saveData(); render();
  showToast(state.focusMode ? 'Focus mode on' : 'Focus mode off', 'info');
}

/* ============================================
   MULTI-SELECT
   ============================================ */
function toggleMultiSelect() {
  state.multiSelect = !state.multiSelect;
  if (!state.multiSelect) state.selectedTaskIds = [];
  saveData(); render();
  if (state.multiSelect) showToast('Multi-select: click tasks to select', 'info');
}

/* ============================================
   HANDLERS
   ============================================ */
function handleNewChecklist() {
  showModal({
    title: 'New List',
    bodyHTML: '<div class="form-group"><label class="form-label" for="new-checklist-title">Name</label><input type="text" class="form-input" id="new-checklist-title" placeholder="e.g. Daily Tasks" autocomplete="off"></div>',
    footerHTML: '<button class="btn btn-ghost" data-modal-cancel>Cancel</button><button class="btn btn-primary" data-modal-submit>Create</button>',
  });
  const submit = dom.modalFooter.querySelector('[data-modal-submit]');
  const cancel = dom.modalFooter.querySelector('[data-modal-cancel]');
  const input = dom.modalBody.querySelector('#new-checklist-title');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') submit.click(); });
  submit.addEventListener('click', () => { if (input && input.value.trim()) { createChecklist(input.value); closeModal(); } });
  cancel.addEventListener('click', closeModal);
}

function handleRenameChecklist() {
  const cl = getActiveChecklist();
  if (!cl) return;
  showModal({
    title: 'Rename List',
    bodyHTML: `<div class="form-group"><label class="form-label" for="rename-checklist-title">Name</label><input type="text" class="form-input" id="rename-checklist-title" value="${escapeHtml(cl.title)}" autocomplete="off"></div>`,
    footerHTML: '<button class="btn btn-ghost" data-modal-cancel>Cancel</button><button class="btn btn-primary" data-modal-submit>Save</button>',
  });
  const submit = dom.modalFooter.querySelector('[data-modal-submit]');
  const cancel = dom.modalFooter.querySelector('[data-modal-cancel]');
  const input = dom.modalBody.querySelector('#rename-checklist-title');
  if (input) { input.select(); input.addEventListener('keydown', e => { if (e.key === 'Enter') submit.click(); }); }
  submit.addEventListener('click', () => { if (input && input.value.trim() && input.value.trim() !== cl.title) { renameChecklist(cl.id, input.value); showToast('List renamed', 'success'); } closeModal(); });
  cancel.addEventListener('click', closeModal);
}

async function handleDeleteChecklist(id) {
  const cl = state.checklists.find(c => c.id === id);
  if (!cl) return;
  const confirmed = await showConfirm(`Delete "${cl.title}" and all its tasks? This cannot be undone.`);
  if (confirmed) deleteChecklist(id);
}

async function handleDeleteTask(taskId) {
  const confirmed = await showConfirm('Delete this task? This cannot be undone.');
  if (confirmed) deleteTask(taskId);
}

function handleSettings() {
  showModal({
    title: 'Settings',
    bodyHTML: `
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Theme</div><div class="settings-row-desc">Switch between dark and light mode</div></div>
          <div class="settings-row-action">
            <button class="btn btn-secondary btn-sm" id="settings-theme-toggle">${state.theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
          </div>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Focus mode</div><div class="settings-row-desc">Distraction-free task view</div></div>
          <div class="settings-row-action">
            <button class="btn btn-secondary btn-sm" id="settings-focus-toggle">${state.focusMode ? 'Disable' : 'Enable'}</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Data</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Export tasks</div><div class="settings-row-desc">Download all data as JSON</div></div>
          <div class="settings-row-action"><button class="btn btn-secondary btn-sm" id="settings-export">Export</button></div>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Import tasks</div><div class="settings-row-desc">Restore data from a JSON file</div></div>
          <div class="settings-row-action"><button class="btn btn-secondary btn-sm" id="settings-import-btn">Import</button></div>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Clear completed</div><div class="settings-row-desc">Remove all completed tasks across all lists</div></div>
          <div class="settings-row-action"><button class="btn btn-secondary btn-sm" id="settings-clear-all">Clear all</button></div>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Reset app</div><div class="settings-row-desc">Delete all data and start fresh</div></div>
          <div class="settings-row-action"><button class="btn btn-danger btn-sm" id="settings-reset">Reset</button></div>
        </div>
      </div>
    `,
    footerHTML: '<button class="btn btn-primary" data-modal-submit>Done</button>',
  });

  $('[data-modal-submit]', dom.modalFooter).addEventListener('click', closeModal);

  $('#settings-theme-toggle', dom.modalBody)?.addEventListener('click', () => {
    toggleTheme();
    const btn = $('#settings-theme-toggle', dom.modalBody);
    if (btn) btn.textContent = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
  });

  $('#settings-focus-toggle', dom.modalBody)?.addEventListener('click', () => {
    toggleFocusMode();
    const btn = $('#settings-focus-toggle', dom.modalBody);
    if (btn) btn.textContent = state.focusMode ? 'Disable' : 'Enable';
    closeModal();
  });

  $('#settings-export', dom.modalBody)?.addEventListener('click', () => {
    const data = JSON.stringify({ theme: state.theme, checklists: state.checklists, version: 2 }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'checklist-backup.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported', 'success');
  });

  $('#settings-import-btn', dom.modalBody)?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.checklists && Array.isArray(data.checklists)) {
            state.checklists = data.checklists;
            state.activeChecklistId = state.checklists.length > 0 ? state.checklists[0].id : null;
            saveData(); render();
            showToast('Data imported', 'success');
            closeModal();
          } else { showToast('Invalid file format', 'error'); }
        } catch (err) { showToast('Failed to import', 'error'); }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  $('#settings-clear-all', dom.modalBody)?.addEventListener('click', () => {
    state.checklists.forEach(cl => { cl.tasks = cl.tasks.filter(t => !t.completed); });
    saveData(); render();
    showToast('All completed tasks cleared', 'info');
  });

  $('#settings-reset', dom.modalBody)?.addEventListener('click', async () => {
    const confirmed = await showConfirm('Delete ALL data? This cannot be undone.');
    if (confirmed) {
      localStorage.removeItem('checklist-app-v2');
      state.checklists = [];
      state.activeChecklistId = null;
      state.selectedTaskId = null;
      state.selectedTaskIds = [];
      state.streak = 0;
      state.completedHistory = [];
      state.lastActiveDate = null;
      closeDetailPanel();
      render();
      showToast('App reset', 'info');
      closeModal();
    }
  });
}

/* ============================================
   GLOBAL EVENTS
   ============================================ */
function bindGlobalEvents() {
  dom.newChecklistBtn.addEventListener('click', handleNewChecklist);
  dom.newChecklistSidebar.addEventListener('click', handleNewChecklist);
  dom.homeBtn.addEventListener('click', () => {
    state.view = 'dashboard'; state.todayMode = false; saveData(); render();
  });
  dom.fabAdd.addEventListener('click', () => {
    if (state.view === 'dashboard' && state.checklists.length > 0) {
      state.activeChecklistId = state.checklists[0].id;
      state.view = 'checklist';
      saveData(); render();
      setTimeout(() => {
        const input = dom.content.querySelector('#add-task-input');
        if (input) input.focus();
      }, 100);
    } else {
      const input = dom.content.querySelector('#add-task-input');
      if (input) input.focus();
    }
  });

  dom.menuToggle.addEventListener('click', toggleSidebar);
  dom.sidebarBackdrop.addEventListener('click', closeSidebar);

  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.settingsBtn.addEventListener('click', handleSettings);
  dom.focusToggle.addEventListener('click', toggleFocusMode);

  dom.sidebarCollapse?.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    saveData(); render();
  });

  dom.shortcutsBtn?.addEventListener('click', () => dom.shortcutsOverlay.classList.remove('hidden'));
  dom.shortcutsClose.addEventListener('click', () => dom.shortcutsOverlay.classList.add('hidden'));
  dom.shortcutsOverlay.addEventListener('click', e => { if (e.target === dom.shortcutsOverlay) dom.shortcutsOverlay.classList.add('hidden'); });

  /* Bottom nav */
  $$('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === 'quick-add') { openQuickAdd(); return; }
      if (view === 'today') {
        if (state.checklists.length > 0) {
          state.activeChecklistId = state.checklists[0].id;
          state.view = 'checklist';
          state.todayMode = true;
          state.filter = 'all';
          state.searchQuery = '';
          dom.searchInput.value = '';
          saveData(); render();
        }
        return;
      }
      if (view === 'settings') { handleSettings(); return; }
      if (view === 'inbox') {
        if (state.checklists.length > 0) {
          state.activeChecklistId = state.checklists[0].id;
          state.view = 'checklist';
          state.todayMode = false;
          state.filter = 'active';
          state.searchQuery = '';
          dom.searchInput.value = '';
          saveData(); render();
        }
        return;
      }
      state.view = view;
      saveData(); render();
    });
  });

  document.addEventListener('keydown', handleKeyboard);

  window.addEventListener('resize', () => {
    dom.fabAdd.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });
}

function toggleSidebar() {
  const isOpen = dom.sidebar.classList.toggle('open');
  dom.sidebarBackdrop.classList.toggle('hidden', !isOpen);
  dom.menuToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebar() {
  dom.sidebar.classList.remove('open');
  dom.sidebarBackdrop.classList.add('hidden');
  dom.menuToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ============================================
   SCENE — Stars & Particles
   ============================================ */
function initParallax() {
  const content = document.getElementById('content');
  if (!content) return;
  const layers = [
    { el: document.getElementById('scene-mountains-distant'), speed: 0.03 },
    { el: document.getElementById('scene-hills-mid'), speed: 0.07 },
    { el: document.getElementById('scene-hills-foreground'), speed: 0.12 },
    { el: document.getElementById('scene-trees'), speed: 0.18 },
  ].filter(l => l.el);
  let ticking = false;
  content.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = content.scrollTop;
        layers.forEach(l => { l.el.style.transform = `translateY(${sy * l.speed}px)`; });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function generateStars() {
  const starEl = document.getElementById('scene-stars');
  if (!starEl) return;
  const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 6000), 300);
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() < 0.1 ? 2 : 1;
    const opacity = 0.15 + Math.random() * 0.5;
    shadows.push(`${x}% ${y}% 0 ${size}px rgba(220, 230, 255, ${opacity})`);
  }
  const style = document.createElement('style');
  style.textContent = `#scene-stars::before { box-shadow: ${shadows.join(', ')}; }`;
  document.head.appendChild(style);
}

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;
  let W, H;

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function particleColor(o) {
    return isLight() ? `rgba(205, 200, 220, ${o})` : `rgba(200, 215, 255, ${o})`;
  }

  function glowColor(o) {
    return isLight() ? `rgba(215, 210, 235, ${o * 0.06})` : `rgba(180, 200, 255, ${o * 0.08})`;
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: H + 10 + Math.random() * 40,
      size: 1 + Math.random() * 2.5,
      speedY: -(0.15 + Math.random() * 0.35),
      speedX: (Math.random() - 0.5) * 0.15,
      opacity: 0.1 + Math.random() * 0.5,
      pulseSpeed: 0.005 + Math.random() * 0.02,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  function spawnParticles() {
    const target = Math.min(Math.floor((W * H) / 40000), 25);
    while (particles.length < target) {
      const p = createParticle();
      p.y = Math.random() * H * 0.8;
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const time = Date.now() * 0.001;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.opacity += Math.sin(time * p.pulseSpeed * 10 + p.pulsePhase) * 0.001;

      const o = Math.max(0.05, Math.min(0.6, p.opacity));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = particleColor(o);
      ctx.fill();

      if (p.size > 1.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glowColor(o);
        ctx.fill();
      }

      if (p.y < -20 || p.x < -20 || p.x > W + 20) {
        particles.splice(i, 1);
      }
    }

    if (particles.length < 20 && Math.random() < 0.3) {
      particles.push(createParticle());
    }

    animId = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
      animId = null;
    } else if (!animId) {
      draw();
    }
  });

  window.addEventListener('resize', resize);
  resize();
  spawnParticles();
  draw();
}

/* ============================================
   KEYBOARD
   ============================================ */
function handleKeyboard(e) {
  const tag = e.target.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (e.key === 'Escape' && isInput) { e.target.blur(); return; }

  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (dom.cmdOverlay.classList.contains('hidden')) openCmdPalette();
    else closeCmdPalette();
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    handleSettings();
    return;
  }

  if (e.key === '/' && !isInput && dom.quickAddOverlay.classList.contains('hidden')) {
    e.preventDefault();
    openQuickAdd();
    return;
  }

  if (isInput) return;

  switch (e.key.toLowerCase()) {
    case 'n':
      e.preventDefault();
      handleNewChecklist();
      break;
    case 'c':
      e.preventDefault();
      if (state.view === 'checklist') {
        const input = dom.content.querySelector('#add-task-input');
        if (input) input.focus();
      } else if (state.checklists.length > 0) {
        state.activeChecklistId = state.checklists[0].id;
        state.view = 'checklist';
        saveData(); render();
        setTimeout(() => {
          const input = dom.content.querySelector('#add-task-input');
          if (input) input.focus();
        }, 100);
      }
      break;
    case '?':
      e.preventDefault();
      dom.shortcutsOverlay.classList.toggle('hidden');
      break;
    case 'd':
      e.preventDefault();
      state.view = 'dashboard'; state.todayMode = false;
      saveData(); render();
      break;
    case 'f':
      e.preventDefault();
      toggleFocusMode();
      break;
    case 'x':
      e.preventDefault();
      if (state.view === 'checklist') toggleMultiSelect();
      break;
  }

  /* Tree indent/outdent with Tab when a task is selected */
  if (e.key === 'Tab' && state.selectedTaskId && state.view === 'checklist' && !isInput) {
    e.preventDefault();
    if (e.shiftKey) {
      outdentTask(state.selectedTaskId);
    } else {
      indentTask(state.selectedTaskId);
    }
  }

  /* Collapse/expand selected task with ]/[ keys */
  if (e.key === ']' && state.selectedTaskId) {
    e.preventDefault();
    toggleCollapse(state.selectedTaskId);
  }
  if (e.key === '[' && state.selectedTaskId) {
    e.preventDefault();
    const cl = getActiveChecklist();
    if (cl) {
      const task = findTask(cl.tasks, state.selectedTaskId);
      if (task) { task.collapsed = false; saveData(); render(); }
    }
  }
}

/* ============================================
   DATA MIGRATION
   ============================================ */
function migrateData() {
  state.checklists.forEach(cl => {
    function migrate(tasks) {
      tasks.forEach(t => {
        if (!t.children) t.children = [];
        if (t.collapsed === undefined) t.collapsed = false;
        if (t.children.length > 0) migrate(t.children);
      });
    }
    migrate(cl.tasks);
  });
}

/* ============================================
   INIT
   ============================================ */
function init() {
  const loaded = loadData();
  migrateData();
  applyTheme();
  bindGlobalEvents();
  render();
  updateStreak();
  generateStars();
  initParallax();
  setTimeout(initParticles, 100);

  if (!loaded || state.checklists.length === 0) {
    createChecklist('Getting Started');
    const cl = getActiveChecklist();
    if (cl) {
      const samples = [
        { text: 'Welcome to Checklist!', priority: 'medium', category: 'work' },
        { text: 'Press Tab/Shift+Tab to indent/outdent tasks', priority: 'low', category: '' },
        { text: 'Click + on a task to add subtasks', priority: 'high', category: 'urgent' },
        { text: 'Use [ / ] to collapse/expand subtrees', priority: 'low', category: '' },
      ];
      samples.forEach((t, i) => {
        cl.tasks.push({
          id: uid(), text: t.text, description: '', completed: false,
          priority: t.priority, dueDate: null, category: t.category,
          order: i, createdAt: new Date().toISOString(),
          children: [], collapsed: false,
        });
      });
      saveData(); render();
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
