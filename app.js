/**
 * TaskFlow Pro — Modern Interactive Task Manager with LocalStorage
 * Core JavaScript: State Management, DOM Manipulation, Event Handling,
 * LocalStorage Persistence, Drag & Drop, Sound Synthesizer, and Particle Confetti.
 */

'use strict';

/* ==========================================================================
   1. State Management & Constants
   ========================================================================== */
const STORAGE_KEYS = {
  TASKS: 'taskflow_pro_tasks_v1',
  THEME: 'taskflow_pro_theme_v1',
  SOUND: 'taskflow_pro_sound_v1'
};

const PRIORITY_RANKS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

// Application State
const state = {
  tasks: [],
  activeFilter: 'all',          // 'all' | 'active' | 'completed' | 'starred' | 'overdue'
  categoryFilter: 'all',        // 'all' | 'General' | 'Work' | 'Personal' | ...
  priorityFilter: 'all',        // 'all' | 'urgent' | 'high' | 'medium' | 'low'
  searchQuery: '',
  sortBy: 'custom',             // 'custom' | 'date-desc' | 'date-asc' | 'due-date' | 'priority-desc' | 'alpha-asc'
  soundEnabled: true,
  theme: 'dark',
  lastDeletedTask: null,        // For Toast "Undo" functionality: { task, index }
  draggedTaskId: null
};

// Initial Sample Data for First-Time Users
const SAMPLE_TASKS = [
  {
    id: 'sample-1',
    text: '🚀 Explore TaskFlow Pro features & keyboard shortcuts (Press ?)',
    completed: false,
    priority: 'high',
    category: 'General',
    dueDate: getFormattedDateOffset(0), // Today
    starred: true,
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'sample-2',
    text: '💻 Review LocalStorage persistence by refreshing this page',
    completed: false,
    priority: 'urgent',
    category: 'Coding',
    dueDate: getFormattedDateOffset(1), // Tomorrow
    starred: true,
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'sample-3',
    text: '🌿 Reorder tasks using the drag handle on the left',
    completed: false,
    priority: 'medium',
    category: 'Personal',
    dueDate: getFormattedDateOffset(2),
    starred: false,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'sample-4',
    text: '✨ Double-click any task text to edit it inline',
    completed: true,
    priority: 'low',
    category: 'Work',
    dueDate: getFormattedDateOffset(-1), // Yesterday
    starred: false,
    createdAt: Date.now() - 3600000 * 1
  }
];

/* ==========================================================================
   2. DOM Element Selectors
   ========================================================================== */
const DOM = {
  // Theme & Sound & Clock
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  soundOnIcon: document.querySelector('.sound-on-icon'),
  soundOffIcon: document.querySelector('.sound-off-icon'),
  clockTime: document.getElementById('clockTime'),
  clockDate: document.getElementById('clockDate'),
  storageStatusBadge: document.getElementById('storageStatusBadge'),
  storageSizeInfo: document.getElementById('storageSizeInfo'),

  // Stats
  progressRingFill: document.getElementById('progressRingFill'),
  progressPercent: document.getElementById('progressPercent'),
  progressMessage: document.getElementById('progressMessage'),
  totalTasksCount: document.getElementById('totalTasksCount'),
  activeTasksCount: document.getElementById('activeTasksCount'),
  completedTasksCount: document.getElementById('completedTasksCount'),
  overdueTasksCount: document.getElementById('overdueTasksCount'),
  statCards: document.querySelectorAll('.stat-card'),

  // Form Controls
  taskForm: document.getElementById('taskForm'),
  taskInput: document.getElementById('taskInput'),
  clearInputBtn: document.getElementById('clearInputBtn'),
  prioritySelect: document.getElementById('prioritySelect'),
  categorySelect: document.getElementById('categorySelect'),
  dueDateInput: document.getElementById('dueDateInput'),
  quickDateChips: document.querySelectorAll('.quick-date-chip'),

  // Search & Filters
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  countAll: document.getElementById('countAll'),
  countActive: document.getElementById('countActive'),
  countCompleted: document.getElementById('countCompleted'),
  countStarred: document.getElementById('countStarred'),
  countOverdue: document.getElementById('countOverdue'),
  categoryFilter: document.getElementById('categoryFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  sortBy: document.getElementById('sortBy'),

  // Bulk Actions & Popover
  markAllCompleteBtn: document.getElementById('markAllCompleteBtn'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  moreActionsBtn: document.getElementById('moreActionsBtn'),
  moreActionsMenu: document.getElementById('moreActionsMenu'),
  exportDataBtn: document.getElementById('exportDataBtn'),
  importFileInput: document.getElementById('importFileInput'),
  loadSampleDataBtn: document.getElementById('loadSampleDataBtn'),
  resetAllDataBtn: document.getElementById('resetAllDataBtn'),

  // Task List & Empty State
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDesc: document.getElementById('emptyDesc'),
  emptyActionBtn: document.getElementById('emptyActionBtn'),

  // Modals & Toast
  helpBtn: document.getElementById('helpBtn'),
  helpModal: document.getElementById('helpModal'),
  closeHelpModalBtn: document.getElementById('closeHelpModalBtn'),
  gotItBtn: document.getElementById('gotItBtn'),
  confirmModal: document.getElementById('confirmModal'),
  confirmModalTitle: document.getElementById('confirmModalTitle'),
  confirmModalMsg: document.getElementById('confirmModalMsg'),
  closeConfirmModalBtn: document.getElementById('closeConfirmModalBtn'),
  cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
  acceptConfirmBtn: document.getElementById('acceptConfirmBtn'),
  toastContainer: document.getElementById('toastContainer'),
  confettiCanvas: document.getElementById('confettiCanvas')
};

/* ==========================================================================
   3. Web Audio API Synthesizer (Zero External Dependencies)
   ========================================================================== */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const SoundEffects = {
  pop() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) { /* ignore audio errors */ }
  },

  complete() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Chime note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Chime note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch (e) { /* ignore audio errors */ }
  },

  delete() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) { /* ignore audio errors */ }
  },

  celebrate() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (e) { /* ignore audio errors */ }
  }
};

