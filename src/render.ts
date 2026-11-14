import { applyCanvasTransform, applyTheme, renderDateStrip } from './view';
import { renderZones } from './zones';
import { renderProjects } from './projects';
import { renderNodes } from './nodes';
import { renderWires } from './wires';

export function renderAll(): void {
  applyTheme();
  applyCanvasTransform();
  renderDateStrip();
  renderZones();
  renderProjects();
  renderNodes();
  renderWires();
}
