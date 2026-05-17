"use client";

import { useMemo } from "react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AddTodo from "@/components/AddTodo";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";

import {
  useFilteredTodos,
  useTodoStats,
  useTodoStore,
} from "@/store/todoStore";

export default function Home() {
  const hydrated = useTodoStore(
    s => s.hydrated
  );

  const addTodo = useTodoStore(
    s => s.addTodo
  );

  const search = useTodoStore(
    s => s.search
  );

  const setSearch = useTodoStore(
    s => s.setSearch
  );

  const filteredTodos =
    useFilteredTodos();

  const stats =
    useTodoStats();

  const completedRate =
    useMemo(() => {
      if (!stats.total) {
        return 0;
      }

      return Math.round(
        (stats.completed /
          stats.total) *
        100
      );
    }, [
      stats.completed,
      stats.total,
    ]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden border-r lg:block">
        <Sidebar />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          categoryId="tasks"
          search={search}
          onSearchChange={
            setSearch
          }
          total={
            filteredTodos.length
          }
        />

        <div className="border-b px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Tasks
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {stats.active} active ·{" "}
                {stats.completed} completed
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-muted-foreground">
                  Total
                </div>

                <div className="mt-1 font-medium">
                  {
                    stats.total
                  }
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Progress
                </div>

                <div className="mt-1 font-medium">
                  {
                    completedRate
                  }
                  %
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Overdue
                </div>

                <div className="mt-1 font-medium text-red-500">
                  {
                    stats.overdue
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b px-6 py-4">
          <AddTodo
            onAdd={addTodo}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredTodos.length ===
            0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="w-full max-w-md rounded-xl border border-dashed p-10 text-center">
                <div className="text-base font-medium">
                  No matching tasks
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting
                  your search or
                  create a new
                  task.
                </p>
              </div>
            </div>
          ) : (
            <TodoList />
          )}
        </div>

        <Footer
          total={stats.total}
          completed={
            stats.completed
          }
        />
      </main>
    </div>
  );
}