# Task Master — Interactive To-Do List with LocalStorage

A modern, dynamic, and accessible Task Manager web app built with **pure vanilla HTML5, CSS3, and JavaScript** (no libraries or frameworks).

---

## 🌟 Key Features

1. **Add Tasks**:
   - Add tasks using the text input and "Add" button, or by pressing the <kbd>Enter</kbd> key.
   - Automatically ignores empty or whitespace-only inputs.

2. **Mark Complete**:
   - Clicking a task (or its checkbox) toggles its completed state.
   - Displays a clean strikethrough animation and muted styling for completed tasks.

3. **Delete Tasks**:
   - Each task has an accessible delete button to remove it from the list.

4. **LocalStorage Persistence**:
   - Automatically serializes and saves all tasks to browser `window.localStorage`.
   - Data persists across page reloads and browser restarts.
   - Wrapped in `try/catch` to safely handle corrupted or unavailable storage.

5. **Live Counter & Filters**:
   - Real-time counter showing remaining active tasks (`X task(s) remaining`).
   - Filter tabs for **All**, **Active**, and **Completed** tasks with dynamic empty states.
   - "Clear Completed" button to purge finished tasks in one click.

---

## 📁 Project Structure

```text
├── index.html   # Semantic HTML5 markup and accessible controls
├── style.css    # Clean, modern, responsive centered card layout
├── script.js    # State management, DOM manipulation, LocalStorage, and event delegation
└── README.md    # Documentation and usage guide
```

---

## 🧠 Core JavaScript Concepts Covered

- **State Management:** Single `tasks` array as the source of truth (`[{ id, text, completed }]`).
- **XSS-Safe DOM Manipulation:** Uses `document.createElement()`, `textContent`, `classList`, and `appendChild()` instead of unsafe `innerHTML`.
- **Event Delegation:** Centralized event listener on the `<ul>` element to handle dynamic item clicks and deletes efficiently.
- **LocalStorage API:** Serialization via `JSON.stringify()` and deserialization with `JSON.parse()`.

---

## 🚀 How to Run Locally

Simply open `index.html` in any web browser, or serve with a local server:

```bash
npx serve .
```