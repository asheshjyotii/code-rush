/**
 * Smart Kanban Board
 * Vanilla JS task board with drag & drop, localStorage persistence,
 * and priority-based sorting within columns.
 */

const STORAGE_KEY = 'smart-kanban-tasks-v1';

const columns = {
  todo: document.getElementById('todo-list'),
  inprogress: document.getElementById('inprogress-list'),
  completed: document.getElementById('completed-list'),
};

const counts = {
  todo: document.getElementById('count-todo'),
  inprogress: document.getElementById('count-inprogress'),
  completed: document.getElementById('count-completed'),
};

const modal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitleEl = document.getElementById('modal-title');
const deleteBtn = document.getElementById('delete-task-btn');

let tasks = [];
let draggedId = null;

/* ---------- Persistence ---------- */

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) tasks = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tasks', e);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

/* ---------- Task CRUD ---------- */

function generateId() {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function createTask({ title, description, priority, dueDate }) {
  const task = {
    id: generateId(),
    title: title.trim(),
    description: (description || '').trim(),
    priority: priority || 'normal',
    dueDate: dueDate || '',
    status: 'todo',
    createdAt: Date.now(),
  };
  tasks.push(task);
  saveTasks();
  return task;
}

function updateTask(id, updates) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks();
  return tasks[idx];
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
}

function moveTask(id, newStatus) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = newStatus;
    saveTasks();
  }
}

/* ---------- Sorting: High before Normal ---------- */

function getSortedTasks(status) {
  const statusTasks = tasks.filter(t => t.status === status);
  return statusTasks.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return a.createdAt - b.createdAt;
  });
}

/* ---------- Rendering ---------- */

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function renderTaskCard(task) {
  const el = document.createElement('div');
  el.className = 'task-card';
  el.draggable = true;
  el.dataset.id = task.id;

  const overdueClass = isOverdue(task.dueDate) ? 'overdue' : '';
  const dateDisplay = task.dueDate
    ? `<span class="due-date ${overdueClass}">📅 ${formatDate(task.dueDate)}${overdueClass ? ' (Overdue)' : ''}</span>`
    : '';

  el.innerHTML = `
    <div class="task-card-header">
      <div class="task-card-title">${escapeHtml(task.title)}</div>
      <div class="task-card-actions">
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="delete-btn" title="Delete">🗑️</button>
      </div>
    </div>
    ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ''}
    <div class="task-card-meta">
      <span class="priority-badge ${task.priority}">${task.priority}</span>
      ${dateDisplay}
    </div>
  `;

  el.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(task.id);
  });

  el.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('Delete this task?')) {
      deleteTask(task.id);
      renderBoard();
    }
  });

  /* Drag events */
  el.addEventListener('dragstart', (e) => {
    draggedId = task.id;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  });

  el.addEventListener('dragend', () => {
    draggedId = null;
    el.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => list.classList.remove('drag-over'));
  });

  return el;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderColumn(status) {
  const list = columns[status];
  list.innerHTML = '';
  const sorted = getSortedTasks(status);

  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty-hint">Drop tasks here</div>`;
  } else {
    sorted.forEach(task => list.appendChild(renderTaskCard(task)));
  }

  counts[status].textContent = sorted.length;
}

function renderBoard() {
  renderColumn('todo');
  renderColumn('inprogress');
  renderColumn('completed');
}

/* ---------- Drag & Drop on Columns ---------- */

Object.values(columns).forEach(list => {
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    list.classList.add('drag-over');
  });

  list.addEventListener('dragleave', (e) => {
    if (!list.contains(e.relatedTarget)) {
      list.classList.remove('drag-over');
    }
  });

  list.addEventListener('drop', (e) => {
    e.preventDefault();
    list.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    const newStatus = list.dataset.column;
    if (id && newStatus) {
      moveTask(id, newStatus);
      renderBoard();
    }
  });
});

/* ---------- Modal ---------- */

function openModal() {
  modal.classList.add('show');
  document.getElementById('task-title').focus();
}

function closeModal() {
  modal.classList.remove('show');
  taskForm.reset();
  document.getElementById('task-id').value = '';
  deleteBtn.classList.add('hidden');
  modalTitleEl.textContent = 'New Task';
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-desc').value = task.description;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-due').value = task.dueDate;

  modalTitleEl.textContent = 'Edit Task';
  deleteBtn.classList.remove('hidden');
  openModal();
}

/* ---------- Event Listeners ---------- */

document.getElementById('add-task-btn').addEventListener('click', () => {
  modalTitleEl.textContent = 'New Task';
  deleteBtn.classList.add('hidden');
  openModal();
});

document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);

deleteBtn.addEventListener('click', () => {
  const id = document.getElementById('task-id').value;
  if (id && confirm('Delete this task?')) {
    deleteTask(id);
    closeModal();
    renderBoard();
  }
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const payload = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    priority: document.getElementById('task-priority').value,
    dueDate: document.getElementById('task-due').value,
  };

  if (id) {
    updateTask(id, payload);
  } else {
    createTask(payload);
  }

  closeModal();
  renderBoard();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('show')) {
    closeModal();
  }
});

/* ---------- Init ---------- */

loadTasks();
renderBoard();
