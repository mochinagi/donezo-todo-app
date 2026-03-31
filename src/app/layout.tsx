"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
import { useMemo } from "react";

/**
 * カテゴリ定義（将来は共通ファイルに分離OK）
 */
const categoryMap: Record<string, { name: string; description: string }> = {
  myday: {
    name: "マイデイ",
    description: "今日やるべきタスクに集中しましょう",
  },
  important: {
    name: "重要",
    description: "重要なタスクを優先的に処理しましょう",
  },
  planned: {
    name: "予定あり",
    description: "スケジュールに基づいたタスク",
  },
  tasks: {
    name: "すべてのタスク",
    description: "すべてのタスク一覧",
  },
};

/**
 * Header
 */
export default function Header() {
  const { activeCategory, search, setSearch } = useTodoStore();

  /**
   * 現在カテゴリ情報
   */
  const category = useMemo(() => {
    return categoryMap[activeCategory] ?? {
      name: "タスク",
      description: "",
    };
  }, [activeCategory]);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b 
        bg-white dark:bg-gray-900 dark:border-gray-700">

      {/* 左：タイトル */}
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {category.name}
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {category.description}
        </p>
      </div>

      {/* 右：操作エリア */}
      <div className="flex items-center gap-4">

        {/* 検索 */}
        <div
          role="search"
          className="relative w-72"
        >
          <Input
            placeholder="タスクを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 focus:ring-2 focus:ring-blue-400
                        dark:bg-gray-800 dark:border-gray-700"
            aria-label="タスク検索"
          />

          {/* 検索アイコン */}
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />

          {/* クリア */}
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 
                            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                            transition"
              aria-label="検索をクリア"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ユーザー */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 hidden sm:block">
            Hello 👋
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
            U
          </div>
        </div>
      </div>
    </header>
  );
}