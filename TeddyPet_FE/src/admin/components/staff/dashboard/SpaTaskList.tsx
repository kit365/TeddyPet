import type { SpaTask } from "../../../types/employeeDashboard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskSkeletonList } from "./TaskSkeletonList";
import { CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { UploadMultiFile } from "../../upload/UploadMultiFile";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { TaskDetailModal } from "./TaskDetailModal";

interface Props {
    tasks: SpaTask[];
    loading?: boolean;
    onStart: (taskId: number | string) => void | Promise<void>;
    onFinish: (taskId: number | string) => boolean | Promise<boolean>;
    onSavePhotos: (
        taskId: number | string,
        payload: { beforePhotos?: string[]; duringPhotos?: string[]; afterPhotos?: string[] },
    ) => boolean | Promise<boolean>;
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

export const SpaTaskList = ({ tasks, loading, onStart, onFinish, onSavePhotos }: Props) => {
    const [completeTaskId, setCompleteTaskId] = useState<number | string | null>(null);
    const [detailTask, setDetailTask] = useState<SpaTask | null>(null);
    const [photoMap, setPhotoMap] = useState<
        Record<string, { beforePhotos: string[]; duringPhotos: string[]; afterPhotos: string[] }>
    >({});

    const pendingCompleteTask = completeTaskId != null ? tasks.find((t) => t.id === completeTaskId) : undefined;

    const handleConfirmComplete = async () => {
        if (completeTaskId == null) return;
        const id = completeTaskId;
        const ok = await onFinish(id);
        if (ok) setCompleteTaskId(null);
    };

    const keyOf = (taskId: number | string) => String(taskId);

    const getLocalPhotos = (taskId: number | string) =>
        photoMap[keyOf(taskId)] ?? { beforePhotos: [], duringPhotos: [], afterPhotos: [] };

    const updateTaskPhotos = async (
        taskId: number | string,
        partial: { beforePhotos?: string[]; duringPhotos?: string[]; afterPhotos?: string[] },
    ) => {
        const k = keyOf(taskId);
        const current = photoMap[k] ?? { beforePhotos: [], duringPhotos: [], afterPhotos: [] };
        const next = {
            beforePhotos: partial.beforePhotos ?? current.beforePhotos,
            duringPhotos: partial.duringPhotos ?? current.duringPhotos,
            afterPhotos: partial.afterPhotos ?? current.afterPhotos,
        };
        setPhotoMap((prev) => ({ ...prev, [k]: next }));
        await onSavePhotos(taskId, partial);
    };

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
    const now = new Date();

    const photos = detailTask ? getLocalPhotos(detailTask.id) : undefined;
    return (
        <>
            <TaskDetailModal 
                open={detailTask != null} 
                onClose={() => setDetailTask(null)} 
                task={detailTask} 
                beforePhotos={detailTask?.beforePhotos?.length ? detailTask.beforePhotos : photos?.beforePhotos}
                duringPhotos={detailTask?.duringPhotos?.length ? detailTask.duringPhotos : photos?.duringPhotos}
                afterPhotos={detailTask?.afterPhotos?.length ? detailTask.afterPhotos : photos?.afterPhotos}
            />
            <Dialog open={completeTaskId != null} onClose={() => setCompleteTaskId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Xác nhận hoàn thành</DialogTitle>
                <DialogContent>
                    Bạn có chắc muốn chuyển trạng thái dịch vụ này sang <strong>hoàn thành</strong>
                    {pendingCompleteTask?.title ? (
                        <>
                            {" "}
                            — <span className="text-emerald-800">{pendingCompleteTask.title}</span>
                        </>
                    ) : null}
                    ? Hệ thống sẽ ghi nhận thời điểm kết thúc thực tế.
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCompleteTaskId(null)} color="inherit">
                        Hủy
                    </Button>
                    <Button onClick={() => void handleConfirmComplete()} variant="contained" color="success">
                        Xác nhận hoàn thành
                    </Button>
                </DialogActions>
            </Dialog>
            <div className="flex flex-col gap-4">
            {sorted.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const isInProgress = task.status === "IN_PROGRESS";
                const isWaiting = task.status === "PENDING" || task.status === "WAITING_STAFF";
                const canStartTask = isWaiting && task.bookingCheckedIn === true;
                const localPhotos = getLocalPhotos(task.id);
                const hasBefore = task.hasBeforePhotos || localPhotos.beforePhotos.length > 0;
                const hasDuring = task.hasDuringPhotos || localPhotos.duringPhotos.length > 0;
                const hasAfter = task.hasAfterPhotos || localPhotos.afterPhotos.length > 0;
                const canFinishTask = hasBefore && hasDuring && hasAfter;

                const booking = new Date(task.bookingTime);
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
                                <div className="text-base text-gray-500 mt-1">
                                    {task.petName} • {task.petSpecies}
                                </div>
                                {(task.bookingCode || task.customerName) && (
                                    <div className="text-sm font-medium text-emerald-700 mt-0.5">
                                        {task.bookingCode ? <span>{task.bookingCode}</span> : null}
                                        {task.bookingCode && task.customerName ? " · " : null}
                                        {task.customerName ?? ""}
                                    </div>
                                )}
                                <div className="text-base text-gray-500 mt-1.5">
                                    {formatService(task.serviceType)} • {task.durationMinutes} phút
                                </div>

                                <div className="mt-4 flex items-center gap-6 flex-wrap">
                                    <div className="text-base font-medium text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                        <CalendarDays className="w-5 h-5 text-gray-400" />
                                        Hẹn Spa:{" "}
                                        {booking.toLocaleDateString([], { day: "2-digit", month: "2-digit" })}
                                    </div>
                                    {scheduledEnd && (
                                        <div className="text-base font-medium text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                            <Clock className="w-5 h-5 text-gray-400" />
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
                                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        }`}
                                    >
                                        {isWaiting
                                            ? "Chưa bắt đầu"
                                            : isInProgress
                                              ? "Đang thực hiện"
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
                            {isInProgress && (
                                <div className="w-full lg:w-[380px] space-y-3">
                                    <UploadMultiFile
                                        compact
                                        title="Ảnh trước khi làm"
                                        value={localPhotos.beforePhotos}
                                        onChange={(v) => void updateTaskPhotos(task.id, { beforePhotos: v })}
                                    />
                                    <UploadMultiFile
                                        compact
                                        title="Ảnh trong lúc làm"
                                        value={localPhotos.duringPhotos}
                                        onChange={(v) => void updateTaskPhotos(task.id, { duringPhotos: v })}
                                    />
                                    <UploadMultiFile
                                        compact
                                        title="Ảnh sau khi làm"
                                        value={localPhotos.afterPhotos}
                                        onChange={(v) => void updateTaskPhotos(task.id, { afterPhotos: v })}
                                    />
                                    <button
                                        type="button"
                                        disabled={!canFinishTask}
                                        onClick={() => canFinishTask && setCompleteTaskId(task.id)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            canFinishTask
                                                ? "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100"
                                                : "text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                                        }`}
                                    >
                                        Hoàn thành
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </>
    );
};
