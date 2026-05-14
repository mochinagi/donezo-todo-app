import clsx from "clsx";

const shimmerClassName = clsx(
    "before:absolute",
    "before:inset-0",
    "before:-translate-x-full",
    "before:animate-[shimmer_1.8s_infinite]",
    "before:bg-gradient-to-r",
    "before:from-transparent",
    "before:via-white/40",
    "before:to-transparent",
    "dark:before:via-white/10",
    "motion-reduce:before:animate-none"
);

const loadingRows = [
    {
        title: "w-[74%]",
        meta: "w-24",
    },
    {
        title: "w-[58%]",
        meta: "w-16",
    },
    {
        title: "w-[66%]",
        meta: "w-20",
    },
    {
        title: "w-[49%]",
        meta: "w-28",
    },
    {
        title: "w-[71%]",
        meta: "w-16",
    },
    {
        title: "w-[62%]",
        meta: "w-24",
    },
];

type SkeletonProps = {
    className?: string;
};

function Skeleton({
    className,
}: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={clsx(
                "relative overflow-hidden rounded-md",
                "bg-zinc-200/80 dark:bg-zinc-800/80",
                "animate-pulse",
                shimmerClassName,
                className
            )}
        />
    );
}

function HeaderSkeleton() {
    return (
        <section className="flex items-start justify-between gap-4">
            <div className="space-y-3">
                <Skeleton className="h-8 w-44 rounded-xl" />

                <Skeleton className="h-4 w-64" />
            </div>

            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-20 rounded-xl" />

                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
        </section>
    );
}

function StatsSkeleton() {
    return (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({
                length: 4,
            }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <Skeleton className="h-4 w-16" />

                    <Skeleton className="mt-3 h-8 w-10 rounded-lg" />
                </div>
            ))}
        </section>
    );
}

function ToolbarSkeleton() {
    return (
        <section className="border-b border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row">
                <Skeleton className="h-11 flex-1 rounded-xl" />

                <div className="flex gap-3">
                    <Skeleton className="h-11 w-24 rounded-xl" />

                    <Skeleton className="h-11 w-28 rounded-xl" />
                </div>
            </div>
        </section>
    );
}

function ListSkeleton() {
    return (
        <section className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loadingRows.map(
                (row, index) => (
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
        </section>
    );
}

function FooterSkeleton() {
    return (
        <footer className="flex items-center justify-between border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <Skeleton className="h-4 w-28" />

            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />

                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
        </footer>
    );
}

export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
        >
            <HeaderSkeleton />

            <StatsSkeleton />

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <ToolbarSkeleton />

                <ListSkeleton />

                <FooterSkeleton />
            </section>

            <span className="sr-only">
                Loading tasks
            </span>
        </div>
    );
}