/* ==========================================================================
   4. LocalStorage Helper Functions
   ========================================================================== */

/**
 * Loads tasks from LocalStorage or injects default sample data on first run
 */
function loadTasksFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        state.tasks = parsed;
        return;
      }
    }
    // First visit fallback
    state.tasks = [...SAMPLE_TASKS];
    saveTasksToStorage();
  } catch (error) {
    console.error('Error loading tasks from LocalStorage:', error);
    state.tasks = [...SAMPLE_TASKS];
  }
}

/**
 * Persists current state.tasks array to LocalStorage & updates storage metrics
 */
function saveTasksToStorage() {
  try {
    const serialized = JSON.stringify(state.tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, serialized);
    updateStorageSizeDisplay(serialized);
    flashStorageBadge();
  } catch (error) {
    console.error('Error saving tasks to LocalStorage:', error);
    showToast('Failed to save data: LocalStorage quota exceeded', 'error');
  }
}

/**
 * Computes rough size of data stored in LocalStorage
 */
function updateStorageSizeDisplay(serializedString) {
  if (!DOM.storageSizeInfo) return;
  const str = serializedString || localStorage.getItem(STORAGE_KEYS.TASKS) || '[]';
  const bytes = new Blob([str]).size;
  const kb = (bytes / 1024).toFixed(2);
  DOM.storageSizeInfo.textContent = `LocalStorage: ${kb} KB used (${state.tasks.length} tasks)`;
}

function flashStorageBadge() {
  if (!DOM.storageStatusBadge) return;
  DOM.storageStatusBadge.style.transform = 'scale(1.08)';
  DOM.storageStatusBadge.style.borderColor = 'var(--accent-emerald)';
  setTimeout(() => {
    DOM.storageStatusBadge.style.transform = 'scale(1)';
  }, 250);
}

/* ==========================================================================
   5. Task CRUD Operations & State Logic
   ========================================================================== */

/**
 * Adds a new task to the list
 */
function addTask(text, priority = 'medium', category = 'General', dueDate = null) {
  const trimmed = text.trim();
  if (!trimmed) {
    triggerInputShake();
    return;
  }

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    text: trimmed,
    completed: false,
    priority: priority || 'medium',
    category: category || 'General',
    dueDate: dueDate || null,
    starred: false,
    createdAt: Date.now()
  };

  state.tasks.unshift(newTask);
  saveTasksToStorage();
  renderTasks();
  updateStats();
  SoundEffects.pop();

  showToast(`Task added: "${truncateString(newTask.text, 25)}"`, 'success');
}

/**
 * Toggles a task's completion status
 */
function toggleTaskCompletion(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  renderTasks();
  updateStats();

  if (task.completed) {
    SoundEffects.complete();
    // If all tasks are completed, celebrate!
    const activeRemaining = state.tasks.filter(t => !t.completed).length;
    if (state.tasks.length > 0 && activeRemaining === 0) {
      triggerConfetti();
      SoundEffects.celebrate();
      showToast('🎉 All tasks completed! Great job!', 'success');
    }
  } else {
    SoundEffects.pop();
  }
}

