"use client";

import { useMemo, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AddTodo from "@/components/AddTodo";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";
import { useTodoStore } from "@/store/todoStore";
import { shallow } from "zustand/shallow";

export default function Home() {
  /* ---------------- store ---------------- */
  const { todos, addTodo } = useTodoStore(
    (s) => ({
      todos: s.todos,
      addTodo: s.addTodo,
    }),
    shallow
  );

  /* ---------------- local state ---------------- */
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");

  /* ---------------- derived ---------------- */
  const completedCount = useMemo(() => {
    let count = 0;
    for (const t of todos) {
      if (t.completed) count++;
    }
    return count;
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (!search.trim()) return todos;

    const lower = search.toLowerCase();
    return todos.filter((t) =>
      t.text.toLowerCase().includes(lower)
    );
  }, [todos, search]);

  /* ---------------- handlers ---------------- */
  const handleAdd = useCallback(
    async (text: string) => {
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
        <AddTodo
          input={input}
          setInput={setInput}
          onAdd={handleAdd}
        />

        {/* List */}
        <section className="flex-1 overflow-y-auto">
          <TodoList />
        </section>

        {/* Footer */}
        <Footer
          total={todos.length}
          completed={completedCount}
        />

      </main>
    </div>
  );
}