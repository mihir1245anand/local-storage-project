/**
 * ==========================================================================
 * Interactive To-Do List Application
 * ==========================================================================
 * Core Concepts Demonstrated:
 * 1. STATE MANAGEMENT: Single source of truth (`tasks` array) driving UI rendering.
 * 2. DOM MANIPULATION: Safe creation and updating of DOM elements without XSS risks.
 * 3. EVENT HANDLING & DELEGATION: Centralized event listening for performance.
 * 4. LOCALSTORAGE PERSISTENCE: Data serialization and resilient parsing with try/catch.
 * ==========================================================================
 */

'use strict';

/* ==========================================================================
   1. Application State & Constants
   ========================================================================== */

/**
 * Storage key used to identify task data in the browser's localStorage.
 */
const STORAGE_KEY = 'todo_tasks_data';

/**
 * Single source of truth: Array holding all task objects.
 * Each task object shape: { id: number, text: string, completed: boolean }
 */
let tasks = [];

/**
 * Active filter state: 'all' | 'active' | 'completed'
 */
let currentFilter = 'all';

/* ==========================================================================
   2. DOM Element References
   ========================================================================== */
const todoForm = document.getElementById('todoForm');
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');
const emptyState = document.getElementById('emptyState');
const emptyHeading = document.getElementById('emptyHeading');
const emptyText = document.getElementById('emptyText');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

/* ==========================================================================
   3. LocalStorage Persistence Functions
   ========================================================================== */

/**
 * Saves the current `tasks` array to the browser's localStorage as a JSON string.
 * This ensures tasks persist even if the user refreshes or closes the page.
 */
function saveTasks() {
  try {
    const serializedData = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Loads and parses tasks from localStorage when the application starts.
 * Uses a try/catch block to gracefully handle any corrupted JSON or storage errors.
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      // Ensure the parsed data is an array
      if (Array.isArray(parsed)) {
        tasks = parsed;
        return;
      }
    }
  } catch (error) {
    console.warn('Corrupted localStorage data found. Initializing with an empty task list:', error);
    tasks = [];
  }
}

/* ==========================================================================
   4. Task Manipulation Functions (CRUD & State Updates)
   ========================================================================== */

/**
 * Adds a new task to the `tasks` array, saves state, and re-renders the list.
 * Ignores empty or whitespace-only inputs.
 * 
 * @param {string} text - The task description from user input
 */
function addTask(text) {
  // Trim leading/trailing whitespace
  const trimmedText = text.trim();

  // Validate: Ignore empty or whitespace-only input
  if (!trimmedText) {
    return;
  }

  // Create a new task object with a unique timestamp ID
  const newTask = {
    id: Date.now(),
    text: trimmedText,
    completed: false
  };

  // Add the new task to the beginning of our state array
  tasks.unshift(newTask);

  // Synchronize with LocalStorage
  saveTasks();

  // Re-render UI to reflect state changes
  renderTasks();

  // Reset the input field
  taskInput.value = '';
  taskInput.focus();
}

/**
 * Toggles the completed status of a task by its unique ID.
 * 
 * @param {number} id - The unique ID of the task to toggle
 */
function toggleTask(id) {
  // Find the task in our state array
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  // Toggle the boolean completed state
  task.completed = !task.completed;

  // Persist state and re-render
  saveTasks();
  renderTasks();
}

/**
 * Deletes a task from the `tasks` array by its unique ID.
 * 
 * @param {number} id - The unique ID of the task to remove
 */
function deleteTask(id) {
  // Filter out the task with matching id
  tasks = tasks.filter(t => t.id !== id);

  // Persist state and re-render
  saveTasks();
  renderTasks();
}

/**
 * Clears all tasks marked as completed.
 */
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

/* ==========================================================================
   5. UI Rendering & DOM Manipulation
   ========================================================================== */

/**
 * Rebuilds and renders the task list DOM from the `tasks` state array.
 * Uses safe DOM methods (createElement, textContent, classList, appendChild)
 * to prevent Cross-Site Scripting (XSS) vulnerabilities.
 */
