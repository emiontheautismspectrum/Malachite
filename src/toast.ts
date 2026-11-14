import { byId } from './utils';

let undoTimer: ReturnType<typeof setTimeout> | undefined;

/** Toast with an optional "Undo" action. */
export function showToast(message: string, undoCallback: (() => void) | null = null): void {
  const box = byId('toast-box');
  const msgEl = byId('toast-message');
  const undoBtn = byId<HTMLButtonElement>('toast-undo-btn');

  msgEl.textContent = message;
  box.classList.remove('hidden');
  box.classList.add('flex');

  if (undoCallback) {
    undoBtn.classList.remove('hidden');
    undoBtn.onclick = () => {
      undoCallback();
      hideToast();
    };
  } else {
    undoBtn.classList.add('hidden');
    undoBtn.onclick = null;
  }

  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideToast, undoCallback ? 5000 : 2800);
}

export function hideToast(): void {
  const box = byId('toast-box');
  box.classList.add('hidden');
  box.classList.remove('flex');
}
