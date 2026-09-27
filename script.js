'use strict';

const STORAGE_KEY = 'todo_tasks_data';
let tasks = [];
let currentFilter = 'all';

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

function saveTasks() {
  try {
    const serializedData = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}
