import type { CareTask } from "../../../types/employeeDashboard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskSkeletonList } from "./TaskSkeletonList";
import { CalendarDays, Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface Props {
    tasks: CareTask[];
    loading?: boolean;
    onStart: (taskId: number | string) => void;
    onFinish: (taskId: number | string) => void;
    onEdit?: (taskId: number | string) => void;
    onDelete?: (taskId: number | string) => void;
}

export const CareTaskList = ({ tasks, loading, onStart, onFinish, onEdit, onDelete }: Props) => {
    if (loading) return <TaskSkeletonList />;

    if (!tasks.length) {
        return (
            <TaskEmptyState
                title="Hôm nay chưa có nhiệm vụ chăm sóc"
                description="Khi có lịch cho ăn, dọn chuồng hoặc chăm sóc khác, nhiệm vụ sẽ hiển thị tại đây."
            />
        );
    }

    const now = new Date();

    return (
        <div className="flex flex-col gap-4">
            {tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const isInProgress = task.status === "IN_PROGRESS";
                const isPending = task.status === "PENDING";

                const scheduledEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;
                const isOverdue =
                    !isCompleted && !!scheduledEnd && scheduledEnd.getTime() < now.getTime();

                const priorityClass = isOverdue
                    ? "border-l-red-500"
                    : isInProgress
                    ? "border-l-amber-400"
                    : "border-l-blue-400";

                return (
                    <div
                        key={task.id}
                        className={`group w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 border-l-4 ${priorityClass} ${
                            isCompleted ? "bg-gray-50 opacity-60" : ""
                        }`}
                    >
                        {/* Left: Task info */}
                        <div className="flex-1">
                            <div
                                className={`text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors ${
                                    isCompleted ? "line-through text-gray-400 group-hover:text-gray-400" : ""
                                }`}
                            >
                                {task.title}
                            </div>
                            <div className="text-base text-gray-500 mt-1">
                                Chuồng {task.cageNumber} • {task.petName} • {task.petSpecies}
                            </div>
                            {task.description && (
                                <div className="text-base text-gray-500 mt-1.5 line-clamp-2">
                                    {task.description}
                                </div>
                            )}

                            {/* Meta row */}
                            <div className="mt-4 flex items-center gap-6 flex-wrap">
                                {scheduledEnd && (
                                    <div className="text-base font-medium text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                        <CalendarDays className="w-5 h-5 text-gray-400" />
                                        Hạn chót:{" "}
                                        {scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                )}

                                <span
                                    className={`px-4 py-2 rounded-full text-sm font-bold border ${
                                        isOverdue
                                            ? "bg-red-50 text-red-700 border-red-100"
                                            : isInProgress
                                            ? "bg-amber-50 text-amber-700 border-amber-100"
                                            : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}
                                >
                                    {isOverdue ? "Ưu tiên cao" : isInProgress ? "Ưu tiên vừa" : "Ưu tiên thấp"}
                                </span>

                                <span
                                    className={`px-4 py-2 rounded-full text-sm font-bold border ${
                                        isInProgress
                                            ? "bg-blue-50 text-blue-700 border-blue-100"
                                            : isPending
                                            ? "bg-slate-100 text-slate-600 border-slate-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    }`}
                                >
                                    {isPending ? "Chờ thực hiện" : isInProgress ? "Đang xử lý" : "Đã hoàn thành"}
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3 lg:justify-end">
                            {isPending && (
                                <button
                                    onClick={() => onStart(task.id)}
                                    className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all"
                                >
                                    Bắt đầu
                                </button>
                            )}
                            {isInProgress && (
                                <button
                                    onClick={() => onFinish(task.id)}
                                    className="px-6 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Hoàn thành
                                </button>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => (onEdit ? onEdit(task.id) : toast.info("Chức năng sửa sẽ tích hợp sau."))}
                                    className="p-3 rounded-xl transition-all text-blue-600 bg-blue-50 hover:bg-blue-100"
                                    aria-label="Sửa nhiệm vụ"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => (onDelete ? onDelete(task.id) : toast.info("Chức năng xóa sẽ tích hợp sau."))}
                                    className="p-3 rounded-xl transition-all text-red-600 bg-red-50 hover:bg-red-100 opacity-100 lg:opacity-0 group-hover:opacity-100"
                                    aria-label="Xóa nhiệm vụ"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

