import type { CareTask } from "../../../types/employeeDashboard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskSkeletonList } from "./TaskSkeletonList";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { TaskDetailModal } from "./TaskDetailModal";

interface Props {
    tasks: CareTask[];
    loading?: boolean;
    onStart: (taskId: number | string) => void | Promise<void>;
    onSetUpDone: (taskId: number | string) => void | Promise<void>;
}

export const CareTaskList = ({ tasks, loading, onStart, onSetUpDone }: Props) => {
    const [detailTask, setDetailTask] = useState<CareTask | null>(null);

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
        <>
            <TaskDetailModal 
                open={detailTask != null} 
                onClose={() => setDetailTask(null)} 
                task={detailTask} 
                beforePhotos={detailTask?.beforePhotos}
                duringPhotos={detailTask?.duringPhotos}
                afterPhotos={detailTask?.afterPhotos}
            />
            <div className="flex flex-col gap-4">
            {tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const isInProgress = task.status === "IN_PROGRESS";
                const isWaiting = task.status === "PENDING" || task.status === "WAITING_STAFF";
                const isPetInHotel = task.status === "PET_IN_HOTEL";
                const canStartTask = isWaiting && task.bookingCheckedIn === true;
                const canSetUpDoneTask = (isWaiting || isInProgress) && task.bookingCheckedIn === true;

                const scheduledEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;
                const isOverdue =
                    !isCompleted && !!scheduledEnd && scheduledEnd.getTime() < now.getTime();

                const priorityClass = isOverdue
                    ? "border-l-red-500"
                    : isInProgress
                      ? "border-l-amber-400"
                      : isPetInHotel
                        ? "border-l-emerald-400"
                      : "border-l-blue-400";

                return (
                    <div
                        key={task.id}
                        className={`group w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-stretch justify-between gap-0 hover:shadow-md hover:border-emerald-300 transition-all duration-200 border-l-4 ${priorityClass} ${
                            isCompleted ? "bg-gray-50 opacity-60" : ""
                        }`}
                    >
                        <button
                            type="button"
                            className={`flex-1 text-left p-6 flex flex-col lg:flex-row lg:items-center gap-6 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
                                isCompleted ? "" : "hover:bg-emerald-50/40"
                            }`}
                            onClick={() => setDetailTask(task)}
                            title="Xem chi tiết booking_pet_service"
                        >
                            <div className="flex-1 min-w-0">
                                <div
                                    className={`text-lg font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors ${
                                        isCompleted ? "line-through text-gray-400 group-hover:text-gray-400" : ""
                                    }`}
                                >
                                    {task.title}
                                </div>
                                {(task.bookingCode || task.customerName) && (
                                    <div className="text-sm font-medium text-emerald-700 mt-0.5">
                                        {task.bookingCode ? <span>{task.bookingCode}</span> : null}
                                        {task.bookingCode && task.customerName ? " · " : null}
                                        {task.customerName ?? ""}
                                    </div>
                                )}
                                <div className="text-base text-gray-500 mt-1">
                                    Chuồng {task.cageNumber} • {task.petName} • {task.petSpecies}
                                </div>
                                {task.description && (
                                    <div className="text-base text-gray-500 mt-1.5 line-clamp-2">
                                        {task.description}
                                    </div>
                                )}

                                <div className="mt-4 flex items-center gap-6 flex-wrap">
                                    {scheduledEnd && (
                                        <div className="text-base font-medium text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                            <CalendarDays className="w-5 h-5 text-gray-400" />
                                            Hạn chót:{" "}
                                            {scheduledEnd.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
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
                                        {isOverdue
                                            ? "Ưu tiên cao"
                                            : isInProgress
                                              ? "Ưu tiên vừa"
                                              : "Ưu tiên thấp"}
                                    </span>

                                    <span
                                        className={`px-4 py-2 rounded-full text-sm font-bold border ${
                                            isInProgress
                                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                                : isWaiting
                                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                                  : isPetInHotel
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        }`}
                                    >
                                        {isWaiting
                                            ? task.serviceRequiresRoom ? "Chưa bắt đầu" : "Chờ thực hiện"
                                            : isInProgress
                                              ? task.serviceRequiresRoom ? "Chờ thực hiện" : "Đang xử lý"
                                              : isPetInHotel
                                                ? "Đã đưa thú cưng vào hotel"
                                              : "Đã hoàn thành"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Bấm để xem chi tiết booking & dịch vụ</p>
                            </div>
                        </button>

                        <div
                            className="flex items-center gap-2 lg:justify-end px-6 pb-6 lg:py-6 lg:pl-0 lg:pr-6 shrink-0 border-t lg:border-t-0 border-gray-100 lg:border-l lg:border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isWaiting && (
                                <div className="flex flex-col items-end gap-1">
                                    <button
                                        type="button"
                                        disabled={!canStartTask}
                                        title={
                                            canStartTask
                                                ? "Bắt đầu xử lý dịch vụ"
                                                : "Chờ lễ tân check-in booking trước khi bắt đầu"
                                        }
                                        onClick={() => canStartTask && onStart(task.id)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${
                                            canStartTask
                                                ? "text-white bg-emerald-600 hover:bg-emerald-700"
                                                : "text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200"
                                        }`}
                                    >
                                        Bắt đầu
                                    </button>
                                    {!canStartTask && (
                                        <span className="text-[10px] text-amber-700 max-w-[200px] text-right leading-tight">
                                            Chờ check-in booking tại lễ tân
                                        </span>
                                    )}
                                </div>
                            )}
                            {((!task.serviceRequiresRoom && isWaiting) || isInProgress) && (
                                <button
                                    type="button"
                                    disabled={!canSetUpDoneTask}
                                    onClick={() => canSetUpDoneTask && onSetUpDone(task.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                        canSetUpDoneTask
                                            ? "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100"
                                            : "text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                                    }`}
                                >
                                    Đã set up xong
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </>
    );
};
