# Donezo Todo App

A Todo application built with Next.js, focused on state architecture, interaction design, and real-world frontend patterns.

This is not a minimal demo. The project is designed to explore how a small application can be structured like a scalable product.

---

## Overview

Donezo is a task management app with:

- Action-based state management (undo / redo)
- Optimistic UI updates
- Structured API layer with retry and caching
- Custom toast system with lifecycle control

The goal is to simulate real frontend engineering concerns rather than just implementing features.

---

## Features

### Task Management
- Create, edit, delete tasks
- Toggle completion
- Drag & drop reordering (dnd-kit)

### Interaction
- Undo / redo with action stack
- Inline editing (auto-save)
- Keyboard support (Enter, Escape)

### Filtering
- All / Active / Completed
- Real-time search

### Feedback System
- Toast abstraction layer (based on sonner)
- Loading / success / error flows
- Action-based notifications

### Persistence
- Zustand + localStorage
- Versioned state migration

---

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Zustand
- dnd-kit
- Tailwind CSS
- Sonner

---

## Architecture

### State (Zustand)
- Centralized store
- Action-driven updates
- Undo / redo via reversible actions
- Derived state through selectors

### API Layer
- Fetch wrapper with:
  - retry strategy (5xx only)
  - request deduplication
  - simple caching
- Mock layer for local development

### UI
- Component-driven structure
- Controlled inputs
- Separation of logic and presentation

### UX Design
- Keyboard-first interactions
- Optimistic updates
- Debounced persistence

---

## Project Structure

src/
  app/           # Next.js app router
  components/    # UI and feature components
  hooks/         # custom hooks
  store/         # Zustand store
  lib/           # API / utilities

---

## Getting Started

```bash
npm install
npm run dev
Open http://localhost:3000

Environment
NEXT_PUBLIC_USE_MOCK=true
true → use local mock API
false → use real backend (if implemented)

Future Improvements
Task priority / deadline
Tag or project grouping
Backend integration (API + database)
Authentication
Multi-device sync
Notes

This project focuses on:

building a maintainable state model
designing predictable UI interactions
structuring frontend code for scalability

It is intentionally built beyond a basic todo app to reflect real development patterns.