"use client";

import { useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AddTodo from "@/components/AddTodo";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";
import { useTodoStore } from "@/store/todoStore";
import { shallow } from "zustand/shallow";

export default function Home() {
  // 只取必要状态（避免多余 render）
  const { todos } = useTodoStore(
    (s) => ({
      todos: s.todos,
    }),
    shallow
  );

  // 派生状态
  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos]
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col">

        <Header />

        <AddTodo />

        <TodoList />

        <Footer
          total={todos.length}
          completed={completedCount}
        />

      </main>
    </div>
  );
}