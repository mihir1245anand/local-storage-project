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

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTask(taskInput.value);
  }
});
