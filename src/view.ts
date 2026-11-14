import { GRID_SIZE, TODAY_ISO, saveState, state, ui } from './store';
import { addDays, byId, formatShortRuDate, formatWeekdayRu } from './utils';
import { renderAll } from './render';

export function applyTheme(): void {
  const btn = byId('theme-toggle-btn');
  if (state.theme === 'light') {
    document.body.classList.add('theme-light');
    btn.textContent = '🌙';
    btn.title = 'Тёмная тема (Изумрудное свечение)';
  } else {
    document.body.classList.remove('theme-light');
    btn.textContent = '☀️';
    btn.title = 'Светлая тема (Утренний нефрит)';
  }
}

export function applyCanvasTransform(): void {
  const world = byId('canvas-world');
  const grid = byId('pegboard-grid');
  world.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;

  // Keep the peg dots in sync with pan & zoom
  const step = GRID_SIZE * state.zoom;
  const subStep = (GRID_SIZE / 2) * state.zoom;
  grid.style.backgroundSize = `${step}px ${step}px, ${subStep}px ${subStep}px`;
  grid.style.backgroundPosition = `${state.pan.x}px ${state.pan.y}px, ${state.pan.x + subStep}px ${state.pan.y + subStep}px`;

  byId('zoom-reset-btn').textContent = `${Math.round(state.zoom * 100)}%`;
}

export function renderDateStrip(): void {
  const strip = byId('date-strip');
  const picker = byId<HTMLInputElement>('date-picker-input');
  picker.value = state.selectedDate;
  strip.innerHTML = '';

  // Show 5 days starting from the day before the selected date
  const baseStart = state.selectedDate === TODAY_ISO
    ? addDays(TODAY_ISO, -1)
    : addDays(state.selectedDate, -1);

  for (let i = 0; i < 5; i++) {
    const iso = addDays(baseStart, i);
    const count = state.nodes.filter(n => n.date === iso).length;
    const isSelected = iso === state.selectedDate;

    const btn = document.createElement('button');
    btn.className = `px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition border ${
      isSelected ? 'font-semibold shadow-sm' : 'opacity-80 hover:opacity-100'
    }`;
    if (isSelected) {
      btn.style.background = 'rgba(163, 230, 53, 0.16)';
      btn.style.borderColor = 'var(--accent-lime)';
      btn.style.color = 'var(--text-primary)';
    } else {
      btn.style.background = 'transparent';
      btn.style.borderColor = 'var(--border-subtle)';
      btn.style.color = 'var(--text-secondary)';
    }

    btn.innerHTML = `
            <span>${formatWeekdayRu(iso, TODAY_ISO)}</span>
            <span class="opacity-75">${formatShortRuDate(iso)}</span>
            ${count > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold" style="background: var(--accent-lime); color: var(--accent-text-dark);">${count}</span>` : ''}
          `;
    btn.onclick = () => {
      state.selectedDate = iso;
      ui.expandedNodeId = null;
      saveState();
      renderAll();
    };
    strip.appendChild(btn);
    if (isSelected) {
      // Keep the selected day visible when the strip is narrower than its content
      requestAnimationFrame(() => btn.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
    }
  }
}
