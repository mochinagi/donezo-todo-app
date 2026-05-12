import clsx from "clsx";

function Skeleton({
    className,
}: {
    className?: string;
}) {
    return (
        <div
            aria-hidden="true"
            className={clsx(
                "relative overflow-hidden rounded-md bg-zinc-200/80 dark:bg-zinc-800/80",
                "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
                "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:before:via-white/10",
                "motion-reduce:before:animate-none",
                className
            )}
        />
    );
}

const rows = [
    {
        title: "w-[72%]",
        meta: "w-24",
    },
    {
        title: "w-[48%]",
        meta: "w-16",
    },
    {
        title: "w-[64%]",
        meta: "w-20",
    },
    {
        title: "w-[58%]",
        meta: "w-14",
    },
    {
        title: "w-[80%]",
        meta: "w-28",
    },
];

export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6"
        >
            <section className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                    <Skeleton className="h-7 w-40 rounded-lg" />

                    <Skeleton className="h-4 w-60" />
                </div>

                <Skeleton className="h-10 w-28 rounded-xl" />
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
                    <div className="flex gap-3">
                        <Skeleton className="h-11 flex-1 rounded-xl" />

                        <Skeleton className="h-11 w-24 rounded-xl" />
                    </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rows.map(
                        (
                            row,
                            index
                        ) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 px-5 py-4"
                            >
                                <Skeleton className="h-5 w-5 rounded-full" />

                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton
                                        className={clsx(
                                            "h-4",
                                            row.title
                                        )}
                                    />

                                    <Skeleton
                                        className={clsx(
                                            "h-3",
                                            row.meta
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-lg" />

                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </div>
                        )
                    )}
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
                タスクを読み込み中
            </span>
        </div>
    );
}