function renderTasks() {
  // Clear existing task items in the <ul>
  taskList.innerHTML = '';

  // 1. Filter tasks according to current filter ('all' | 'active' | 'completed')
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  // 2. Handle Empty State visibility & contextual messaging
  if (filteredTasks.length === 0) {
    emptyState.classList.remove('hidden');
    taskList.classList.add('hidden');

    if (currentFilter === 'active' && tasks.length > 0) {
      emptyHeading.textContent = 'No active tasks';
      emptyText.textContent = 'All tasks are currently completed! Great job!';
    } else if (currentFilter === 'completed' && tasks.length > 0) {
      emptyHeading.textContent = 'No completed tasks';
      emptyText.textContent = 'Check off tasks as you complete them to see them here.';
    } else {
      emptyHeading.textContent = 'No tasks found';
      emptyText.textContent = "You're all caught up! Add a new task above to get started.";
    }
  } else {
    emptyState.classList.add('hidden');
    taskList.classList.remove('hidden');

    // 3. Construct DOM elements for each task in filteredTasks
    filteredTasks.forEach(task => {
      // <li> container
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id; // store id in dataset for event delegation

      if (task.completed) {
        li.classList.add('completed');
      }

      // Checkbox wrapper (<label>)
      const checkboxWrap = document.createElement('label');
      checkboxWrap.className = 'task-checkbox-wrap';
      checkboxWrap.setAttribute('aria-label', task.completed ? 'Mark task as active' : 'Mark task as complete');

      // Checkbox input (<input type="checkbox">)
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkboxWrap.appendChild(checkbox);

      // Task text (<span>)
      const taskText = document.createElement('span');
      taskText.className = 'task-text';
      // Safe: textContent ensures user input cannot execute as HTML/scripts
      taskText.textContent = task.text;

      // Delete button (<button>)
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
      deleteBtn.title = 'Delete task';
      
      // Inline SVG trash icon for delete button
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;

      // Assemble elements into <li>
      li.appendChild(checkboxWrap);
      li.appendChild(taskText);
      li.appendChild(deleteBtn);

      // Append <li> to <ul> list
      taskList.appendChild(li);
    });
  }

  // 4. Update Live Counter ("X tasks remaining")
  updateLiveCounter();

  // 5. Update Clear Completed Button visibility
  const hasCompleted = tasks.some(t => t.completed);
  if (hasCompleted) {
    clearCompletedBtn.classList.remove('hidden');
  } else {
    clearCompletedBtn.classList.add('hidden');
  }
}

/**
 * Updates the live counter displaying how many active tasks remain.
 */
function updateLiveCounter() {
  const activeCount = tasks.filter(t => !t.completed).length;
  const unit = activeCount === 1 ? 'task' : 'tasks';
  taskCounter.textContent = `${activeCount} ${unit} remaining`;
}

/* ==========================================================================
   6. Event Listeners & Event Delegation
   ========================================================================== */

/**
 * Form Submission Event: Handles adding tasks via "Add" button click or form submit.
 */
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

/**
 * Keyboard Event: Allows adding tasks immediately upon pressing the Enter key.
 */
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTask(taskInput.value);
  }
});

/**
 * EVENT DELEGATION on the <ul> taskList container.
 * Instead of attaching individual click listeners to every checkbox and delete button,
 * a single listener on the parent element intercepts bubbled click events.
 * This improves performance and automatically handles dynamically created items.
 */
taskList.addEventListener('click', (e) => {
  // Find closest task item <li>
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  // Retrieve task ID stored in data-id attribute (parsed to integer)
  const taskId = Number(taskItem.dataset.id);

  // Case 1: Clicked on the Delete button
  if (e.target.closest('.btn-delete')) {
    e.stopPropagation();
    deleteTask(taskId);
    return;
  }

  // Case 2: Clicked on the Checkbox or Task Text to toggle completion
  if (e.target.closest('.task-checkbox-wrap') || e.target.closest('.task-text') || e.target.classList.contains('task-checkbox')) {
    toggleTask(taskId);
    return;
  }
});

/**
 * Filter Buttons: Switching between All, Active, and Completed views.
 */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active tab style
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update state filter and re-render
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

/**
 * Clear Completed Button: Removes all completed tasks in one click.
 */
clearCompletedBtn.addEventListener('click', () => {
  clearCompleted();
});

/* ==========================================================================
   7. Application Initialization
   ========================================================================== */

/**
 * Initializes the application when DOM is fully loaded.
 */
function init() {
  // 1. Load persisted data from localStorage
  loadTasks();

  // 2. Initial render of tasks to DOM
  renderTasks();

  // 3. Auto-focus the input field for instant typing
  taskInput.focus();
}

// Start app once DOM is ready
document.addEventListener('DOMContentLoaded', init);
