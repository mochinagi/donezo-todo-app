"use client";

import { useCallback } from "react";
import { shallow } from "zustand/shallow";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AddTodo from "@/components/AddTodo";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";

import {
  useTodoStore,
  useFilteredTodos,
  useTodoStats,
} from "@/store/todoStore";

export default function Home() {
  const { addTodo, search, setSearch } = useTodoStore(
    s => ({
      addTodo: s.addTodo,
      search: s.search,
      setSearch: s.setSearch,
    }),
    shallow
  );

  const filteredTodos = useFilteredTodos();
  const stats = useTodoStats();

  const handleAdd = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      addTodo(trimmed);
    },
    [addTodo]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
    },
    [setSearch]
  );

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
      <Sidebar />

      <main
        role="main"
        aria-label="Todo workspace"
        className="flex flex-1 flex-col"
      >
        <Header
          categoryId="tasks"
          search={search}
          onSearchChange={handleSearchChange}
          total={filteredTodos.length}
        />

        <section aria-label="Add todo input">
          <AddTodo onAdd={handleAdd} />
        </section>

        <section
          aria-label="Todo list"
          className="flex-1 overflow-y-auto"
        >
          <TodoList />
        </section>

        <Footer
          total={stats.total}
          completed={stats.completed}
        />
      </main>
    </div>
  );
}