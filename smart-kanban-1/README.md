# Smart Kanban Board

A lightweight, open-source Kanban board built with vanilla HTML, CSS, and JavaScript. No build tools, no dependencies — just open `index.html` in any modern browser.

## Features

- **Three columns**: To Do, In Progress, Completed
- **Create tasks** with title, description, priority (Normal / High), and due date
- **Drag & drop** tasks between columns
- **Edit or delete** tasks inline
- **Persistent storage** via `localStorage` — your board survives page refreshes
- **Priority sorting** — High-priority tasks automatically appear before Normal tasks within each column
- **Overdue highlighting** — past-due tasks are visually flagged
- **Responsive layout** — works on desktop and mobile

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in your browser.
3. Start organizing your work!

## File Structure

```
smart-kanban-1/
├── index.html    # App shell
├── style.css     # Styling & responsive rules
├── app.js        # All logic (CRUD, drag-and-drop, storage, sorting)
└── README.md     # You are here
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Escape` | Close modal |

## License

MIT — feel free to use, modify, and share.