/**
 * Toggles a task's starred / pinned status
 */
function toggleTaskStarred(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.starred = !task.starred;
  saveTasksToStorage();
  renderTasks();
  updateStats();
  SoundEffects.pop();
  showToast(task.starred ? 'Starred task ⭐' : 'Unstarred task', 'info');
}

/**
 * Updates a task's text content (inline edit)
 */
function updateTaskText(taskId, newText) {
  const trimmed = newText.trim();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!trimmed) {
    // If emptied, prompt to delete
    deleteTask(taskId);
    return;
  }

  if (task.text !== trimmed) {
    task.text = trimmed;
    saveTasksToStorage();
    renderTasks();
    SoundEffects.pop();
    showToast('Task updated', 'success');
  } else {
    renderTasks();
  }
}

/**
 * Deletes a task by ID with Undo support
 */
function deleteTask(taskId) {
  const index = state.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const [removedTask] = state.tasks.splice(index, 1);
  state.lastDeletedTask = { task: removedTask, index: index };

  saveTasksToStorage();
  renderTasks();
  updateStats();
  SoundEffects.delete();

  showToast(
    `Deleted "${truncateString(removedTask.text, 22)}"`,
    'warning',
    {
      actionText: 'Undo',
      onAction: () => {
        if (state.lastDeletedTask) {
          state.tasks.splice(state.lastDeletedTask.index, 0, state.lastDeletedTask.task);
          state.lastDeletedTask = null;
          saveTasksToStorage();
          renderTasks();
          updateStats();
          SoundEffects.pop();
          showToast('Task restored', 'success');
        }
      }
    }
  );
}

/**
 * Marks all tasks completed or active
 */
function toggleMarkAll() {
  if (state.tasks.length === 0) return;
  const hasIncomplete = state.tasks.some(t => !t.completed);
  state.tasks.forEach(t => {
    t.completed = hasIncomplete;
  });

  saveTasksToStorage();
  renderTasks();
  updateStats();

  if (hasIncomplete) {
    triggerConfetti();
    SoundEffects.celebrate();
    showToast('All tasks marked complete!', 'success');
  } else {
    SoundEffects.pop();
    showToast('All tasks marked active', 'info');
  }
}

/**
 * Clears all completed tasks with confirm dialog
 */
function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear', 'info');
    return;
  }

  openConfirmModal(
    'Clear Completed Tasks',
    `Are you sure you want to permanently delete ${completedCount} completed task(s)?`,
    () => {
      state.tasks = state.tasks.filter(t => !t.completed);
      saveTasksToStorage();
      renderTasks();
      updateStats();
      SoundEffects.delete();
      showToast(`Cleared ${completedCount} completed tasks`, 'success');
    }
  );
}

/**
 * Completely resets LocalStorage
 */
function resetAllData() {
  openConfirmModal(
    'Wipe All Tasks & Data',
    'Are you sure you want to completely erase all tasks from LocalStorage? This cannot be undone.',
    () => {
      state.tasks = [];
      saveTasksToStorage();
      renderTasks();
      updateStats();
      SoundEffects.delete();
      showToast('All data erased from LocalStorage', 'warning');
    }
  );
}

/**
 * Restores sample tasks
 */
function loadSampleTasks() {
  state.tasks = [...SAMPLE_TASKS];
  saveTasksToStorage();
  renderTasks();
  updateStats();
  SoundEffects.pop();
  showToast('Sample tasks loaded', 'success');
}

/**
 * Exports tasks as JSON download
 */
