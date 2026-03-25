import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    EmployeeGlobalStatus,
    EmployeeTask,
    EmployeeUser,
    TaskBaseStatus,
} from "../types/employeeDashboard";
import {
    useRealtimeStatus,
    useSetRealtimeAvailable,
    useSetRealtimeOffline,
    useUpdateRealtimeStatus,
} from "../pages/staff/hooks/useStaffRealtime";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import {
    postCompleteStaffTask,
    postPetInHotelStaffTask,
    postStartStaffTask,
    postUpdateStaffTaskPhotos,
    StaffTaskServicePhotosPayload,
} from "../api/staffTask.api";

function getApiErrorMessage(e: unknown): string {
    if (typeof e === "object" && e !== null && "response" in e) {
        const data = (e as { response?: { data?: { message?: string } } }).response?.data;
        const m = data?.message;
        if (typeof m === "string" && m.trim()) return m;
    }
    return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

interface UseEmployeeDashboardOptions {
    initialUser: EmployeeUser;
    initialTasks: EmployeeTask[];
}

export const useEmployeeDashboard = (options: UseEmployeeDashboardOptions) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<EmployeeUser>(options.initialUser);
    const [tasks, setTasks] = useState<EmployeeTask[]>(options.initialTasks || []);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const staffId = typeof user.id === "number" ? user.id : Number(user.id);

    useEffect(() => {
        setTasks(options.initialTasks ?? []);
    }, [options.initialTasks]);

    const { mutate: setRealtimeAvailable } = useSetRealtimeAvailable();
    const { mutate: setRealtimeOffline } = useSetRealtimeOffline();
    const { mutate: updateRealtimeStatus } = useUpdateRealtimeStatus();
    const { data: realtimeRes } = useRealtimeStatus(!Number.isNaN(staffId) ? staffId : undefined);

    useEffect(() => {
        const statusData = (realtimeRes as any)?.data;
        if (!statusData) return;
        const current = statusData.currentStatus as "OFFLINE" | "AVAILABLE" | "BUSY" | "ON_BREAK";
        let todayCheckedIn: boolean;
        let mappedStatus: EmployeeGlobalStatus;
        switch (current) {
            case "AVAILABLE":
                todayCheckedIn = true;
                mappedStatus = "READY";
                break;
            case "BUSY":
                todayCheckedIn = true;
                mappedStatus = "BUSY";
                break;
            case "ON_BREAK":
            case "OFFLINE":
            default:
                todayCheckedIn = false;
                mappedStatus = "OFF";
                break;
        }
        setUser((prev) => ({
            ...prev,
            todayCheckedIn,
            globalStatus: mappedStatus,
        }));
    }, [realtimeRes]);

    const setGlobalStatus = useCallback((status: EmployeeGlobalStatus) => {
        setUser((prev) => ({ ...prev, globalStatus: status }));
    }, []);

    const checkIn = useCallback(async () => {
        setIsCheckingIn(true);
        try {
            if (!Number.isNaN(staffId)) {
                setRealtimeAvailable(staffId);
            }
            setUser((prev) => ({
                ...prev,
                todayCheckedIn: true,
                globalStatus: "READY",
            }));
        } finally {
            setIsCheckingIn(false);
        }
    }, [setRealtimeAvailable, staffId]);

    const checkOut = useCallback(async () => {
        const now = new Date().toISOString();
        if (!Number.isNaN(staffId)) {
            setRealtimeOffline(staffId);
        }
        setUser((prev) => ({
            ...prev,
            todayCheckedIn: false,
            globalStatus: "OFF",
        }));
        setTasks((prev) =>
            prev.map((t) =>
                t.status === "IN_PROGRESS"
                    ? { ...t, status: "COMPLETED" as TaskBaseStatus, finishedAt: now }
                    : t,
            ),
        );
    }, [setRealtimeOffline, staffId]);

    const startTask = useCallback(
        async (taskId: number | string): Promise<boolean> => {
            const target = tasks.find((t) => t.id === taskId);
            if (target && target.bookingCheckedIn === false) {
                toast.error(
                    "Booking chưa check-in tại lễ tân. Vui lòng chờ check-in trước khi bắt đầu xử lý dịch vụ.",
                );
                return false;
            }
            try {
                await postStartStaffTask(taskId);
                await queryClient.invalidateQueries({ queryKey: ["staff-today-tasks"] });
                toast.success("Đã bắt đầu xử lý dịch vụ.");
                if (user.todayCheckedIn) {
                    if (!Number.isNaN(staffId)) {
                        updateRealtimeStatus({ staffId, status: "BUSY" });
                    }
                    setGlobalStatus("BUSY");
                }
                return true;
            } catch (e) {
                toast.error(getApiErrorMessage(e));
                return false;
            }
        },
        [setGlobalStatus, queryClient, staffId, tasks, updateRealtimeStatus, user.todayCheckedIn],
    );

    const finishTask = useCallback(
        async (taskId: number | string): Promise<boolean> => {
            try {
                await postCompleteStaffTask(taskId);
                await queryClient.invalidateQueries({ queryKey: ["staff-today-tasks"] });
                toast.success("Đã hoàn thành dịch vụ.");
                if (user.todayCheckedIn) {
                    if (!Number.isNaN(staffId)) {
                        updateRealtimeStatus({ staffId, status: "AVAILABLE" });
                    }
                    setGlobalStatus("READY");
                } else {
                    if (!Number.isNaN(staffId)) {
                        updateRealtimeStatus({ staffId, status: "OFFLINE" });
                    }
                    setGlobalStatus("OFF");
                }
                return true;
            } catch (e) {
                toast.error(getApiErrorMessage(e));
                return false;
            }
        },
        [setGlobalStatus, queryClient, staffId, updateRealtimeStatus, user.todayCheckedIn],
    );

    const updateTaskPhotos = useCallback(
        async (taskId: number | string, payload: StaffTaskServicePhotosPayload): Promise<boolean> => {
            try {
                await postUpdateStaffTaskPhotos(taskId, payload);
                await queryClient.invalidateQueries({ queryKey: ["staff-today-tasks"] });
                return true;
            } catch (e) {
                toast.error(getApiErrorMessage(e));
                return false;
            }
        },
        [queryClient],
    );

    const markTaskPetInHotel = useCallback(
        async (taskId: number | string): Promise<boolean> => {
            try {
                await postPetInHotelStaffTask(taskId);
                await queryClient.invalidateQueries({ queryKey: ["staff-today-tasks"] });
                toast.success("Đã cập nhật thú cưng vào hotel.");
                if (user.todayCheckedIn && !Number.isNaN(staffId)) {
                    updateRealtimeStatus({ staffId, status: "AVAILABLE" });
                    setGlobalStatus("READY");
                }
                return true;
            } catch (e) {
                toast.error(getApiErrorMessage(e));
                return false;
            }
        },
        [queryClient, setGlobalStatus, staffId, updateRealtimeStatus, user.todayCheckedIn],
    );

    const pendingTasks = useMemo(
        () => tasks.filter((t) => t.status === "PENDING" || t.status === "WAITING_STAFF"),
        [tasks],
    );

    const inProgressTasks = useMemo(
        () => tasks.filter((t) => t.status === "IN_PROGRESS"),
        [tasks],
    );

    const completedTasks = useMemo(
        () => tasks.filter((t) => t.status === "COMPLETED"),
        [tasks],
    );

    const petInHotelTasks = useMemo(
        () => tasks.filter((t) => t.status === "PET_IN_HOTEL"),
        [tasks],
    );

    return {
        user,
        tasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        petInHotelTasks,
        isCheckingIn,
        checkIn,
        checkOut,
        startTask,
        finishTask,
        updateTaskPhotos,
        markTaskPetInHotel,
    };
};

