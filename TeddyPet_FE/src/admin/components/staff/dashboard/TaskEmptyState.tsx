interface Props {
    title: string;
    description: string;
}

export const TaskEmptyState = ({ title, description }: Props) => {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-emerald-50" />
            <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    );
};

