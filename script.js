'use strict';

// 1. Application State & Constants
const STORAGE_KEY = 'todo_tasks_data';
let tasks = [];
let currentFilter = 'all';

// 2. DOM Element References
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
