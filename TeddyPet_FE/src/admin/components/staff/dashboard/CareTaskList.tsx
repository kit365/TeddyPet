import type { CareTask } from "../../../types/employeeDashboard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskSkeletonList } from "./TaskSkeletonList";

interface Props {
    tasks: CareTask[];
    loading?: boolean;
    onStart: (taskId: number | string) => void;
    onFinish: (taskId: number | string) => void;
}

export const CareTaskList = ({ tasks, loading, onStart, onFinish }: Props) => {
    if (loading) return <TaskSkeletonList />;

    if (!tasks.length) {
        return (
            <TaskEmptyState
                title="Hôm nay chưa có nhiệm vụ chăm sóc"
                description="Khi có lịch cho ăn, dọn chuồng hoặc chăm sóc khác, nhiệm vụ sẽ hiển thị tại đây."
            />
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                            <p className="text-xs text-slate-500">Chuồng {task.cageNumber}</p>
                        </div>
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                task.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-sky-50 text-sky-700"
                                    : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                            {task.status === "PENDING"
                                ? "Chờ thực hiện"
                                : task.status === "IN_PROGRESS"
                                ? "Đang dọn"
                                : "Hoàn thành"}
                        </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Thú cưng
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                            {task.petName} • {task.petSpecies}
                        </p>
                        {task.description && (
                            <p className="mt-1 text-xs text-slate-500">
                                {task.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500">
                            {task.startedAt && (
                                <p>
                                    Bắt đầu: {new Date(task.startedAt).toLocaleTimeString()}
                                </p>
                            )}
                            {task.finishedAt && (
                                <p>
                                    Kết thúc: {new Date(task.finishedAt).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {task.status === "PENDING" && (
                                <button
                                    onClick={() => onStart(task.id)}
                                    className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Bắt đầu dọn
                                </button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                                <button
                                    onClick={() => onFinish(task.id)}
                                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Kết thúc
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