function exportTasksJSON() {
  if (state.tasks.length === 0) {
    showToast('No tasks to export', 'info');
    return;
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `taskflow_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Tasks exported to JSON file', 'success');
}

/**
 * Imports tasks from JSON file
 */
function importTasksJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        // Validate items
        const validTasks = imported.map((item, idx) => ({
          id: item.id || 'imported_' + Date.now() + '_' + idx,
          text: String(item.text || 'Untitled Task'),
          completed: Boolean(item.completed),
          priority: ['urgent', 'high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
          category: String(item.category || 'General'),
          dueDate: item.dueDate || null,
          starred: Boolean(item.starred),
          createdAt: item.createdAt || Date.now()
        }));

        state.tasks = validTasks;
        saveTasksToStorage();
        renderTasks();
        updateStats();
        SoundEffects.celebrate();
        showToast(`Successfully imported ${validTasks.length} tasks!`, 'success');
      } else {
        showToast('Invalid JSON file format (must be an array of tasks)', 'error');
      }
    } catch (err) {
      showToast('Failed to parse JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

/* ==========================================================================
   6. Filtering, Sorting & Rendering Logic
   ========================================================================== */

/**
 * Checks if a due date is overdue
 */
function isOverdue(dueDateStr, completed) {
  if (!dueDateStr || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Checks if a due date is today
 */
function isDueToday(dueDateStr) {
  if (!dueDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

/**
 * Filters and sorts tasks based on active state parameters
 */
function getFilteredAndSortedTasks() {
  let result = [...state.tasks];

  // 1. Status Filter
  if (state.activeFilter === 'active') {
    result = result.filter(t => !t.completed);
  } else if (state.activeFilter === 'completed') {
    result = result.filter(t => t.completed);
  } else if (state.activeFilter === 'starred') {
    result = result.filter(t => t.starred);
  } else if (state.activeFilter === 'overdue') {
    result = result.filter(t => isOverdue(t.dueDate, t.completed));
  }

  // 2. Category Filter
  if (state.categoryFilter !== 'all') {
    result = result.filter(t => t.category === state.categoryFilter);
  }

  // 3. Priority Filter
  if (state.priorityFilter !== 'all') {
    result = result.filter(t => t.priority === state.priorityFilter);
  }

  // 4. Search Query Filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(t => 
      t.text.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q)
    );
  }

  // 5. Sorting
  if (state.sortBy === 'date-desc') {
    result.sort((a, b) => b.createdAt - a.createdAt);
  } else if (state.sortBy === 'date-asc') {
    result.sort((a, b) => a.createdAt - b.createdAt);
  } else if (state.sortBy === 'due-date') {
    result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (state.sortBy === 'priority-desc') {
    result.sort((a, b) => (PRIORITY_RANKS[b.priority] || 0) - (PRIORITY_RANKS[a.priority] || 0));
  } else if (state.sortBy === 'alpha-asc') {
    result.sort((a, b) => a.text.localeCompare(b.text));
  }

  return result;
}

/**
 * Main DOM Render Function: renders the task list dynamically
 */
function renderTasks() {
  const filteredTasks = getFilteredAndSortedTasks();
  DOM.taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    DOM.taskList.classList.add('hidden');
    DOM.emptyState.classList.remove('hidden');
    updateEmptyStateMessage();
    return;
  }

  DOM.taskList.classList.remove('hidden');
  DOM.emptyState.classList.add('hidden');

  filteredTasks.forEach(task => {
    const li = createTaskElement(task);
    DOM.taskList.appendChild(li);
  });
}

/**
 * Constructs a single Task DOM item with all metadata and event hooks
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.taskId = task.id;
  li.draggable = state.sortBy === 'custom'; // only allow dragging in custom sort

  // Due date tag formatting
  let dueBadgeHtml = '';
  if (task.dueDate) {
    const overdue = isOverdue(task.dueDate, task.completed);
    const today = isDueToday(task.dueDate);
    const badgeClass = overdue ? 'due-overdue' : (today ? 'due-today' : '');
    const prefix = overdue ? '⚠️ Overdue: ' : (today ? '⚡ Today: ' : '📅 Due: ');
    dueBadgeHtml = `<span class="badge badge-due ${badgeClass}" title="Due date">${prefix}${formatDisplayDate(task.dueDate)}</span>`;
  }

  // Priority badge config
  const priorityLabels = {
    urgent: '🔴 Urgent',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low'
  };

  li.innerHTML = `
    <div class="drag-handle" title="Drag to reorder" aria-label="Drag handle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="5" r="1.5"></circle>
        <circle cx="15" cy="5" r="1.5"></circle>
        <circle cx="9" cy="12" r="1.5"></circle>
        <circle cx="15" cy="12" r="1.5"></circle>
        <circle cx="9" cy="19" r="1.5"></circle>
        <circle cx="15" cy="19" r="1.5"></circle>
      </svg>
    </div>

    <label class="checkbox-container" title="${task.completed ? 'Mark as active' : 'Mark as completed'}">
      <div class="custom-checkbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </label>

    <div class="task-content">
      <div class="task-title-wrapper">
        <span class="task-text" title="Double click to edit">${escapeHtml(task.text)}</span>
      </div>
      <div class="task-meta">
        <span class="badge badge-priority ${task.priority}">${priorityLabels[task.priority] || task.priority}</span>
        <span class="badge badge-category">📂 ${escapeHtml(task.category)}</span>
        ${dueBadgeHtml}
      </div>
    </div>

    <div class="task-actions">
      <button class="task-action-btn star-btn ${task.starred ? 'starred' : ''}" title="${task.starred ? 'Unstar task' : 'Star task'}" aria-label="Star task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>

      <button class="task-action-btn edit-btn" title="Edit task text" aria-label="Edit task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      <button class="task-action-btn delete-btn" title="Delete task" aria-label="Delete task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Attach drag & drop events to list item
  setupDragAndDropItem(li);

  return li;
}

/**
 * Updates dynamic empty state title & description based on current active filter
 */
function updateEmptyStateMessage() {
  if (state.searchQuery.trim()) {
    DOM.emptyTitle.textContent = 'No matching tasks';
    DOM.emptyDesc.textContent = `No tasks found matching "${state.searchQuery}". Try clearing your search.`;
    DOM.emptyActionBtn.textContent = 'Clear Search';
    DOM.emptyActionBtn.onclick = () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      DOM.clearSearchBtn.classList.add('hidden');
      renderTasks();
    };
  } else if (state.activeFilter === 'completed') {
    DOM.emptyTitle.textContent = 'No completed tasks yet';
    DOM.emptyDesc.textContent = 'Keep working! When you check off tasks, they will appear here.';
    DOM.emptyActionBtn.textContent = 'View Active Tasks';
    DOM.emptyActionBtn.onclick = () => setFilter('active');
  } else if (state.activeFilter === 'active') {
    DOM.emptyTitle.textContent = 'All caught up!';
    DOM.emptyDesc.textContent = 'You have no active pending tasks right now. Relax or add a new goal!';
    DOM.emptyActionBtn.textContent = 'Add New Task';
    DOM.emptyActionBtn.onclick = () => DOM.taskInput.focus();
  } else if (state.activeFilter === 'starred') {
    DOM.emptyTitle.textContent = 'No starred tasks';
    DOM.emptyDesc.textContent = 'Star your most important tasks to keep them highlighted and accessible.';
    DOM.emptyActionBtn.textContent = 'View All Tasks';
    DOM.emptyActionBtn.onclick = () => setFilter('all');
  } else if (state.activeFilter === 'overdue') {
    DOM.emptyTitle.textContent = 'No overdue tasks!';
    DOM.emptyDesc.textContent = 'Awesome! You are right on schedule with all your deadlines.';
    DOM.emptyActionBtn.textContent = 'View All Tasks';
    DOM.emptyActionBtn.onclick = () => setFilter('all');
  } else {
    DOM.emptyTitle.textContent = 'Your task list is empty';
    DOM.emptyDesc.textContent = 'Organize your day, boost productivity, and stay on track with TaskFlow Pro.';
    DOM.emptyActionBtn.textContent = 'Add Your First Task';
    DOM.emptyActionBtn.onclick = () => DOM.taskInput.focus();
  }
}

