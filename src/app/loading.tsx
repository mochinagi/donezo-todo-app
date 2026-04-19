export default function Loading() {
    const SKELETON_ITEMS = 4;

    const Skeleton = ({ className = "" }: { className?: string }) => (
        <div
            className={`rounded bg-gray-300 dark:bg-gray-700 animate-pulse motion-safe:animate-pulse ${className}`}
        />
    );

    return (
        <div
            className="flex items-center justify-center min-h-[60vh] px-4"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Loading content"
        >
            <div className="w-full max-w-md space-y-6">

                {/* 标题 skeleton */}
                <Skeleton className="h-8 w-1/3" />

                {/* 列表 skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: SKELETON_ITEMS }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800"
                        >
                            {/* checkbox */}
                            <Skeleton className="w-5 h-5 rounded-full" />

                            {/* text */}
                            <div className="flex-1 space-y-2">
                                <Skeleton
                                    className={`h-4 ${i % 2 === 0 ? "w-3/4" : "w-2/3"
                                        }`}
                                />
                                <Skeleton
                                    className={`h-3 ${i % 2 === 0 ? "w-1/2" : "w-1/3"
                                        } bg-gray-200 dark:bg-gray-600`}
                                />
                            </div>

                            {/* delete icon */}
                            <Skeleton className="w-4 h-4" />
                        </div>
                    ))}
                </div>

                {/* footer skeleton */}
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            {/* 屏幕阅读器文本 */}
            <span className="sr-only">Loading todos...</span>
        </div>
    );
}