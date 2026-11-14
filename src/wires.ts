import { saveState, state, ui } from './store';
import { byId, uid } from './utils';
import { showToast } from './toast';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Draw SVG links: dashed project→node links and solid node→node links of the current day. */
export function renderWires(): void {
  const svg = byId<SVGSVGElement>('wires-layer');
  svg.innerHTML = '';

  const dayNodes = state.nodes.filter(n => n.date === state.selectedDate);
  const nodeMap = new Map(dayNodes.map(n => [n.id, n]));

  // 1. Dashed links from projects to their tasks on the current day
  dayNodes.forEach(node => {
    if (!node.projectId) return;
    const proj = state.projects.find(p => p.id === node.projectId);
    if (!proj) return;

    const pW = proj.collapsed ? 220 : 336;
    const pH = proj.collapsed ? 44 : 220;
    const x1 = proj.x + pW / 2;
    const y1 = proj.y + pH / 2;
    const x2 = node.x + (ui.expandedNodeId === node.id ? 156 : 128);
    const y2 = node.y + 42;

    const path = document.createElementNS(SVG_NS, 'path');
    const midY = (y1 + y2) / 2;
    path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
    path.setAttribute('class', 'project-wire');
    path.style.stroke = `${proj.color}66`;
    svg.appendChild(path);
  });

  // 2. Solid links between nodes
  const dayConns = state.connections.filter(c => c.date === state.selectedDate);
  dayConns.forEach(conn => {
    const fromNode = nodeMap.get(conn.from);
    const toNode = nodeMap.get(conn.to);
    if (!fromNode || !toNode) return;

    const fromW = ui.expandedNodeId === fromNode.id ? 312 : 256;
    const toW = ui.expandedNodeId === toNode.id ? 312 : 256;

    // Pick the nearest side ports
    const fromRight = fromNode.x + fromW <= toNode.x + toW / 2;
    const x1 = fromRight ? fromNode.x + fromW : fromNode.x;
    const y1 = fromNode.y + 44;
    const x2 = fromRight ? toNode.x : toNode.x + toW;
    const y2 = toNode.y + 44;

    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45);
    const cp1x = fromRight ? x1 + dx : x1 - dx;
    const cp2x = fromRight ? x2 - dx : x2 + dx;

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', 'wire-path');
    path.innerHTML = `<title>Нажмите, чтобы удалить связь</title>`;
    path.onclick = (e) => {
      e.stopPropagation();
      state.connections = state.connections.filter(c => c.id !== conn.id);
      saveState();
      renderWires();
      showToast('Связь удалена');
    };
    svg.appendChild(path);
  });

  if (ui.tempWire) {
    svg.appendChild(ui.tempWire);
  }
}

/** Drag a wire out of a node port. */
export function startWireDrag(fromNodeId: string): void {
  const fromNode = state.nodes.find(n => n.id === fromNodeId);
  if (!fromNode) return;

  const svg = byId<SVGSVGElement>('wires-layer');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--accent-lime)');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('stroke-dasharray', '4 4');
  ui.tempWire = path;
  svg.appendChild(path);

  const fromW = ui.expandedNodeId === fromNode.id ? 312 : 256;
  const x1 = fromNode.x + fromW / 2;
  const y1 = fromNode.y + 44;

  function onMove(ev: PointerEvent): void {
    const rect = byId('viewport').getBoundingClientRect();
    const x2 = (ev.clientX - rect.left - state.pan.x) / state.zoom;
    const y2 = (ev.clientY - rect.top - state.pan.y) / state.zoom;
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
  }

  function onUp(ev: PointerEvent): void {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    ui.tempWire = null;

    const targetCard = ev.target instanceof Element
      ? ev.target.closest<HTMLElement>('[data-node-id]')
      : null;
    if (targetCard?.dataset.nodeId) {
      createConnection(fromNodeId, targetCard.dataset.nodeId);
    }
    renderWires();
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

export function handleConnectModeClick(nodeId: string): void {
  if (!ui.pendingConnectFrom) {
    ui.pendingConnectFrom = nodeId;
    showToast('Теперь нажмите на вторую ноду для соединения');
  } else if (ui.pendingConnectFrom !== nodeId) {
    createConnection(ui.pendingConnectFrom, nodeId);
    ui.pendingConnectFrom = null;
    toggleConnectMode(false);
  }
}

export function createConnection(fromId: string, toId: string): void {
  if (fromId === toId) return;
  const exists = state.connections.some(
    c => c.date === state.selectedDate &&
    ((c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))
  );
  if (!exists) {
    state.connections.push({
      id: uid('conn'),
      date: state.selectedDate,
      from: fromId,
      to: toId,
    });
    saveState();
    renderWires();
    showToast('Ноды соединены');
  }
}

export function toggleConnectMode(forceState: boolean | null = null): void {
  ui.connectMode = forceState !== null ? forceState : !ui.connectMode;
  ui.pendingConnectFrom = null;
  const btn = byId('connect-mode-btn');
  btn.classList.toggle('active', ui.connectMode);
  document.body.classList.toggle('connect-mode', ui.connectMode);
  if (ui.connectMode) {
    showToast('Режим связи: выберите первую ноду');
  }
}
