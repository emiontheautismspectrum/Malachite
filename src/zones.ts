import type { Category } from './types';
import { saveState, snap, state } from './store';
import { byId, escapeHtml, qs, targetEl } from './utils';
import { renderWires } from './wires';

/** Render the magnetic category zones of the selected day. */
export function renderZones(): void {
  const layer = byId('zones-layer');
  layer.innerHTML = '';
  const dayZones = state.zones.filter(z => z.date === state.selectedDate);

  dayZones.forEach(zone => {
    const cat: Pick<Category, 'name' | 'color'> =
      state.categories.find(c => c.id === zone.categoryId) ?? { name: 'Зона', color: '#4ade80' };
    const el = document.createElement('div');
    el.className = 'category-zone';
    el.dataset.zoneId = zone.id;
    el.style.left = `${zone.x}px`;
    el.style.top = `${zone.y}px`;
    el.style.width = `${zone.width}px`;
    el.style.height = `${zone.height}px`;
    el.style.borderColor = `${cat.color}55`;

    el.innerHTML = `
            <div class="zone-header px-3.5 py-2 flex items-center justify-between cursor-move rounded-t-[18px]"
                 style="background: ${cat.color}14;">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background: ${cat.color};"></span>
                <span class="text-xs font-semibold tracking-wide" style="color: ${cat.color};">${escapeHtml(cat.name)}</span>
              </div>
              <button class="remove-zone-btn text-xs opacity-60 hover:opacity-100 px-1.5 py-0.5 rounded" title="Убрать зону с этого дня">✕</button>
            </div>
            <div class="zone-resize-handle" title="Изменить размер зоны"></div>
          `;

    // Remove the zone from the current day
    qs<HTMLButtonElement>(el, '.remove-zone-btn').onclick = (e) => {
      e.stopPropagation();
      state.zones = state.zones.filter(z => z.id !== zone.id);
      saveState();
      renderZones();
    };

    // Drag the zone together with the nodes inside it
    const header = qs(el, '.zone-header');
    header.addEventListener('pointerdown', (e) => {
      if (targetEl(e)?.closest('button')) return;
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = zone.x;
      const origY = zone.y;

      // Nodes inside the zone at the moment the drag starts
      const containedNodes = state.nodes.filter(n =>
        n.date === state.selectedDate &&
        n.x >= origX - 10 && n.x <= origX + zone.width &&
        n.y >= origY - 10 && n.y <= origY + zone.height
      ).map(n => ({ node: n, origX: n.x, origY: n.y }));

      function onMove(ev: PointerEvent): void {
        const dx = (ev.clientX - startX) / state.zoom;
        const dy = (ev.clientY - startY) / state.zoom;
        zone.x = Math.max(0, snap(origX + dx));
        zone.y = Math.max(0, snap(origY + dy));
        el.style.left = `${zone.x}px`;
        el.style.top = `${zone.y}px`;

        const actualDx = zone.x - origX;
        const actualDy = zone.y - origY;
        containedNodes.forEach(item => {
          item.node.x = Math.max(0, item.origX + actualDx);
          item.node.y = Math.max(0, item.origY + actualDy);
          const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${item.node.id}"]`);
          if (nodeEl) {
            nodeEl.style.left = `${item.node.x}px`;
            nodeEl.style.top = `${item.node.y}px`;
          }
        });
        renderWires();
      }

      function onUp(): void {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        saveState();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    // Resize the zone
    const resizer = qs(el, '.zone-resize-handle');
    resizer.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const origW = zone.width;
      const origH = zone.height;

      function onResize(ev: PointerEvent): void {
        const dw = (ev.clientX - startX) / state.zoom;
        const dh = (ev.clientY - startY) / state.zoom;
        zone.width = Math.max(240, snap(origW + dw));
        zone.height = Math.max(180, snap(origH + dh));
        el.style.width = `${zone.width}px`;
        el.style.height = `${zone.height}px`;
      }

      function onUp(): void {
        window.removeEventListener('pointermove', onResize);
        window.removeEventListener('pointerup', onUp);
        saveState();
      }

      window.addEventListener('pointermove', onResize);
      window.addEventListener('pointerup', onUp);
    });

    layer.appendChild(el);
  });
}
