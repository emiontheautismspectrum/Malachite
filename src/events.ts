import type { AppState } from './types';
import { createDefaultState, replaceState, saveState, snap, state, ui } from './store';
import { addDays, byId, targetEl, uid } from './utils';
import { showToast } from './toast';
import { renderAll } from './render';
import { applyCanvasTransform, applyTheme } from './view';
import { renderProjects } from './projects';
import { toggleConnectMode } from './wires';
import { closeModal, openModal, renderCategoriesModal } from './modals';
import { createNodeAt } from './createNode';

/** Bind all static UI events and canvas interactions. */
export function bindEvents(): void {
  const viewport = byId('viewport');

  // Pan the canvas by dragging an empty area
  viewport.addEventListener('pointerdown', (e) => {
    if (targetEl(e)?.closest('.peg-card, .zone-header, .zone-resize-handle')) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origPanX = state.pan.x;
    const origPanY = state.pan.y;

    function onMove(ev: PointerEvent): void {
      state.pan.x = origPanX + (ev.clientX - startX);
      state.pan.y = origPanY + (ev.clientY - startY);
      applyCanvasTransform();
    }

    function onUp(): void {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      saveState();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Double click on an empty spot creates a node
  viewport.addEventListener('dblclick', (e) => {
    if (targetEl(e)?.closest('.peg-card, .zone-header')) return;
    const rect = viewport.getBoundingClientRect();
    const wx = (e.clientX - rect.left - state.pan.x) / state.zoom - 128;
    const wy = (e.clientY - rect.top - state.pan.y) / state.zoom - 36;
    createNodeAt(wx, wy);
  });

  // Zoom with the mouse wheel (around the cursor)
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldZoom = state.zoom;
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(1.8, Math.max(0.45, Number((oldZoom * factor).toFixed(2))));

    state.pan.x = mouseX - ((mouseX - state.pan.x) / oldZoom) * newZoom;
    state.pan.y = mouseY - ((mouseY - state.pan.y) / oldZoom) * newZoom;
    state.zoom = newZoom;
    applyCanvasTransform();
    saveState();
  }, { passive: false });

  // Day navigation
  byId('prev-day-btn').onclick = () => {
    state.selectedDate = addDays(state.selectedDate, -1);
    ui.expandedNodeId = null;
    saveState();
    renderAll();
  };

  byId('next-day-btn').onclick = () => {
    state.selectedDate = addDays(state.selectedDate, 1);
    ui.expandedNodeId = null;
    saveState();
    renderAll();
  };

  const datePicker = byId<HTMLInputElement>('date-picker-input');
  datePicker.onchange = () => {
    if (!datePicker.value) return;
    state.selectedDate = datePicker.value;
    ui.expandedNodeId = null;
    saveState();
    renderAll();
  };

  // "+ Нода"
  byId('add-node-btn').onclick = () => {
    const rect = viewport.getBoundingClientRect();
    const wx = (rect.width / 2 - state.pan.x) / state.zoom - 128;
    const wy = (rect.height / 2 - state.pan.y) / state.zoom - 40;
    createNodeAt(wx, wy);
  };

  // "+ Проект"
  byId('add-project-btn').onclick = () => {
    const offset = state.projects.length * 36;
    state.projects.push({
      id: uid('proj'),
      title: 'Новый проект',
      color: '#4ade80',
      description: '',
      x: snap(96 + offset),
      y: snap(96 + offset),
      collapsed: false,
      checklist: [],
    });
    saveState();
    renderProjects();
    showToast('Создан сквозной проект');
  };

  // "Связать"
  byId('connect-mode-btn').onclick = () => toggleConnectMode();

  // "Сетка"
  const snapBtn = byId('snap-grid-btn');
  snapBtn.classList.toggle('active', state.snapToGrid);
  snapBtn.onclick = () => {
    state.snapToGrid = !state.snapToGrid;
    snapBtn.classList.toggle('active', state.snapToGrid);
    saveState();
    showToast(state.snapToGrid ? 'Привязка к шагу 24px включена' : 'Свободное перемещение');
  };

  // Zoom buttons
  byId('zoom-in-btn').onclick = () => {
    state.zoom = Math.min(1.8, Number((state.zoom + 0.1).toFixed(2)));
    applyCanvasTransform();
    saveState();
  };
  byId('zoom-out-btn').onclick = () => {
    state.zoom = Math.max(0.45, Number((state.zoom - 0.1).toFixed(2)));
    applyCanvasTransform();
    saveState();
  };
  byId('zoom-reset-btn').onclick = () => {
    state.zoom = 1;
    state.pan = { x: 0, y: 0 };
    applyCanvasTransform();
    saveState();
  };

  // Theme toggle
  byId('theme-toggle-btn').onclick = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
  };

  // Categories modal
  byId('manage-categories-btn').onclick = () => {
    renderCategoriesModal();
    openModal('categories-modal');
  };
  byId('close-categories-modal').onclick = () => closeModal('categories-modal');
  byId('create-cat-btn').onclick = () => {
    const nameInput = byId<HTMLInputElement>('new-cat-name');
    const colorInput = byId<HTMLInputElement>('new-cat-color');
    const name = nameInput.value.trim();
    if (!name) return;
    state.categories.push({ id: uid('cat'), name, color: colorInput.value });
    nameInput.value = '';
    saveState();
    renderCategoriesModal();
  };

  // Backup modal
  byId('backup-btn').onclick = () => openModal('backup-modal');
  byId('close-backup-modal').onclick = () => closeModal('backup-modal');
  byId('export-json-btn').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malachite-${state.selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importInput = byId<HTMLInputElement>('import-json-input');
  importInput.onchange = () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as Partial<AppState>;
        replaceState({ ...createDefaultState(), ...imported });
        saveState();
        renderAll();
        closeModal('backup-modal');
        showToast('Данные успешно восстановлены');
      } catch {
        showToast('Ошибка: некорректный JSON-файл');
      }
    };
    reader.readAsText(file);
  };
  byId('reset-demo-btn').onclick = () => {
    replaceState(createDefaultState());
    ui.expandedNodeId = null;
    saveState();
    renderAll();
    closeModal('backup-modal');
    showToast('Доска сброшена к демо-состоянию');
  };
}
