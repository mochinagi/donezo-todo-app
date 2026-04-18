export default function Loading() {
    return (
        <div
            className="flex items-center justify-center h-full px-4"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="w-full max-w-md space-y-6">

                {/* 标题 skeleton */}
                <div className="h-8 w-1/3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />

                {/* 列表 skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800"
                        >
                            {/* checkbox */}
                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />

                            {/* text */}
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
                            </div>

                            {/* delete icon */}
                            <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* footer skeleton */}
                <div className="flex justify-between">
                    <div className="h-4 w-16 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    <div className="h-4 w-20 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                </div>
            </div>

            {/* 屏幕阅读器文本 */}
            <span className="sr-only">Loading todos...</span>
        </div>
    );
}