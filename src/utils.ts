// ---------- Dates ----------

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(isoStr: string, delta: number): string {
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return formatDateISO(dt);
}

export function formatShortRuDate(isoStr: string): string {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const [, m, d] = isoStr.split('-').map(Number);
  return `${d} ${months[m - 1]}`;
}

export function formatWeekdayRu(isoStr: string, todayIso: string): string {
  if (isoStr === todayIso) return 'Сегодня';
  if (isoStr === addDays(todayIso, -1)) return 'Вчера';
  if (isoStr === addDays(todayIso, 1)) return 'Завтра';
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const [y, m, d] = isoStr.split('-').map(Number);
  return days[new Date(y, m - 1, d).getDay()];
}

// ---------- Ids & escaping ----------

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str: unknown): string {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

// ---------- DOM helpers ----------

export function byId<T extends Element = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as unknown as T;
}

export function qs<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

export function targetEl(e: Event): Element | null {
  return e.target instanceof Element ? e.target : null;
}
