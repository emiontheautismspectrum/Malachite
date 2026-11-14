import { saveState, snap, state } from './store';
import { byId, escapeAttr, qs, uid } from './utils';
import { showToast } from './toast';
import { renderZones } from './zones';
import { renderNodes } from './nodes';

export function openModal(id: string): void {
  const modal = byId(id);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeModal(id: string): void {
  const modal = byId(id);
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

/** Render the category list inside the "Categories & zones" modal. */
export function renderCategoriesModal(): void {
  const list = byId('categories-list');
  list.innerHTML = '';

  state.categories.forEach(cat => {
    const isOnBoard = state.zones.some(z => z.date === state.selectedDate && z.categoryId === cat.id);
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-2 p-2.5 rounded-xl border';
    row.style.borderColor = 'var(--border-subtle)';
    row.style.background = 'var(--surface-input)';

    row.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <input type="color" class="cat-color w-5 h-5 rounded cursor-pointer bg-transparent border-0 shrink-0" value="${cat.color}" />
              <input type="text" class="cat-name bg-transparent text-xs font-medium outline-none flex-1 min-w-0" value="${escapeAttr(cat.name)}" />
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="place-zone-btn btn-ghost px-2 py-1 text-[11px]">
                ${isOnBoard ? '+ Ещё зону' : '+ Зону на день'}
              </button>
              <button class="del-cat-btn text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg" title="Удалить категорию">✕</button>
            </div>
          `;

    const colorInput = qs<HTMLInputElement>(row, '.cat-color');
    colorInput.oninput = () => {
      cat.color = colorInput.value;
      saveState();
      renderZones();
      renderNodes();
    };

    const nameInput = qs<HTMLInputElement>(row, '.cat-name');
    nameInput.onchange = () => {
      cat.name = nameInput.value.trim() || 'Категория';
      saveState();
      renderZones();
      renderNodes();
    };

    qs<HTMLButtonElement>(row, '.place-zone-btn').onclick = () => {
      const offset = state.zones.filter(z => z.date === state.selectedDate).length * 48;
      state.zones.push({
        id: uid('zone'),
        date: state.selectedDate,
        categoryId: cat.id,
        x: snap(456 + offset),
        y: snap(96 + offset),
        width: 336,
        height: 360,
      });
      saveState();
      renderZones();
      renderCategoriesModal();
      showToast(`Зона «${cat.name}» добавлена на доску`);
    };

    qs<HTMLButtonElement>(row, '.del-cat-btn').onclick = () => {
      state.categories = state.categories.filter(c => c.id !== cat.id);
      state.zones = state.zones.filter(z => z.categoryId !== cat.id);
      saveState();
      renderZones();
      renderNodes();
      renderCategoriesModal();
    };

    list.appendChild(row);
  });
}
