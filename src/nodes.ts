import type { BoardNode } from './types';
import { saveState, snap, state, ui } from './store';
import { addDays, byId, escapeAttr, escapeHtml, formatShortRuDate, qs, targetEl } from './utils';
import { showToast } from './toast';
import { renderAll } from './render';
import { renderProjects } from './projects';
import { handleConnectModeClick, renderWires, startWireDrag } from './wires';

/** Render the task cards (nodes) of the selected day. */
export function renderNodes(): void {
  const layer = byId('nodes-layer');
  layer.innerHTML = '';
  const dayNodes = state.nodes.filter(n => n.date === state.selectedDate);

  dayNodes.forEach(node => {
    const cat = state.categories.find(c => c.id === node.categoryId);
    const proj = state.projects.find(p => p.id === node.projectId);
    const isExpanded = ui.expandedNodeId === node.id;

    const card = document.createElement('div');
    card.className = 'peg-card z-30';
    card.dataset.nodeId = node.id;
    card.style.left = `${node.x}px`;
    card.style.top = `${node.y}px`;
    card.style.width = isExpanded ? '312px' : '256px';

    if (!isExpanded) {
      // Compact node card
      const timeLabel = node.startTime
        ? `${node.startTime}${node.endTime ? ' – ' + node.endTime : ''}`
        : '';

      card.innerHTML = `
              <div class="node-port port-left" data-port="left" title="Соединить"></div>
              <div class="node-port port-right" data-port="right" title="Соединить"></div>

              <div class="p-3 cursor-grab">
                <div class="flex items-center justify-between gap-1.5 mb-1.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${cat ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" style="background: ${cat.color}22; color: ${cat.color};">${escapeHtml(cat.name)}</span>` : ''}
                    ${timeLabel ? `<span class="text-[10px] px-1.5 py-0.5 rounded" style="background: var(--surface-input); color: var(--text-secondary);">🕒 ${timeLabel}</span>` : ''}
                  </div>
                  <button class="expand-node-btn text-xs opacity-60 hover:opacity-100 px-1" title="Раскрыть карточку">✎</button>
                </div>

                <div class="flex items-start gap-2">
                  <input type="checkbox" ${node.done ? 'checked' : ''} class="node-done-chk mt-0.5 accent-lime-400 cursor-pointer shrink-0" />
                  <div class="text-xs font-medium leading-snug flex-1 ${node.done ? 'line-through opacity-55' : ''}">
                    ${escapeHtml(node.title)}
                  </div>
                </div>

                ${proj ? `
                  <div class="mt-2 pt-1.5 border-t flex items-center gap-1.5 text-[10px]" style="border-color: var(--border-subtle); color: ${proj.color};">
                    <span>◈</span>
                    <span class="truncate font-medium">${escapeHtml(proj.title)}</span>
                  </div>
                ` : ''}
              </div>
            `;
    } else {
      // Inline expanded editor
      const catOptions = state.categories.map(c =>
        `<option value="${c.id}" ${c.id === node.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      ).join('');

      const projOptions = `<option value="">— Без проекта —</option>` + state.projects.map(p =>
        `<option value="${p.id}" ${p.id === node.projectId ? 'selected' : ''}>${escapeHtml(p.title)}</option>`
      ).join('');

      card.style.zIndex = '45';
      card.innerHTML = `
              <div class="node-port port-left" data-port="left"></div>
              <div class="node-port port-right" data-port="right"></div>

              <div class="node-expanded-header px-3.5 py-2.5 flex items-center justify-between border-b cursor-grab"
                   style="border-color: var(--border-subtle);">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${node.done ? 'checked' : ''} class="node-done-chk accent-lime-400 cursor-pointer" />
                  <span class="text-[11px] font-semibold" style="color: var(--accent-lime);">Редактирование ноды</span>
                </div>
                <button class="collapse-node-btn btn-ghost px-2 py-0.5 text-xs" title="Свернуть">✓ Готово</button>
              </div>

              <div class="p-3.5 space-y-2.5">
                <input type="text" class="node-title-input field-input w-full px-2.5 py-1.5 text-xs font-semibold" value="${escapeAttr(node.title)}" placeholder="Название задачи..." />

                <!-- Время -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] mb-0.5" style="color: var(--text-secondary);">Начало</label>
                    <input type="time" class="node-start-input field-input w-full px-2 py-1 text-xs" value="${node.startTime || ''}" />
                  </div>
                  <div>
                    <label class="block text-[10px] mb-0.5" style="color: var(--text-secondary);">Конец</label>
                    <input type="time" class="node-end-input field-input w-full px-2 py-1 text-xs" value="${node.endTime || ''}" />
                  </div>
                </div>

                <!-- Категория и Проект -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] mb-0.5" style="color: var(--text-secondary);">Категория</label>
                    <select class="node-cat-select field-input w-full px-2 py-1 text-xs">
                      <option value="">Без категории</option>
                      ${catOptions}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] mb-0.5" style="color: var(--text-secondary);">Проект</label>
                    <select class="node-proj-select field-input w-full px-2 py-1 text-xs">
                      ${projOptions}
                    </select>
                  </div>
                </div>

                <!-- Заметки -->
                <div>
                  <label class="block text-[10px] mb-0.5" style="color: var(--text-secondary);">Заметки</label>
                  <textarea rows="3" class="node-notes-input field-input w-full px-2.5 py-1.5 text-xs resize-none" placeholder="Подробности, ссылки, мысли...">${escapeHtml(node.notes || '')}</textarea>
                </div>

                <!-- Перенос на вчера / завтра и удаление -->
                <div class="pt-2 border-t flex items-center justify-between gap-1.5" style="border-color: var(--border-subtle);">
                  <button class="move-yesterday-btn btn-ghost px-2 py-1 text-[11px] flex-1" title="Перенести задачу на предыдущий день">← На вчера</button>
                  <button class="move-tomorrow-btn btn-ghost px-2 py-1 text-[11px] flex-1" title="Перенести задачу на следующий день">На завтра →</button>
                  <button class="delete-node-btn px-2 py-1 text-[11px] rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10" title="Удалить ноду">🗑</button>
                </div>
              </div>
            `;

      bindExpandedNode(card, node);
    }

    // Shared "done" checkbox
    const doneChk = qs<HTMLInputElement>(card, '.node-done-chk');
    doneChk.onchange = (e) => {
      e.stopPropagation();
      node.done = doneChk.checked;
      saveState();
      renderProjects();
      renderNodes();
    };

    // Connection ports
    card.querySelectorAll('.node-port').forEach(port => {
      port.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        startWireDrag(node.id);
      });
    });

    // Drag the node; a plain click expands it
    card.addEventListener('pointerdown', (e) => {
      if (targetEl(e)?.closest('input, textarea, select, button, .node-port')) return;
      if (isExpanded && !targetEl(e)?.closest('.node-expanded-header')) return;
      e.stopPropagation();

      // Click-to-connect mode
      if (ui.connectMode) {
        handleConnectModeClick(node.id);
        return;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = node.x;
      const origY = node.y;
      let moved = false;

      function onMove(ev: PointerEvent): void {
        const dx = (ev.clientX - startX) / state.zoom;
        const dy = (ev.clientY - startY) / state.zoom;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          moved = true;
          card.classList.add('is-dragging');
        }
        if (!moved) return;

        node.x = Math.max(0, snap(origX + dx));
        node.y = Math.max(0, snap(origY + dy));
        card.style.left = `${node.x}px`;
        card.style.top = `${node.y}px`;
        renderWires();

        // Highlight magnetic zones under the node
        highlightHoveredDropTargets(node);
      }

      function onUp(): void {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        card.classList.remove('is-dragging');
        clearDropTargetHighlights();

        if (!moved) {
          // Single click expands the node
          if (!isExpanded) {
            ui.expandedNodeId = node.id;
            renderNodes();
            renderWires();
          }
          return;
        }

        // Dropped onto a project card -> attach to the project
        const centerX = node.x + 128;
        const centerY = node.y + 40;
        let attachedToProj = false;

        state.projects.forEach(p => {
          const pW = p.collapsed ? 220 : 336;
          const pH = p.collapsed ? 48 : 340;
          if (centerX >= p.x && centerX <= p.x + pW && centerY >= p.y && centerY <= p.y + pH) {
            node.projectId = p.id;
            // Move the node just below the project so it does not overlap it
            node.y = snap(p.y + pH + 24);
            attachedToProj = true;
            showToast(`Привязано к проекту «${p.title}»`);
          }
        });

        // Dropped into a category zone -> take the zone's category
        if (!attachedToProj) {
          const dayZones = state.zones.filter(z => z.date === state.selectedDate);
          for (const z of dayZones) {
            if (centerX >= z.x && centerX <= z.x + z.width && centerY >= z.y && centerY <= z.y + z.height) {
              node.categoryId = z.categoryId;
              break;
            }
          }
        }

        saveState();
        renderProjects();
        renderNodes();
        renderWires();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    layer.appendChild(card);
  });
}

