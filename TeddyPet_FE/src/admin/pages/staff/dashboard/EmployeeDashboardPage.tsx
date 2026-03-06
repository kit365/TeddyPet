import { ListHeader } from "../../../components/ui/ListHeader";
import { prefixAdmin } from "../../../constants/routes";
import { useEmployeeDashboard } from "../../../hooks/useEmployeeDashboard";
import { StatusHeader } from "../../../components/staff/dashboard/StatusHeader";
import { CareTaskList } from "../../../components/staff/dashboard/CareTaskList";
import { SpaTaskList } from "../../../components/staff/dashboard/SpaTaskList";
import type { EmployeeTask, EmployeeUser } from "../../../types/employeeDashboard";
import { useQuery } from "@tanstack/react-query";
import { getMyStaffProfile } from "../../../api/staffProfile.api";

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

    const activeTasks = [...pendingTasks, ...inProgressTasks];
    const careTasks = activeTasks.filter((t) => t.type === "CARE");
    const spaTasks = activeTasks.filter((t) => t.type === "SPA");

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
                <div className="px-4 pb-6 pt-3 md:px-10 md:pb-8">
                    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
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
            <div className="px-4 pb-6 pt-3 md:px-10 md:pb-8">
                {/* Hero banner + status */}
                <StatusHeader
                    user={user}
                    onCheckIn={checkIn}
                    onCheckOut={checkOut}
                    isCheckingIn={isCheckingIn}
                />

                {/* Summary cards */}
                <section className="mb-6 grid gap-3 md:grid-cols-4">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Tổng nhiệm vụ</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {pendingTasks.length + inProgressTasks.length}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 text-base font-semibold">
                            T
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Đang làm</p>
                            <p className="mt-1 text-lg font-semibold text-emerald-700">
                                {inProgressTasks.length}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            ✓
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Chờ xử lý</p>
                            <p className="mt-1 text-lg font-semibold text-sky-700">
                                {pendingTasks.length}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            ⏱
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Trạng thái</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {user.globalStatus === "READY"
                                    ? "Sẵn sàng"
                                    : user.globalStatus === "BUSY"
                                    ? "Đang làm việc"
                                    : "Nghỉ"}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                            ●
                        </div>
                    </div>
                </section>

                {/* Main content: task list */}
                <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">
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

                    {/* Right side card – quick summary, matches dashboard aesthetic */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Tóm tắt nhanh
                        </h3>
                        <div className="space-y-3 text-xs text-slate-600">
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span>Role</span>
                                <span className="font-semibold text-slate-900">
                                    {user.role === "CARE" ? "Nhân viên chăm sóc" : "Nhân viên Spa"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span>Loại nhân viên</span>
                                <span className="font-semibold text-slate-900">
                                    {user.employmentType === "FULL_TIME"
                                        ? "Toàn thời gian"
                                        : "Bán thời gian"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span>Đã check-in hôm nay</span>
                                <span className="font-semibold text-slate-900">
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

