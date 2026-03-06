export const TaskSkeletonList = () => {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={idx}
                    className="h-24 w-full animate-pulse rounded-2xl bg-slate-100"
                />
            ))}
        </div>
    );
};