/** Wire up the inputs of an expanded node card. */
function bindExpandedNode(card: HTMLElement, node: BoardNode): void {
  qs<HTMLButtonElement>(card, '.collapse-node-btn').onclick = () => {
    ui.expandedNodeId = null;
    renderNodes();
    renderWires();
  };

  const titleInput = qs<HTMLInputElement>(card, '.node-title-input');
  titleInput.oninput = () => {
    node.title = titleInput.value;
    saveState();
    renderProjects();
  };

  const startInput = qs<HTMLInputElement>(card, '.node-start-input');
  startInput.onchange = () => {
    node.startTime = startInput.value;
    saveState();
  };

  const endInput = qs<HTMLInputElement>(card, '.node-end-input');
  endInput.onchange = () => {
    node.endTime = endInput.value;
    saveState();
  };

  const catSelect = qs<HTMLSelectElement>(card, '.node-cat-select');
  catSelect.onchange = () => {
    node.categoryId = catSelect.value;
    saveState();
  };

  const projSelect = qs<HTMLSelectElement>(card, '.node-proj-select');
  projSelect.onchange = () => {
    node.projectId = projSelect.value || null;
    saveState();
    renderProjects();
    renderWires();
  };

  const notesInput = qs<HTMLTextAreaElement>(card, '.node-notes-input');
  notesInput.oninput = () => {
    node.notes = notesInput.value;
    saveState();
  };

  qs<HTMLButtonElement>(card, '.move-yesterday-btn').onclick = () => moveNodeToDay(node, -1);
  qs<HTMLButtonElement>(card, '.move-tomorrow-btn').onclick = () => moveNodeToDay(node, 1);

  qs<HTMLButtonElement>(card, '.delete-node-btn').onclick = () => {
    const backupNode = JSON.parse(JSON.stringify(node)) as BoardNode;
    const backupConns = state.connections.filter(c => c.from === node.id || c.to === node.id);
    state.nodes = state.nodes.filter(n => n.id !== node.id);
    state.connections = state.connections.filter(c => c.from !== node.id && c.to !== node.id);
    ui.expandedNodeId = null;
    saveState();
    renderAll();

    showToast('Нода удалена', () => {
      state.nodes.push(backupNode);
      state.connections.push(...backupConns);
      saveState();
      renderAll();
    });
  };
}