/**
 * Updates Statistics Counter Badges, Progress Ring, and Motivational Message
 */
function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const active = total - completed;
  const starred = state.tasks.filter(t => t.starred).length;
  const overdue = state.tasks.filter(t => isOverdue(t.dueDate, t.completed)).length;

  // Number counters
  DOM.totalTasksCount.textContent = total;
  DOM.activeTasksCount.textContent = active;
  DOM.completedTasksCount.textContent = completed;
  DOM.overdueTasksCount.textContent = overdue;

  // Tab count pills
  DOM.countAll.textContent = total;
  DOM.countActive.textContent = active;
  DOM.countCompleted.textContent = completed;
  DOM.countStarred.textContent = starred;
  DOM.countOverdue.textContent = overdue;

  // Progress calculation
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  DOM.progressPercent.textContent = `${percentage}%`;

  // SVG Ring calculation: circumference = 2 * PI * 28 = 175.929
  const circumference = 175.929;
  const offset = circumference - (percentage / 100) * circumference;
  DOM.progressRingFill.style.strokeDashoffset = offset;

  // Dynamic Motivational Status
  if (total === 0) {
    DOM.progressMessage.textContent = 'Ready to be productive!';
    DOM.progressRingFill.style.stroke = 'var(--primary-color)';
  } else if (percentage === 100) {
    DOM.progressMessage.textContent = '🎯 Everything done! Amazing!';
    DOM.progressRingFill.style.stroke = 'var(--accent-emerald)';
  } else if (percentage >= 70) {
    DOM.progressMessage.textContent = '🔥 Almost there! Keep pushing!';
    DOM.progressRingFill.style.stroke = 'var(--accent-cyan)';
  } else if (percentage >= 35) {
    DOM.progressMessage.textContent = '⚡ Making steady progress!';
    DOM.progressRingFill.style.stroke = 'var(--accent-amber)';
  } else {
    DOM.progressMessage.textContent = `${active} tasks left for today`;
    DOM.progressRingFill.style.stroke = 'var(--primary-color)';
  }
}

