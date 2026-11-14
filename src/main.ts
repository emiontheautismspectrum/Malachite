import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles.css';

import { bindEvents } from './events';
import { renderAll } from './render';

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  renderAll();
});
