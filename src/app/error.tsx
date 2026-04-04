"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <h2 className="text-xl font-semibold text-red-500">
                エラーが発生しました 😢
            </h2>

            <p className="text-gray-500 text-sm">
                {error.message}
            </p>

            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                再試行
            </button>
        </div>
    );
}