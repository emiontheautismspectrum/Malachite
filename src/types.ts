export type ThemeName = 'dark' | 'light';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

/** Cross-day "hub" project, visible on every day. */
export interface Project {
  id: string;
  title: string;
  color: string;
  description: string;
  x: number;
  y: number;
  collapsed: boolean;
  checklist: ChecklistItem[];
}

/** Category container placed on the board of a specific day. */
export interface Zone {
  id: string;
  date: string;
  categoryId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Task card. Named BoardNode to avoid clashing with the DOM `Node` type. */
export interface BoardNode {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  projectId: string | null;
  notes: string;
  done: boolean;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  date: string;
  from: string;
  to: string;
}

export interface AppState {
  theme: ThemeName;
  snapToGrid: boolean;
  selectedDate: string;
  pan: { x: number; y: number };
  zoom: number;
  categories: Category[];
  projects: Project[];
  zones: Zone[];
  nodes: BoardNode[];
  connections: Connection[];
}

/** Transient UI state, never persisted. */
export interface UiState {
  expandedNodeId: string | null;
  connectMode: boolean;
  pendingConnectFrom: string | null;
  tempWire: SVGPathElement | null;
}
