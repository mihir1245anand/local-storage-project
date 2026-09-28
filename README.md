# 📝 Task Master — Interactive To-Do List with LocalStorage

A modern, dynamic, and accessible Task Management web application built with **pure Vanilla HTML5, CSS3, and JavaScript** (ES6+). Zero third-party dependencies, zero frameworks.

---

## 🌟 Live Demo & Preview

- **Live URL:** [http://localhost:5173](http://localhost:5173)
- **Repository:** [https://github.com/mihir1245anand/local-storage-project](https://github.com/mihir1245anand/local-storage-project)

---

## ✨ Features

- ⚡ **Add Tasks**: Text input with instant <kbd>Enter</kbd> key support or "Add" button. Automatically ignores empty or whitespace-only strings.
- ✅ **Toggle Completion**: Interactive custom checkbox with strikethrough animation and muted status.
- 🗑️ **Delete Tasks**: One-click removal of individual tasks with accessible labels.
- 💾 **LocalStorage Persistence**: Automatically synchronizes state changes to browser `window.localStorage` so data survives page refreshes and browser restarts.
- 🛡️ **XSS Protection**: Built using safe DOM methods (`document.createElement`, `textContent`, `classList`) instead of unsafe `innerHTML` interpolation.
- 🎯 **Filter Views**: Switch smoothly between **All**, **Active**, and **Completed** tasks with contextual empty states.
- 📊 **Live Counter**: Dynamic badge displaying the exact number of remaining active tasks in real-time.
- 🧹 **Clear Completed**: Quick action to purge all finished tasks in a single click.
- 📱 **Responsive Design**: Clean, glassmorphic card layout that scales seamlessly from mobile screens to large desktop monitors.

---

## 📂 Project Architecture

```text
local-storage-project/
├── index.html       # Semantic HTML5 markup with accessible controls
├── style.css        # Modern design system, CSS variables & responsive layout
├── script.js        # Single source-of-truth state, CRUD, & LocalStorage logic
├── .gitignore       # System and dependency ignore rules
└── README.md        # Comprehensive documentation & setup guide
```

---

## 🧠 Core JavaScript Concepts

### 1. State-Driven Architecture
The UI is completely driven by a single array of task objects:
```javascript
let tasks = [
  {
    id: 1727546000000,    // Unique identifier (timestamp)
    text: "Learn JavaScript DOM Manipulation",
    completed: false      // Boolean completion flag
  }
];
```

### 2. Event Delegation
Rather than attaching event listeners to every task item, a single event listener is bound to the parent `<ul>`:
```javascript
taskList.addEventListener('click', (e) => {
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;
  const taskId = Number(taskItem.dataset.id);

  if (e.target.closest('.btn-delete')) {
    deleteTask(taskId);
  } else if (e.target.closest('.task-checkbox-wrap') || e.target.closest('.task-text')) {
    toggleTask(taskId);
  }
});
```

### 3. Resilient LocalStorage Serialization
Data parsing is wrapped in `try/catch` to guarantee the application never crashes from corrupted browser storage:
```javascript
function loadTasks() {
  try {
    const rawData = localStorage.getItem('todo_tasks_data');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        tasks = parsed;
      }
    }
  } catch (error) {
    console.warn('LocalStorage parse error:', error);
    tasks = [];
  }
}
```

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Enter</kbd> | Submit and create task while in the input field |
| <kbd>Tab</kbd> | Navigate through tasks and controls accessibly |
| <kbd>Space</kbd> | Toggle task checkbox when focused |

---

## 🚀 Getting Started Locally

### Prerequisites
Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari).

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone https://github.com/mihir1245anand/local-storage-project.git
   cd local-storage-project
   ```

2. **Open in Browser:**
   - Double-click `index.html` to open directly, or
   - Start a local development server:
     ```bash
     # Using Node.js / npx
     npx serve .

     # Or using Python 3
     python -m http.server 3000
     ```

3. Open `http://localhost:3000` (or `http://localhost:5173`) in your web browser.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).