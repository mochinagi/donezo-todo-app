"use client";

import { useCallback } from "react";
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
import { shallow } from "zustand/shallow";

export default function Home() {
  /* ---------------- store ---------------- */

  const { addTodo, search, setSearch } = useTodoStore(
    (s) => ({
      addTodo: s.addTodo,
      search: s.search,
      setSearch: s.setSearch,
    }),
    shallow
  );

  const filteredTodos = useFilteredTodos();
  const stats = useTodoStats();

  /* ---------------- handlers ---------------- */

  const handleAdd = useCallback(
    (text: string) => {
      addTodo(text);
    },
    [addTodo]
  );

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <Header
          categoryId="tasks"
          search={search}
          onSearchChange={setSearch}
          total={filteredTodos.length}
        />

        {/* Add */}
        <AddTodo onAdd={handleAdd} />

        {/* List */}
        <section className="flex-1 overflow-y-auto">
          <TodoList />
        </section>

        {/* Footer */}
        <Footer
          total={stats.total}
          completed={stats.completed}
        />

      </main>
    </div>
  );
}