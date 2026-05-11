function Skeleton({
    className,
}: {
    className?: string;
}) {
    return (
        <div
            className={[
                "animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80",
                className,
            ].join(" ")}
        />
    );
}

const ITEMS = 5;

export default function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
            <section className="flex items-center justify-between">
                <div className="space-y-3">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>

                <Skeleton className="h-10 w-28 rounded-xl" />
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
                    <div className="flex gap-3">
                        <Skeleton className="h-11 flex-1 rounded-xl" />
                        <Skeleton className="h-11 w-24 rounded-xl" />
                    </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {Array.from({
                        length: ITEMS,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 px-5 py-4"
                        >
                            <Skeleton className="h-5 w-5 rounded-full" />

                            <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton
                                    className={[
                                        "h-4",
                                        index % 2 ===
                                            0
                                            ? "w-2/3"
                                            : "w-1/2",
                                    ].join(
                                        " "
                                    )}
                                />

                                <Skeleton
                                    className={[
                                        "h-3",
                                        index % 2 ===
                                            0
                                            ? "w-24"
                                            : "w-16",
                                    ].join(
                                        " "
                                    )}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                    <Skeleton className="h-4 w-28" />

                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
            </section>

            <span className="sr-only">
                Loading tasks
            </span>
        </div>
    );
}