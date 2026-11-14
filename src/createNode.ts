import { saveState, snap, state, ui } from './store';
import { uid } from './utils';
import { renderAll } from './render';

/** Create a new node at the given canvas (world) coordinates and open it for editing. */
export function createNodeAt(worldX: number, worldY: number): void {
  const newNode = {
    id: uid('node'),
    date: state.selectedDate,
    title: 'Новая задача',
    startTime: '',
    endTime: '',
    categoryId: state.categories[0]?.id || '',
    projectId: null,
    notes: '',
    done: false,
    x: Math.max(0, snap(worldX)),
    y: Math.max(0, snap(worldY)),
  };
  state.nodes.push(newNode);
  ui.expandedNodeId = newNode.id;
  saveState();
  renderAll();
}
