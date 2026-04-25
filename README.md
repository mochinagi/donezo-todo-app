# Donezo Todo App

A production-oriented Todo application built with Next.js, focusing on state management, interaction design, and scalable UI architecture.

## Demo

Local: http://localhost:3000

---

## Features

### Core
- Add / edit / delete tasks
- Toggle completion
- Drag & drop reordering (dnd-kit)

### Productivity
- Undo / redo (action stack based)
- Bulk actions (clear completed, multi-add via paste)
- Keyboard support (Enter, Ctrl/Cmd + Enter, Escape)

### Filtering & Search
- Filter (all / active / completed)
- Real-time search

### UX Improvements
- Inline editing with auto-save
- Validation (duplicate / max length)
- Toast notification system (wrapped sonner)
- Optimistic UI interactions

### Persistence
- LocalStorage persistence (zustand persist)
- Versioned state migration

---

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Zustand (state management)
- dnd-kit (drag and drop)
- Tailwind CSS
- Sonner (toast notifications)

---

## Architecture

### State Management
- Zustand store with action-based undo/redo
- Separation of applyAction / revertAction
- Derived state via selectors

### UI Layer
- Reusable UI components (Input, Button, Toast)
- Controlled + composable components
- Accessibility-aware design

### Interaction Design
- Keyboard-first UX
- Debounced persistence
- Batch operations support

---

## Project Structure
src/
app/ # Next.js pages
components/ # UI + feature components
hooks/ # Custom hooks
store/ # Zustand store
lib/ # utilities


---

## Getting Started

```bash
npm install
npm run dev
Future Improvements
Task deadline / priority system
Tag / project grouping
Backend integration (API + DB)
Authentication
Sync across devices
Why this project

This project focuses on:

Building a scalable state management pattern
Designing reusable UI components
Improving real-world UX (not just demo features)
Notes

This is not a basic todo app.
It is designed as a small-scale application to demonstrate:

state architecture
interaction design
frontend engineering practices