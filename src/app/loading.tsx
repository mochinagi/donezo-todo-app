export default function Loading() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse space-y-4 w-full max-w-md">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
        </div>
    );
}