/* ==========================================================================
   7. Inline Editing & Task Action Event Handling (Delegation)
   ========================================================================== */

/**
 * Enables inline editing on a task item
 */
function startInlineEditing(taskItem) {
  const taskId = taskItem.dataset.taskId;
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const titleWrapper = taskItem.querySelector('.task-title-wrapper');
  const currentText = task.text;

  // Replace text with input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = currentText;
  input.maxLength = 150;

  titleWrapper.innerHTML = '';
  titleWrapper.appendChild(input);
  input.focus();
  input.select();

  let isSaved = false;

  function saveEdit() {
    if (isSaved) return;
    isSaved = true;
    updateTaskText(taskId, input.value);
  }

  function cancelEdit() {
    if (isSaved) return;
    isSaved = true;
    renderTasks();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });

  input.addEventListener('blur', () => {
    saveEdit();
  });
}

/**
 * Event Delegation for Task List clicks
 */
DOM.taskList.addEventListener('click', (e) => {
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.dataset.taskId;

  // 1. Checkbox toggle
  if (e.target.closest('.checkbox-container')) {
    e.preventDefault();
    toggleTaskCompletion(taskId);
    return;
  }

  // 2. Star button toggle
  if (e.target.closest('.star-btn')) {
    e.preventDefault();
    toggleTaskStarred(taskId);
    return;
  }

  // 3. Edit button
  if (e.target.closest('.edit-btn')) {
    e.preventDefault();
    startInlineEditing(taskItem);
    return;
  }

  // 4. Delete button
  if (e.target.closest('.delete-btn')) {
    e.preventDefault();
    deleteTask(taskId);
    return;
  }
});

// Double click on task text to edit
DOM.taskList.addEventListener('dblclick', (e) => {
  const taskItem = e.target.closest('.task-item');
  if (taskItem && e.target.closest('.task-text')) {
    startInlineEditing(taskItem);
  }
});

/* ==========================================================================
   8. Drag and Drop Reordering (HTML5 API)
   ========================================================================== */

function setupDragAndDropItem(item) {
  item.addEventListener('dragstart', (e) => {
    state.draggedTaskId = item.dataset.taskId;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.taskId);
  });

  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
    state.draggedTaskId = null;
  });

  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (state.draggedTaskId && item.dataset.taskId !== state.draggedTaskId) {
      item.classList.add('drag-over');
    }
  });

  item.addEventListener('dragleave', () => {
    item.classList.remove('drag-over');
  });

  item.addEventListener('drop', (e) => {
    e.preventDefault();
    item.classList.remove('drag-over');

    const sourceId = state.draggedTaskId || e.dataTransfer.getData('text/plain');
    const targetId = item.dataset.taskId;

    if (!sourceId || !targetId || sourceId === targetId) return;

    const sourceIdx = state.tasks.findIndex(t => t.id === sourceId);
    const targetIdx = state.tasks.findIndex(t => t.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      // Reorder array
      const [movedItem] = state.tasks.splice(sourceIdx, 1);
      state.tasks.splice(targetIdx, 0, movedItem);

      saveTasksToStorage();
      renderTasks();
      SoundEffects.pop();
    }
  });
}

/* ==========================================================================
   9. Form Handling & Event Listeners
   ========================================================================== */

DOM.taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleFormSubmit();
});

function handleFormSubmit() {
  const text = DOM.taskInput.value;
  const priority = DOM.prioritySelect.value;
  const category = DOM.categorySelect.value;
  const dueDate = DOM.dueDateInput.value;

  if (!text.trim()) {
    triggerInputShake();
    return;
  }

  addTask(text, priority, category, dueDate);

  // Reset form inputs
  DOM.taskInput.value = '';
  DOM.dueDateInput.value = '';
  DOM.clearInputBtn.classList.add('hidden');
  DOM.taskInput.focus();
}

DOM.taskInput.addEventListener('input', () => {
  if (DOM.taskInput.value.trim().length > 0) {
    DOM.clearInputBtn.classList.remove('hidden');
  } else {
    DOM.clearInputBtn.classList.add('hidden');
  }
});

