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

interface UseEmployeeDashboardOptions {
    initialUser: EmployeeUser;
    initialTasks: EmployeeTask[];
}

export const useEmployeeDashboard = (options: UseEmployeeDashboardOptions) => {
    const [user, setUser] = useState<EmployeeUser>(options.initialUser);
    const [tasks, setTasks] = useState<EmployeeTask[]>(options.initialTasks);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const staffId = typeof user.id === "number" ? user.id : Number(user.id);

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
        (taskId: number | string) => {
            const now = new Date().toISOString();
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? {
                              ...t,
                              status: "IN_PROGRESS" as TaskBaseStatus,
                              startedAt: now,
                          }
                        : t,
                ),
            );
            if (user.todayCheckedIn) {
                if (!Number.isNaN(staffId)) {
                    updateRealtimeStatus({ staffId, status: "BUSY" });
                }
                setGlobalStatus("BUSY");
            }
        },
        [setGlobalStatus, staffId, updateRealtimeStatus, user.todayCheckedIn],
    );

    const finishTask = useCallback(
        (taskId: number | string) => {
            const now = new Date().toISOString();
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? {
                              ...t,
                              status: "COMPLETED" as TaskBaseStatus,
                              finishedAt: now,
                          }
                        : t,
                ),
            );
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
        },
        [setGlobalStatus, staffId, updateRealtimeStatus, user.todayCheckedIn],
    );

    const pendingTasks = useMemo(
        () => tasks.filter((t) => t.status === "PENDING"),
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

    return {
        user,
        tasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        isCheckingIn,
        checkIn,
        checkOut,
        startTask,
        finishTask,
    };
};

