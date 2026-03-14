import { Grid, Box, Typography, Button, Container, Stack } from "@mui/material";
import { ListHeader } from "../../../components/ui/ListHeader";
import { prefixAdmin } from "../../../constants/routes";
import { useEmployeeDashboard } from "../../../hooks/useEmployeeDashboard";
import { StatusHeader } from "../../../components/staff/dashboard/StatusHeader";
import { CareTaskList } from "../../../components/staff/dashboard/CareTaskList";
import { SpaTaskList } from "../../../components/staff/dashboard/SpaTaskList";
import type { EmployeeTask, EmployeeUser } from "../../../types/employeeDashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyStaffProfile } from "../../../api/staffProfile.api";
// removed unused CheckSquare, Plus
import { toast } from "react-toastify";
import { getStaffStats } from "../../../api/dashboard.api";
import { useEffect } from "react";
import WelcomeWidget from "../../../components/dashboard/WelcomeWidget";
import SummaryWidget from "../../../components/dashboard/SummaryWidget";
import DashboardCard from "../../../components/dashboard/DashboardCard";

// removed StaffPerformanceChart

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
                        { label: "Tổng quan" },
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
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <ListHeader
                title="Tổng quan nhân viên"
                breadcrumbItems={[
                    { label: "Trang chủ", to: "/" },
                    { label: "Nhân sự", to: `/${prefixAdmin}/staff/profile/list` },
                    { label: "Tổng quan" },
                ]}
            />

            <Grid 
                container
                sx={{
                    '--Grid-columns': 12,
                    '--Grid-columnSpacing': 'calc(3 * var(--spacing))',
                    '--Grid-rowSpacing': 'calc(3 * var(--spacing))',
                    flexFlow: 'wrap',
                    display: 'flex',
                    gap: 'var(--Grid-rowSpacing) var(--Grid-columnSpacing)',
                }}
            >
                {/* Welcome & Status Column */}
                <Grid 
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 8 / 12 - (12 - 8) * (var(--Grid-columnSpacing) / 12))',
                    }}
                >
                    <WelcomeWidget
                        title={`Chào mừng trở lại,\n${user.fullName}! 👋`}
                        description="Hôm nay bạn có những nhiệm vụ mới cần hoàn thành. Hãy bắt đầu ngày làm việc tuyệt vời nhé!"
                        img="https://pub-c2ee032483864a75a76e7372a8019fb0.r2.dev/person-pet.webp"
                        bgImg="https://pub-c2ee032483864a75a76e7372a8019fb0.r2.dev/glass-bg.webp"
                        action={
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAddTask}
                                    sx={{
                                        bgcolor: 'rgba(34, 197, 94, 0.95)',
                                        color: 'white',
                                        px: 2,
                                        py: 0.6,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        '&:hover': { bgcolor: 'rgb(22, 163, 74)' }
                                    }}
                                >
                                    Thêm nhiệm vụ
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="small"
                                    sx={{ 
                                        borderColor: 'rgba(255,255,255,0.4)', 
                                        color: 'white',
                                        px: 2,
                                        py: 0.6,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    Xem lịch trực
                                </Button>
                            </Stack>
                        }
                    />
                </Grid>

                {/* Status Column */}
                <Grid 
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / 12 - (12 - 4) * (var(--Grid-columnSpacing) / 12))',
                    }}
                >
                    <Stack spacing={3} sx={{ height: '100%' }}>
                        <StatusHeader
                            user={user}
                            onCheckIn={checkIn}
                            onCheckOut={checkOut}
                            isCheckingIn={isCheckingIn}
                        />
                        <DashboardCard sx={{ p: 'calc(2.5 * var(--spacing))', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, mb: 2, display: 'block', fontSize: '10px', letterSpacing: '0.1em' }}>
                                CA TRỰC HIỆN TẠI
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed var(--palette-divider)' }}>
                                    <Typography variant="body2" color="text.secondary">Vai trò</Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {user.role === "CARE" ? "Chăm sóc" : "Spa & Grooming"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed var(--palette-divider)' }}>
                                    <Typography variant="body2" color="text.secondary">Loại hình</Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {user.employmentType === "FULL_TIME" ? "T.Thời gian" : "B.Thời gian"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: user.todayCheckedIn ? 'success.main' : 'error.main' }} />
                                        <Typography variant="subtitle2" fontWeight={700} color={user.todayCheckedIn ? "success.main" : "error.main"}>
                                            {user.todayCheckedIn ? "Đã điểm danh" : "Chưa điểm danh"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </DashboardCard>
                    </Stack>
                </Grid>

                {/* Metrics Row */}
                {[
                    { title: "Đơn hàng", total: (staffStats?.confirmedOrders ?? 0 + (staffStats?.pendingOrders ?? 0)).toString(), color: "#22c55e" },
                    { title: "Lịch Spa", total: (staffStats?.todayBookings ?? 0).toString(), color: "#ffab00" },
                    { title: "Kho hàng", total: (staffStats?.lowStockCount ?? 0).toString(), color: "#ff5630" },
                    { title: "Nhiệm vụ", total: activeTasks.length.toString(), color: "#00b8d9" }
                ].map((stat, idx) => (
                    <Grid 
                        key={idx}
                        sx={{
                            flexBasis: 'auto', flexGrow: 0, 
                            width: 'calc(100% * 3 / 12 - (12 - 3) * (var(--Grid-columnSpacing) / 12))',
                        }}
                    >
                        <SummaryWidget
                            title={stat.title}
                            total={stat.total}
                            color={stat.color}
                            showChart={false}
                        />
                    </Grid>
                ))}

                {/* Task Tables Section */}
                <Grid 
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 8 / 12 - (12 - 8) * (var(--Grid-columnSpacing) / 12))',
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Công việc hiện tại</Typography>
                        <Typography variant="body2" color="text.secondary">Bắt đầu hoàn thành các nhiệm vụ được giao trong ngày</Typography>
                    </Box>
                    
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
                </Grid>

                {/* Side Section: Quick Stats or Feed */}
                <Grid 
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / 12 - (12 - 4) * (var(--Grid-columnSpacing) / 12))',
                    }}
                >
                    <Stack spacing={3}>
                        <DashboardCard sx={{ p: 'calc(2.5 * var(--spacing))', bgcolor: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Trạng thái hệ thống</Typography>
                            <Stack spacing={2}>
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: 1.5, 
                                    bgcolor: user.globalStatus === "READY" ? 'success.lighter' : 'warning.lighter',
                                    border: '1px solid',
                                    borderColor: user.globalStatus === "READY" ? 'success.light' : 'warning.light'
                                }}>
                                    <Typography variant="caption" sx={{ color: user.globalStatus === "READY" ? 'success.dark' : 'warning.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                                        Ghi nhận:
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800 }}>
                                        {user.globalStatus === "READY" ? "Sẵn sàng nhận việc" : "Đang bận công tác"}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid var(--palette-divider)' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>HIỆU SUẤT TRỰC TUẦN</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h4" fontWeight={800}>92%</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Bạn đã hoàn thành 24/26 nhiệm vụ được giao tuần này.</Typography>
                                </Box>
                            </Stack>
                        </DashboardCard>
                        
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            color="success"
                            size="medium"
                            sx={{ 
                                py: 1.5, 
                                borderRadius: 1.2, 
                                fontWeight: 700, 
                                borderStyle: 'dashed',
                                bgcolor: 'rgba(34, 197, 94, 0.02)',
                                '&:hover': {
                                    bgcolor: 'rgba(34, 197, 94, 0.08)',
                                    borderColor: 'success.main'
                                }
                            }}
                        >
                            Hướng dẫn quy trình Care/Spa
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

