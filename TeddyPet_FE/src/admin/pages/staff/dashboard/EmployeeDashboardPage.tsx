import { ListHeader } from "../../../components/ui/ListHeader";
import { prefixAdmin } from "../../../constants/routes";
import { useEmployeeDashboard } from "../../../hooks/useEmployeeDashboard";
import { StatusHeader } from "../../../components/staff/dashboard/StatusHeader";
import { CareTaskList } from "../../../components/staff/dashboard/CareTaskList";
import { SpaTaskList } from "../../../components/staff/dashboard/SpaTaskList";
import type { EmployeeTask, EmployeeUser } from "../../../types/employeeDashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyStaffProfile } from "../../../api/staffProfile.api";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { getStaffStats } from "../../../api/dashboard.api";
import { useEffect } from "react";

const mockTasks: EmployeeTask[] = [
    {
        id: 1,
        type: "CARE",
        title: "Dọn chuồng & cho ăn sáng",
        description: "Dọn sạch chuồng, thay nước, cho ăn sáng đầy đủ.",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        cageNumber: "C-12",
        petName: "Milu",
        petSpecies: "Chó Poodle",
        notes: null,
        scheduledStart: null,
        scheduledEnd: null,
        startedAt: null,
        finishedAt: null,
    },
    {
        id: 2,
        type: "SPA",
        title: "Combo tắm & cắt tỉa lông",
        description: "Gói combo tiêu chuẩn cho thú cưng lần đầu đến spa.",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        petName: "Miu",
        petSpecies: "Mèo Anh lông ngắn",
        serviceType: "COMBO",
        bookingTime: new Date().toISOString(),
        durationMinutes: 60,
        scheduledStart: null,
        scheduledEnd: null,
        startedAt: null,
        finishedAt: null,
    },
];