DOM.clearInputBtn.addEventListener('click', () => {
  DOM.taskInput.value = '';
  DOM.clearInputBtn.classList.add('hidden');
  DOM.taskInput.focus();
});

function triggerInputShake() {
  DOM.taskInput.classList.remove('shake-error');
  // force reflow
  void DOM.taskInput.offsetWidth;
  DOM.taskInput.classList.add('shake-error');
  DOM.taskInput.focus();
  SoundEffects.delete();
}

// Quick date chips
DOM.quickDateChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const quickType = chip.dataset.quick;
    let offset = 0;
    if (quickType === 'today') offset = 0;
    else if (quickType === 'tomorrow') offset = 1;
    else if (quickType === 'weekend') {
      const now = new Date();
      const day = now.getDay();
      offset = day === 6 ? 1 : (6 - day); // days until Saturday
    }
    DOM.dueDateInput.value = getFormattedDateOffset(offset);
    SoundEffects.pop();
  });
});

/* ==========================================================================
   10. Search & Filter Handlers
   ========================================================================== */

function setFilter(filterName) {
  state.activeFilter = filterName;
  DOM.filterTabs.forEach(tab => {
    if (tab.dataset.filter === filterName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  DOM.statCards.forEach(card => {
    if (card.dataset.filter === filterName) {
      card.classList.add('active-filter');
    } else {
      card.classList.remove('active-filter');
    }
  });

  renderTasks();
}

DOM.filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setFilter(tab.dataset.filter);
    SoundEffects.pop();
  });
});

DOM.statCards.forEach(card => {
  card.addEventListener('click', () => {
    setFilter(card.dataset.filter);
    SoundEffects.pop();
  });
});

DOM.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  if (state.searchQuery) {
    DOM.clearSearchBtn.classList.remove('hidden');
  } else {
    DOM.clearSearchBtn.classList.add('hidden');
  }
  renderTasks();
});

DOM.clearSearchBtn.addEventListener('click', () => {
  DOM.searchInput.value = '';
  state.searchQuery = '';
  DOM.clearSearchBtn.classList.add('hidden');
  renderTasks();
  DOM.searchInput.focus();
});

DOM.categoryFilter.addEventListener('change', (e) => {
  state.categoryFilter = e.target.value;
  renderTasks();
});

DOM.priorityFilter.addEventListener('change', (e) => {
  state.priorityFilter = e.target.value;
  renderTasks();
});

DOM.sortBy.addEventListener('change', (e) => {
  state.sortBy = e.target.value;
  renderTasks();
});

// Bulk actions
DOM.markAllCompleteBtn.addEventListener('click', toggleMarkAll);
DOM.clearCompletedBtn.addEventListener('click', clearCompletedTasks);

// Popover Menu Toggle
DOM.moreActionsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = DOM.moreActionsMenu.classList.contains('hidden');
  DOM.moreActionsMenu.classList.toggle('hidden', !isHidden);
  DOM.moreActionsBtn.setAttribute('aria-expanded', String(isHidden));
});

document.addEventListener('click', (e) => {
  if (!DOM.moreActionsMenu.contains(e.target) && e.target !== DOM.moreActionsBtn) {
    DOM.moreActionsMenu.classList.add('hidden');
    DOM.moreActionsBtn.setAttribute('aria-expanded', 'false');
  }
});

DOM.exportDataBtn.addEventListener('click', () => {
  DOM.moreActionsMenu.classList.add('hidden');
  exportTasksJSON();
});

DOM.importFileInput.addEventListener('change', (e) => {
  DOM.moreActionsMenu.classList.add('hidden');
  const file = e.target.files[0];
  if (file) {
    importTasksJSON(file);
    DOM.importFileInput.value = '';
  }
});

DOM.loadSampleDataBtn.addEventListener('click', () => {
  DOM.moreActionsMenu.classList.add('hidden');
  loadSampleTasks();
});

DOM.resetAllDataBtn.addEventListener('click', () => {
  DOM.moreActionsMenu.classList.add('hidden');
  resetAllData();
});

/* ==========================================================================
   11. Theme & Sound Controls
   ========================================================================== */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

DOM.themeToggleBtn.addEventListener('click', () => {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  SoundEffects.pop();
});

function applySound(enabled) {
  state.soundEnabled = enabled;
  localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
  DOM.soundOnIcon.classList.toggle('hidden', !enabled);
  DOM.soundOffIcon.classList.toggle('hidden', enabled);
}

