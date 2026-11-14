import type { BoardNode, Project } from './types';
import { saveState, snap, state, ui } from './store';
import { byId, escapeAttr, escapeHtml, formatShortRuDate, qs, targetEl, uid } from './utils';
import { showToast } from './toast';
import { renderAll } from './render';
import { renderNodes } from './nodes';
import { renderWires } from './wires';

/** Render cross-day project hubs (master nodes). */
export function renderProjects(): void {
  const layer = byId('projects-layer');
  layer.innerHTML = '';

  state.projects.forEach(proj => {
    const linkedNodes = state.nodes.filter(n => n.projectId === proj.id);
    const doneNodes = linkedNodes.filter(n => n.done).length;
    const totalItems = linkedNodes.length + proj.checklist.length;
    const doneItems = doneNodes + proj.checklist.filter(c => c.done).length;
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'peg-card z-20';
    card.dataset.projectId = proj.id;
    card.style.left = `${proj.x}px`;
    card.style.top = `${proj.y}px`;
    card.style.borderColor = `${proj.color}55`;

    if (proj.collapsed) {
      // Compact collapsible project badge
      card.style.width = 'auto';
      card.style.minWidth = '210px';
      card.innerHTML = `
              <div class="proj-drag-handle px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-grab">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: ${proj.color};"></span>
                  <span class="text-xs font-bold truncate max-w-[160px]">${escapeHtml(proj.title)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style="background: ${proj.color}22; color: ${proj.color};">
                    ${doneItems}/${totalItems}
                  </span>
                  <button class="expand-proj-btn btn-ghost px-1.5 py-0.5 text-xs" title="Развернуть проект">+</button>
                </div>
              </div>
            `;
      qs<HTMLButtonElement>(card, '.expand-proj-btn').onclick = (e) => {
        e.stopPropagation();
        proj.collapsed = false;
        saveState();
        renderProjects();
        renderWires();
      };
    } else {
      // Expanded cross-day project card
      card.style.width = '336px';
      card.innerHTML = `
              <div class="proj-drag-handle px-4 py-3 flex items-center justify-between gap-2 cursor-grab border-b"
                   style="border-color: var(--border-subtle); background: ${proj.color}12; border-radius: 15px 15px 0 0;">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <input type="color" class="proj-color-input w-4 h-4 rounded cursor-pointer bg-transparent border-0 shrink-0" value="${proj.color}" title="Цвет проекта" />
                  <span class="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                        style="background: ${proj.color}25; color: ${proj.color};">Проект</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="collapse-proj-btn btn-ghost px-2 py-0.5 text-xs" title="Свернуть в бейдж">−</button>
                  <button class="delete-proj-btn btn-ghost px-2 py-0.5 text-xs text-red-400 hover:border-red-400" title="Удалить проект">✕</button>
                </div>
              </div>

              <div class="p-4 space-y-3">
                <!-- Название и описание -->
                <input type="text" class="proj-title-input field-input w-full px-2.5 py-1.5 text-sm font-bold" value="${escapeAttr(proj.title)}" />
                <textarea rows="2" class="proj-desc-input field-input w-full px-2.5 py-1.5 text-xs resize-none" placeholder="Цели и описание проекта...">${escapeHtml(proj.description || '')}</textarea>

                <!-- Прогресс -->
                <div>
                  <div class="flex justify-between text-[11px] mb-1" style="color: var(--text-secondary);">
                    <span>Общий прогресс</span>
                    <span class="font-semibold" style="color: ${proj.color};">${doneItems} / ${totalItems} (${pct}%)</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--surface-input);">
                    <div class="h-full transition-all duration-300" style="width: ${pct}%; background: ${proj.color};"></div>
                  </div>
                </div>

                <!-- Встроенный чек-лист проекта -->
                <div>
                  <div class="text-[11px] font-semibold mb-1.5" style="color: var(--text-secondary);">Этапы / Чек-лист проекта</div>
                  <div class="proj-checklist space-y-1.5 max-h-28 overflow-y-auto pr-1"></div>
                  <div class="flex gap-1.5 mt-2">
                    <input type="text" class="new-chk-input field-input flex-1 px-2.5 py-1 text-xs" placeholder="Новый пункт чек-листа..." />
                    <button class="add-chk-btn btn-ghost px-2.5 py-1 text-xs font-semibold">+</button>
                  </div>
                </div>

                <!-- Связанные ноды по всем дням -->
                <div class="pt-2 border-t" style="border-color: var(--border-subtle);">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] font-semibold" style="color: var(--text-secondary);">Задачи по дням (${linkedNodes.length})</span>
                    <button class="add-linked-node-btn text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style="background: ${proj.color}22; color: ${proj.color};">+ Нода на этот день</button>
                  </div>
                  <div class="proj-linked-nodes space-y-1 max-h-32 overflow-y-auto pr-1"></div>
                </div>
              </div>
            `;

      bindExpandedProject(card, proj, linkedNodes);
    }

    // Drag the project around the pegboard
    const handle = qs(card, '.proj-drag-handle');
    handle.addEventListener('pointerdown', (e) => {
      if (targetEl(e)?.closest('button, input')) return;
      e.stopPropagation();
      card.classList.add('is-dragging');
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = proj.x;
      const origY = proj.y;

      function onMove(ev: PointerEvent): void {
        const dx = (ev.clientX - startX) / state.zoom;
        const dy = (ev.clientY - startY) / state.zoom;
        proj.x = Math.max(0, snap(origX + dx));
        proj.y = Math.max(0, snap(origY + dy));
        card.style.left = `${proj.x}px`;
        card.style.top = `${proj.y}px`;
        renderWires();
      }

      function onUp(): void {
        card.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        saveState();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    layer.appendChild(card);
  });
}

/** Wire up handlers of an expanded project card. */
function bindExpandedProject(card: HTMLElement, proj: Project, linkedNodes: BoardNode[]): void {
  const linkedCount = linkedNodes.length;

  const colorInput = qs<HTMLInputElement>(card, '.proj-color-input');
  colorInput.oninput = () => {
    proj.color = colorInput.value;
    saveState();
    renderProjects();
    renderNodes();
    renderWires();
  };

  const titleInput = qs<HTMLInputElement>(card, '.proj-title-input');
  titleInput.onchange = () => {
    proj.title = titleInput.value.trim() || 'Без названия';
    saveState();
    renderNodes();
  };

  const descInput = qs<HTMLTextAreaElement>(card, '.proj-desc-input');
  descInput.onchange = () => {
    proj.description = descInput.value;
    saveState();
  };

  qs<HTMLButtonElement>(card, '.collapse-proj-btn').onclick = () => {
    proj.collapsed = true;
    saveState();
    renderProjects();
    renderWires();
  };

  qs<HTMLButtonElement>(card, '.delete-proj-btn').onclick = () => {
    // Detach nodes and delete the project, with Undo
    const backupProj = JSON.parse(JSON.stringify(proj)) as Project;
    const affectedNodeIds = state.nodes.filter(n => n.projectId === proj.id).map(n => n.id);
    state.nodes.forEach(n => { if (n.projectId === proj.id) n.projectId = null; });
    state.projects = state.projects.filter(p => p.id !== proj.id);
    saveState();
    renderProjects();
    renderNodes();
    renderWires();

    showToast(`Проект «${backupProj.title}» удалён`, () => {
      state.projects.push(backupProj);
      state.nodes.forEach(n => { if (affectedNodeIds.includes(n.id)) n.projectId = backupProj.id; });
      saveState();
      renderProjects();
      renderNodes();
      renderWires();
    });
  };

  // Checklist
  const chkContainer = qs(card, '.proj-checklist');
  proj.checklist.forEach(item => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 text-xs group';
    row.innerHTML = `
                <input type="checkbox" ${item.done ? 'checked' : ''} class="accent-lime-400 cursor-pointer shrink-0" />
                <span class="flex-1 truncate ${item.done ? 'line-through opacity-55' : ''}">${escapeHtml(item.text)}</span>
                <button class="del-chk opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[11px] px-1">✕</button>
              `;
    const chk = qs<HTMLInputElement>(row, 'input');
    chk.onchange = () => {
      item.done = chk.checked;
      saveState();
      renderProjects();
    };
    qs<HTMLButtonElement>(row, '.del-chk').onclick = () => {
      proj.checklist = proj.checklist.filter(c => c.id !== item.id);
      saveState();
      renderProjects();
    };
    chkContainer.appendChild(row);
  });

  const addChkInput = qs<HTMLInputElement>(card, '.new-chk-input');
  const submitChk = (): void => {
    const txt = addChkInput.value.trim();
    if (!txt) return;
    proj.checklist.push({ id: uid('chk'), text: txt, done: false });
    addChkInput.value = '';
    saveState();
    renderProjects();
  };
  qs<HTMLButtonElement>(card, '.add-chk-btn').onclick = submitChk;
  addChkInput.onkeydown = (e) => { if (e.key === 'Enter') submitChk(); };

  // Linked nodes across all days
  const linkedContainer = qs(card, '.proj-linked-nodes');
  if (linkedNodes.length === 0) {
    linkedContainer.innerHTML = `<div class="text-[11px] italic" style="color: var(--text-muted);">Перетащите сюда любую ноду с доски</div>`;
  } else {
    linkedNodes.forEach(n => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-xs hover:bg-emerald-500/10';
      row.innerHTML = `
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <input type="checkbox" ${n.done ? 'checked' : ''} class="accent-lime-400 cursor-pointer shrink-0" />
                    <button class="jump-node-btn truncate text-left hover:underline ${n.done ? 'line-through opacity-60' : ''}" title="Перейти к ноде">${escapeHtml(n.title)}</button>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface-input); color: var(--text-secondary);">
                      ${formatShortRuDate(n.date)}
                    </span>
                    <button class="detach-node-btn text-[11px] opacity-60 hover:opacity-100 px-1" title="Отвязать от проекта">×</button>
                  </div>
                `;
      const doneChk = qs<HTMLInputElement>(row, 'input');
      doneChk.onchange = () => {
        n.done = doneChk.checked;
        saveState();
        renderProjects();
        renderNodes();
      };
      qs<HTMLButtonElement>(row, '.jump-node-btn').onclick = () => {
        state.selectedDate = n.date;
        ui.expandedNodeId = n.id;
        saveState();
        renderAll();
        setTimeout(() => {
          const el = document.querySelector(`[data-node-id="${n.id}"]`);
          if (el) el.classList.add('is-highlighted');
        }, 50);
      };
      qs<HTMLButtonElement>(row, '.detach-node-btn').onclick = () => {
        n.projectId = null;
        saveState();
        renderProjects();
        renderNodes();
        renderWires();
      };
      linkedContainer.appendChild(row);
    });
  }

  // Create a new node on the selected day, already linked to the project
  qs<HTMLButtonElement>(card, '.add-linked-node-btn').onclick = () => {
    const newNode = {
      id: uid('node'),
      date: state.selectedDate,
      title: 'Новая задача проекта',
      startTime: '',
      endTime: '',
      categoryId: state.categories[0]?.id || '',
      projectId: proj.id,
      notes: '',
      done: false,
      x: snap(proj.x + 360),
      y: snap(proj.y + (linkedCount * 48) % 240),
    };
    state.nodes.push(newNode);
    ui.expandedNodeId = newNode.id;
    saveState();
    renderAll();
  };
}
