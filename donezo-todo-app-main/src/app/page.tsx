// Tell Next.js this code is client-side only, not server-side rendered / Next.jsにこのコードはクライアント側のみで、サーバーサイドレンダリングではないことを伝える
"use client";

// Import custom Hook to manage todo state and logic / カスタムフックをインポート、todoの状態とロジックを管理するため
import { useTodoState } from "@/hooks/useTodoState";

// Import Sidebar component that displays category buttons / カテゴリーのボタンを表示するSidebarコンポーネントをインポート
import Sidebar from "@/components/Sidebar";

// Import Header component, includes search box and category title / 検索ボックスとカテゴリータイトルを含むHeaderコンポーネントをインポート
import Header from "@/components/Header";

// Import AddTodo component with input and add button / 入力欄と追加ボタンを持つAddTodoコンポーネントをインポート
import AddTodo from "@/components/AddTodo";

// Import TodoList component that shows multiple todo cards / 複数のタスクカードを表示するTodoListコンポーネントをインポート
import TodoList from "@/components/TodoList";

// Import Footer component showing total/completed count and clear completed button / 総数・完了数と完了済みクリアボタンを表示するFooterコンポーネントをインポート
import Footer from "@/components/Footer";

export default function Home() {
  // Destructure all needed states and functions from custom Hook / カスタムフックから必要な状態と関数をすべて分解代入
  const {
    todos,                // All todo items / すべてのタスク一覧
    input, setInput,      // Input value for adding todo and its setter / タスク追加用の入力値と更新関数
    search, setSearch,    // Search input value and setter / 検索用の入力値と更新関数
    activeCategory,       // Currently selected category (e.g. My Day, Important, All) / 現在選択中のカテゴリー（例：マイデイ、重要、すべて）
    setActiveCategory,    // Function to change selected category / 選択カテゴリーを切り替える関数
    filteredTodos,        // List of todos filtered by search or category / 検索またはカテゴリーでフィルターされたタスクリスト
    addTodo,              // Function to add a new todo / 新しいタスクを追加する関数
    toggleTodo,           // Function to toggle task completion status / タスクの完了状態を切り替える関数
    deleteTodo,           // Function to delete a todo / タスクを削除する関数
    clearCompleted        // Function to clear completed tasks / 完了済みタスクをクリアする関数
  } = useTodoState();

  // Calculate number of completed tasks / 完了したタスクの数を計算
  const completedCount = todos.filter(t => t.completed).length;

  return (
    // Overall page container: flex layout with sidebar and main content area / ページ全体のコンテナ：サイドバーとメインコンテンツをflexレイアウトで配置
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">

      {/* Left category sidebar / 左側のカテゴリーサイドバー */}
      <Sidebar
        active={activeCategory}             // Currently selected category / 現在選択中のカテゴリー
        onChange={setActiveCategory}        // Callback when category changes / カテゴリーが切り替わった時に呼ばれる関数
      />

      {/* Right main content area / 右側のメインコンテンツエリア */}
      <main className="flex-1 flex flex-col">

        {/* Top search box and current category title / 上部の検索ボックスと現在のカテゴリータイトル */}
        <Header
          categoryId={activeCategory}       // Current category ID for title display / タイトル表示用の現在のカテゴリーID
          search={search}                   // Current value of the search input / 検索入力欄の現在の値
          onSearchChange={setSearch}        // Handler for search input changes / 検索入力が変わったときの処理関数
        />

        {/* Input box and "Add" button for adding new todos / 新しいタスクを追加するための入力欄と「追加」ボタン */}
        <AddTodo
          input={input}                     // Current input text for new todo / 新規タスクの入力テキスト
          setInput={setInput}               // Function to update input text / 入力テキストを更新する関数
          onAdd={addTodo}                   // Called when "Add" button is clicked / 「追加」ボタンが押された時に呼ばれる関数
        />

        {/* Todo list area displaying all filtered todos / フィルターされたすべてのタスクを表示するリストエリア */}
        <TodoList
          todos={filteredTodos}             // Currently displayed todos / 現在表示中のタスク一覧
          onToggle={toggleTodo}             // Toggle completion status when checking a task / タスクの完了状態を切り替える関数
          onDelete={deleteTodo}             // Delete a task / タスクを削除する関数
        />

        {/* Footer bar showing total count, completed count and clear completed button / 総数、完了数、「完了済みクリア」ボタンを表示するフッター */}
        <Footer
          total={todos.length}              // Total number of tasks / 全タスクの数
          completed={completedCount}        // Number of completed tasks / 完了したタスクの数
          onClearCompleted={clearCompleted} // Called when "Clear Completed" button is clicked / 「完了済みをクリア」ボタンが押された時に呼ばれる関数
        />
      </main>
    </div>
  );
}
