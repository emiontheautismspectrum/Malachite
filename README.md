# Malachite

Node-based daily planner on an emerald pegboard. Tasks are cards you drag around a pegboard, group into category zones, link with wires and attach to cross-day projects.

## Features

- Day-by-day boards with a date strip and date picker
- Task nodes: time range, category, project, notes, done state, move to yesterday/tomorrow
- Magnetic category zones (drag, resize; nodes inside move with the zone)
- Cross-day projects with checklist and progress across all days
- Wires between nodes (drag from a port, or use link mode); click a wire to delete it
- Pan and zoom, 24px grid snapping, dark and light themes
- Undo toasts for deletions and moves
- JSON export/import; everything is stored in `localStorage`

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build     # type-check + production build into dist/
npm run preview
```

```bash
npm run build:single   # one self-contained dist-single/index.html, opens via double click (file://)
```

The build uses a relative base, so `dist/` can be served from any path (for example GitHub Pages).

## Project structure

```
src/
  main.ts         entry point
  types.ts        data model
  store.ts        state, persistence, defaults
  render.ts       full re-render
  view.ts         theme, canvas transform, date strip
  nodes.ts        task cards
  projects.ts     project hubs
  zones.ts        category zones
  wires.ts        links between nodes
  modals.ts       categories modal
  events.ts       static UI and canvas events
  styles.css      theme variables and component styles
```

## Data

State is saved in `localStorage` under `malachite_state_v1`.