export const EmployeeDashboardPage = () => {
    const { data: myProfileRes, isLoading: loadingProfile } = useQuery({
        queryKey: ["my-staff-profile"],
        queryFn: getMyStaffProfile,
    });
    const myProfile = myProfileRes?.data;

    const initialUser: EmployeeUser | null = myProfile
        ? {
              id: myProfile.staffId,
              fullName: myProfile.fullName,
              avatarUrl: myProfile.avatarUrl ?? undefined,
              positionName: myProfile.positionName ?? null,
              role:
                  (myProfile.positionCode ?? "").toLowerCase().includes("spa") ||
                  (myProfile.positionName ?? "").toLowerCase().includes("spa") ||
                  (myProfile.positionName ?? "").toLowerCase().includes("groom")
                      ? "SPA"
                      : "CARE",
              employmentType: myProfile.employmentType === "FULL_TIME" ? "FULL_TIME" : "PART_TIME",
              todayCheckedIn: false,
              globalStatus: "OFF",
          }
        : null;

    const {
        user,
        pendingTasks,
        inProgressTasks,
        isCheckingIn,
        checkIn,
        checkOut,
        startTask,
        finishTask,
    } = useEmployeeDashboard({
        initialUser: initialUser ?? {
            id: 0,
            fullName: "",
            avatarUrl: undefined,
            positionName: null,
            role: "CARE",
            employmentType: "FULL_TIME",
            todayCheckedIn: false,
            globalStatus: "OFF",
        },
        initialTasks: mockTasks,
    });

    const queryClient = useQueryClient();

    const { data: staffStatsRes } = useQuery({
        queryKey: ["staff-dashboard-stats"],
        queryFn: getStaffStats,
    });
    const staffStats = staffStatsRes?.data;

    useEffect(() => {
        const handleRealtimeUpdate = (event: any) => {
            console.log("🔥 Staff dashboard real-time update triggered!", event.detail);
            queryClient.setQueryData(["staff-dashboard-stats"], { success: true, data: event.detail });
        };

        window.addEventListener('STAFF_DASHBOARD_STATS_UPDATED', handleRealtimeUpdate);
        return () => window.removeEventListener('STAFF_DASHBOARD_STATS_UPDATED', handleRealtimeUpdate);
    }, [queryClient]);

    const activeTasks = [...pendingTasks, ...inProgressTasks];
    const careTasks = activeTasks.filter((t) => t.type === "CARE");
    const spaTasks = activeTasks.filter((t) => t.type === "SPA");

    const handleAddTask = () => {
        toast.success("Đã mở tạo nhiệm vụ (sẽ tích hợp sau).");
    };

    if (loadingProfile || !myProfile) {
        return (
            <>
                <ListHeader
                    title="Nhiệm vụ"
                    breadcrumbItems={[
                        { label: "Trang chủ", to: "/" },
                        { label: "Nhân sự", to: `/${prefixAdmin}/staff/profile/list` },
                        { label: "Nhiệm vụ" },
                    ]}
                />
                <div className="w-full min-h-screen bg-gray-50/50 p-6 sm:p-10">
                    <div className="w-full rounded-2xl border border-gray-100 bg-white px-6 py-6 text-base text-slate-500 shadow-sm">
                        Đang tải thông tin nhân viên...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <ListHeader
                title="Nhiệm vụ"
                breadcrumbItems={[
                    { label: "Trang chủ", to: "/" },
                    { label: "Nhân sự", to: `/${prefixAdmin}/staff/profile/list` },
                    { label: "Nhiệm vụ" },
                ]}
            />
            <div className="w-full min-h-screen bg-gray-50/50 p-6 sm:p-10">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <CheckSquare className="w-8 h-8 text-blue-600" />
                        Nhiệm vụ của nhân viên
                    </h1>
                    <button
                        type="button"
                        onClick={handleAddTask}
                        className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm nhiệm vụ
                    </button>
                </div>

                {/* Hero banner + status */}
                <StatusHeader
                    user={user}
                    onCheckIn={checkIn}
                    onCheckOut={checkOut}
                    isCheckingIn={isCheckingIn}
                />

                {/* Summary cards */}
                <section className="grid gap-4 md:grid-cols-4 mt-6">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Đơn cần đóng gói</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {(staffStats?.confirmedOrders ?? 0) + (staffStats?.pendingOrders ?? 0)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-lg font-bold text-sky-600">
                                📦
                            </div>
                        </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Lịch Spa hôm nay</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-700">
                                    {staffStats?.todayBookings ?? 0}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl font-bold">
                                ✂️
                            </div>
                        </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Sản phẩm sắp hết</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">
                                    {staffStats?.lowStockCount ?? 0}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 text-xl font-bold">
                                ⚠️
                            </div>
                        </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Trạng thái</p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {user.globalStatus === "READY"
                                        ? "Sẵn sàng"
                                        : user.globalStatus === "BUSY"
                                        ? "Đang làm việc"
                                        : "Nghỉ"}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500 text-xl font-bold">
                                ●
                            </div>
                        </div>
                </section>

                {/* Main content: task list */}
                <section className="grid gap-6 mt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div>
                        <h2 className="mb-4 text-xl font-bold text-slate-900">
                            Nhiệm vụ hôm nay
                        </h2>
                        {user.role === "CARE" ? (
                            <CareTaskList
                                tasks={careTasks as any}
                                onStart={startTask}
                                onFinish={finishTask}
                            />
                        ) : (
                            <SpaTaskList
                                tasks={spaTasks as any}
                                onStart={startTask}
                                onFinish={finishTask}
                            />
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">
                            Tóm tắt nhanh
                        </h3>
                        <div className="space-y-4 text-sm text-slate-600">
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span>Role</span>
                                <span className="font-bold text-slate-900">
                                    {user.role === "CARE" ? "Nhân viên chăm sóc" : "Nhân viên Spa"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span>Loại nhân viên</span>
                                <span className="font-bold text-slate-900">
                                    {user.employmentType === "FULL_TIME"
                                        ? "Toàn thời gian"
                                        : "Bán thời gian"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span>Đã check-in hôm nay</span>
                                <span className="font-bold text-slate-900">
                                    {user.todayCheckedIn ? "Có" : "Chưa"}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