function highlightHoveredDropTargets(node: BoardNode): void {
  const cx = node.x + 128;
  const cy = node.y + 40;
  document.querySelectorAll<HTMLElement>('.category-zone').forEach(el => {
    const z = state.zones.find(item => item.id === el.dataset.zoneId);
    if (z && cx >= z.x && cx <= z.x + z.width && cy >= z.y && cy <= z.y + z.height) {
      el.classList.add('drop-target');
    } else {
      el.classList.remove('drop-target');
    }
  });
}

function clearDropTargetHighlights(): void {
  document.querySelectorAll('.category-zone.drop-target').forEach(el => el.classList.remove('drop-target'));
}

/** Move a node to the previous/next day, with Undo. */
function moveNodeToDay(node: BoardNode, deltaDays: number): void {
  const oldDate = node.date;
  const newDate = addDays(oldDate, deltaDays);
  node.date = newDate;
  // Drop links so they do not dangle between different days
  const removedConns = state.connections.filter(c => c.from === node.id || c.to === node.id);
  state.connections = state.connections.filter(c => c.from !== node.id && c.to !== node.id);
  ui.expandedNodeId = null;
  saveState();
  renderAll();

  const label = deltaDays < 0 ? 'вчера' : 'завтра';
  showToast(`Задача перенесена на ${label} (${formatShortRuDate(newDate)})`, () => {
    node.date = oldDate;
    state.connections.push(...removedConns);
    saveState();
    renderAll();
  });
}
