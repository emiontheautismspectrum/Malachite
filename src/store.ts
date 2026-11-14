import type { AppState, UiState } from './types';
import { addDays, formatDateISO } from './utils';

export const STORAGE_KEY = 'malachite_state_v1';
/** Key used by the original single-file prototype; read once for migration. */
const LEGACY_STORAGE_KEY = 'emerald_pegboard_state_v2';
export const GRID_SIZE = 24;

export const TODAY_ISO = formatDateISO(new Date());
export const TOMORROW_ISO = addDays(TODAY_ISO, 1);

export function createDefaultState(): AppState {
  const catProj = { id: 'cat_proj', name: 'Проекты', color: '#a3e635' };
  const catWork = { id: 'cat_work', name: 'Работа', color: '#38bdf8' };
  const catIdeas = { id: 'cat_ideas', name: 'Идеи', color: '#f59e0b' };

  return {
    theme: 'dark',
    snapToGrid: true,
    selectedDate: TODAY_ISO,
    pan: { x: 0, y: 0 },
    zoom: 1,
    categories: [catProj, catWork, catIdeas],
    // Cross-day project hubs, visible on every day
    projects: [
      {
        id: 'proj_board',
        title: 'Malachite — Нодовый планировщик',
        color: '#a3e635',
        description: 'Разработка визуальной доски-пегборда с проектами, зонами и связями по дням.',
        x: 72,
        y: 72,
        collapsed: false,
        checklist: [
          { id: 'chk_1', text: 'Чистый изумрудный пегборд без лишнего шума', done: true },
          { id: 'chk_2', text: 'Сквозные мастер-проекты по всем дням', done: true },
          { id: 'chk_3', text: 'Проверить перенос задач на вчера/завтра', done: false },
        ],
      },
    ],
    // Zones are bound to a specific date
    zones: [
      { id: 'zone_1', date: TODAY_ISO, categoryId: 'cat_work', x: 456, y: 72, width: 360, height: 432 },
      { id: 'zone_2', date: TODAY_ISO, categoryId: 'cat_ideas', x: 864, y: 72, width: 312, height: 336 },
    ],
    // Tasks per day
    nodes: [
      {
        id: 'node_1',
        date: TODAY_ISO,
        title: 'Собрать прототип каркаса доски',
        startTime: '10:00',
        endTime: '11:30',
        categoryId: 'cat_proj',
        projectId: 'proj_board',
        notes: 'Проверить сетку 24px, плавное перетаскивание и сохранение в localStorage.',
        done: true,
        x: 96,
        y: 480,
      },
      {
        id: 'node_2',
        date: TODAY_ISO,
        title: 'Синхронизация с командой по спринту',
        startTime: '12:00',
        endTime: '12:45',
        categoryId: 'cat_work',
        projectId: null,
        notes: 'Обсудить приоритеты на текущую неделю.',
        done: false,
        x: 480,
        y: 144,
      },
      {
        id: 'node_3',
        date: TODAY_ISO,
        title: 'Настроить связи между карточками',
        startTime: '14:00',
        endTime: '15:30',
        categoryId: 'cat_work',
        projectId: 'proj_board',
        notes: 'Кривые Безье и быстрое удаление при клике на линию.',
        done: false,
        x: 480,
        y: 288,
      },
      {
        id: 'node_4',
        date: TODAY_ISO,
        title: 'Горячие клавиши для быстрого создания',
        startTime: '',
        endTime: '',
        categoryId: 'cat_ideas',
        projectId: null,
        notes: 'Добавить шорткаты N и P когда фокус вне поля ввода.',
        done: false,
        x: 888,
        y: 144,
      },
      {
        id: 'node_5',
        date: TOMORROW_ISO,
        title: 'Финальное тестирование светлой темы',
        startTime: '11:00',
        endTime: '12:00',
        categoryId: 'cat_proj',
        projectId: 'proj_board',
        notes: 'Проверить контраст на мобильных экранах.',
        done: false,
        x: 456,
        y: 120,
      },
    ],
    // Links between nodes of the same day
    connections: [{ id: 'conn_1', date: TODAY_ISO, from: 'node_2', to: 'node_3' }],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...createDefaultState(), ...parsed };
  } catch (e) {
    console.error('Ошибка чтения состояния:', e);
    return createDefaultState();
  }
}

/** Single shared state object. Replace contents via replaceState(), never reassign. */
export const state: AppState = loadState();

export function replaceState(next: AppState): void {
  Object.assign(state, next);
}

export const ui: UiState = {
  expandedNodeId: null,
  connectMode: false,
  pendingConnectFrom: null,
  tempWire: null,
};

export function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

export function snap(val: number): number {
  if (!state.snapToGrid) return Math.round(val);
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}