DOM.soundToggleBtn.addEventListener('click', () => {
  applySound(!state.soundEnabled);
  if (state.soundEnabled) SoundEffects.pop();
  showToast(state.soundEnabled ? 'Sound enabled 🔊' : 'Sound muted 🔇', 'info');
});

/* ==========================================================================
   12. Live Clock & Calendar Widget
   ========================================================================== */

function updateLiveClock() {
  const now = new Date();
  
  // Format Time: 12:45:09 PM
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Format Date: Sun, Sep 28
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  if (DOM.clockTime) DOM.clockTime.textContent = timeStr;
  if (DOM.clockDate) DOM.clockDate.textContent = dateStr;
}

setInterval(updateLiveClock, 1000);
updateLiveClock();

/* ==========================================================================
   13. Toast Notification Engine
   ========================================================================== */

function showToast(message, type = 'info', action = null) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const body = document.createElement('div');
  body.className = 'toast-body';
  body.innerHTML = `<span>${escapeHtml(message)}</span>`;
  toast.appendChild(body);

  if (action && action.actionText && typeof action.onAction === 'function') {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast-undo-btn';
    actionBtn.textContent = action.actionText;
    actionBtn.addEventListener('click', () => {
      action.onAction();
      toast.remove();
    });
    toast.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '✕';
  closeBtn.addEventListener('click', () => toast.remove());
  toast.appendChild(closeBtn);

  DOM.toastContainer.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%) scale(0.9)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* ==========================================================================
   14. Modals (Shortcuts & Confirmation)
   ========================================================================== */

function openHelpModal() {
  DOM.helpModal.classList.remove('hidden');
}

function closeHelpModal() {
  DOM.helpModal.classList.add('hidden');
}

DOM.helpBtn.addEventListener('click', openHelpModal);
DOM.closeHelpModalBtn.addEventListener('click', closeHelpModal);
DOM.gotItBtn.addEventListener('click', closeHelpModal);

DOM.helpModal.addEventListener('click', (e) => {
  if (e.target === DOM.helpModal) closeHelpModal();
});

let confirmCallback = null;

function openConfirmModal(title, message, onConfirm) {
  DOM.confirmModalTitle.textContent = title;
  DOM.confirmModalMsg.textContent = message;
  confirmCallback = onConfirm;
  DOM.confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
  DOM.confirmModal.classList.add('hidden');
  confirmCallback = null;
}

DOM.closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
DOM.cancelConfirmBtn.addEventListener('click', closeConfirmModal);

DOM.acceptConfirmBtn.addEventListener('click', () => {
  if (typeof confirmCallback === 'function') {
    confirmCallback();
  }
  closeConfirmModal();
});

DOM.confirmModal.addEventListener('click', (e) => {
  if (e.target === DOM.confirmModal) closeConfirmModal();
});

/* ==========================================================================
   15. Global Keyboard Shortcuts
   ========================================================================== */

document.addEventListener('keydown', (e) => {
  // If typing in an input or textarea (unless search shortcut is pressed)
  const isInputActive = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);

  if (e.key === '?' && !isInputActive) {
    e.preventDefault();
    openHelpModal();
  } else if (e.key === '/' && !isInputActive) {
    e.preventDefault();
    DOM.searchInput.focus();
  } else if ((e.key === 'n' || e.key === 'N') && !isInputActive) {
    e.preventDefault();
    DOM.taskInput.focus();
  } else if (e.key === 'Escape') {
    closeHelpModal();
    closeConfirmModal();
    DOM.moreActionsMenu.classList.add('hidden');
    if (document.activeElement === DOM.searchInput) {
      DOM.searchInput.blur();
    }
  }
});

/* ==========================================================================
   16. Particle Confetti Celebration Effect
   ========================================================================== */

function triggerConfetti() {
  const canvas = DOM.confettiCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1,
      gravity: 0.35
    });
  }

  let animationFrameId;

  function renderConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  renderConfetti();
}

window.addEventListener('resize', () => {
  if (DOM.confettiCanvas) {
    DOM.confettiCanvas.width = window.innerWidth;
    DOM.confettiCanvas.height = window.innerHeight;
  }
});

/* ==========================================================================
   17. Utility Helper Functions
   ========================================================================== */

function getFormattedDateOffset(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncateString(str, num = 30) {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   18. Application Initialization
   ========================================================================== */

function initApp() {
  // Load saved theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  applyTheme(savedTheme);

  // Load saved sound preference
  const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
  applySound(savedSound === null ? true : savedSound === 'true');

  // Load and render tasks
  loadTasksFromStorage();
  renderTasks();
  updateStats();
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
