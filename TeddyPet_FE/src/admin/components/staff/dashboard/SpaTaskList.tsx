import type { SpaTask } from "../../../types/employeeDashboard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskSkeletonList } from "./TaskSkeletonList";

interface Props {
    tasks: SpaTask[];
    loading?: boolean;
    onStart: (taskId: number | string) => void;
    onFinish: (taskId: number | string) => void;
}

const formatService = (service: SpaTask["serviceType"]) => {
    switch (service) {
        case "SHOWER":
            return "Tắm";
        case "HAIRCUT":
            return "Cắt tỉa lông";
        case "NAIL":
            return "Cắt móng";
        default:
            return "Combo Spa";
    }
};

export const SpaTaskList = ({ tasks, loading, onStart, onFinish }: Props) => {
    if (loading) return <TaskSkeletonList />;

    if (!tasks.length) {
        return (
            <TaskEmptyState
                title="Hôm nay chưa có lịch Spa"
                description="Khi khách đặt lịch Spa trong ngày, ca của bạn sẽ hiển thị tại đây."
            />
        );
    }

    const sorted = [...tasks].sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));

    return (
        <div className="flex flex-col gap-3">
            {sorted.map((task) => (
                <div
                    key={task.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                    <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {new Date(task.bookingTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            • {task.durationMinutes} phút
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                            {task.petName} • {task.petSpecies}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-emerald-700">
                            {formatService(task.serviceType)}
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                task.status === "PENDING"
                                    ? "bg-slate-100 text-slate-600"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                            {task.status === "PENDING"
                                ? "Chưa bắt đầu"
                                : task.status === "IN_PROGRESS"
                                ? "Đang thực hiện"
                                : "Đã hoàn thành"}
                        </span>

                        <div className="flex gap-2">
                            {task.status === "PENDING" && (
                                <button
                                    onClick={() => onStart(task.id)}
                                    className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Bắt đầu ca làm
                                </button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                                <button
                                    onClick={() => onFinish(task.id)}
                                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Kết thúc ca làm
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

