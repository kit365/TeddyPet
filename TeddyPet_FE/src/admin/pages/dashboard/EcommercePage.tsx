import { Typography, Grid, Box, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getRevenueChart } from "../../api/dashboard.api";
import SummaryWidget from "../../components/dashboard/SummaryWidget";
import WelcomeWidget from "../../components/dashboard/WelcomeWidget";
import DashboardCard from "../../components/dashboard/DashboardCard";
import { SalesOverview } from "../../components/dashboard/ecommerce/SalesOverview";
import { CurrentBalance } from "../../components/dashboard/ecommerce/CurrentBalance";
import { TopCustomers } from "../../components/dashboard/ecommerce/TopCustomers";
import { TopStaff } from "../../components/dashboard/ecommerce/TopStaff";
import { LatestProducts } from "../../components/dashboard/ecommerce/LatestProducts";
import { TopSellingProducts } from "../../components/dashboard/ecommerce/TopSellingProducts";
import { PetDistribution } from "../../components/dashboard/ecommerce/PetDistribution";
import { ServiceStatistics } from "../../components/dashboard/ecommerce/ServiceStatistics";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useState, useEffect } from "react";

const CAROUSEL_DATA = [
     {
         title: "Sự trỗi dậy của làm việc từ xa: Lợi ích và Xu hướng",
         description: "Khám phá cách làm việc từ xa đang thay đổi bộ mặt của các doanh nghiệp hiện đại.",
         image: "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-4.webp",
     },
     {
         title: "Công nghệ Blockchain: Không chỉ là tiền điện tử",
         description: "Tìm hiểu về tiềm năng to lớn của Blockchain trong việc bảo mật dữ liệu.",
         image: "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-5.webp",
     },
     {
         title: "Sức khỏe tâm thần trong kỷ nguyên số",
         description: "Cách cân bằng giữa mạng xã hội và đời sống thực để duy trì sức khỏe.",
         image: "https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-6.webp",
     }
];

export const EcommercePage = () => {
    const { user } = useAuthStore();
    const [activeIndex, setActiveIndex] = useState(0);

    const { data: statsRes, isLoading: isLoadingStats } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: getDashboardStats
    });

    // Auto-scroll carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const { data: chartRes } = useQuery({
        queryKey: ["revenue-chart", 7],
        queryFn: () => getRevenueChart(7)
    });

    const stats = statsRes?.data;
    const chartData = chartRes?.data || [];

    return (
        <Box sx={{ p: 1 }}>
            <Grid
                container
                sx={{
                    '--Grid-columns': 12,
                    '--Grid-columnSpacing': 'calc(3 * var(--spacing))',
                    '--Grid-rowSpacing': 'calc(3 * var(--spacing))',
                    flexFlow: 'wrap',
                    minWidth: '0px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    gap: 'var(--Grid-rowSpacing) var(--Grid-columnSpacing)',
                    '& > *': {
                        '--Grid-parent-rowSpacing': 'calc(3 * var(--spacing))',
                        '--Grid-parent-columnSpacing': 'calc(3 * var(--spacing))',
                        '--Grid-parent-columns': 12,
                    }
                }}
            >
                {/* 2 Hình trước tiên (Welcome & Carousel) */}
                <Grid
                    sx={{
                        flexGrow: 0,
                        flexBasis: 'auto',
                        width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <WelcomeWidget
                        title={`Chào mừng trở lại 👋 \n ${user ? `${user.lastName} ${user.firstName}` : 'Quản trị viên'}`}
                        description="Chào mừng bạn đến với hệ thống quản trị. Hãy bắt đầu quản lý các dịch vụ và đơn hàng của bạn ngay hôm nay."
                        img="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/characters/character-present.webp"
                        bgImg="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/background/background-5.webp"
                        action={
                            <Button
                                variant="contained"
                                sx={{
                                    fontFamily: '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textTransform: 'none',
                                    bgcolor: 'var(--palette-primary-main)',
                                    color: 'var(--palette-primary-contrastText)',
                                    boxShadow: 'none',
                                    py: '6px',
                                    px: '12px',
                                    minHeight: '36px',
                                    lineHeight: 1.71429,
                                    borderRadius: 'var(--shape-borderRadius)',
                                    '&:hover': {
                                        bgcolor: 'var(--palette-primary-dark)',
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                Khám phá ngay
                            </Button>
                        }
                    />
                </Grid>

                <Grid
                    sx={{
                        flexGrow: 0,
                        flexBasis: 'auto',
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <DashboardCard
                        sx={{
                            backgroundColor: 'var(--palette-common-black)',
                            height: '320px',
                            overflow: 'hidden',
                        }}
                    >
                        <div className="m-auto max-w-full overflow-hidden relative h-full">
                            <ul
                                className="flex list-none p-0 m-0 h-full transition-transform duration-500 ease-in-out"
                                style={{ transform: `translate3d(-${activeIndex * 100}%, 0px, 0px)` }}
                            >
                                {CAROUSEL_DATA.map((item, index) => (
                                    <li key={index} className="block relative min-w-0 flex-[0_0_100%] h-full">
                                        <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
                                            <div className="absolute bottom-0 z-[9] w-full p-[calc(3*var(--spacing))] flex flex-col gap-[var(--spacing)] text-[var(--palette-common-white)]">
                                                <span className="m-0 font-bold text-[0.75rem] uppercase text-[var(--palette-primary-light)]">
                                                    Featured App
                                                </span>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '1.1875rem',
                                                        lineHeight: 1.5,
                                                        color: 'inherit',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="body2" noWrap sx={{ opacity: 0.8, color: 'inherit' }}>
                                                    {item.description}
                                                </Typography>
                                            </div>
                                            <Box
                                                component="img"
                                                src={item.image}
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    filter: 'brightness(0.5)'
                                                }}
                                            />
                                        </Box>
                                    </li>
                                ))}
                            </ul>
                            {/* Simple Carousel Controls can be added here if needed */}
                        </div>
                    </DashboardCard>
                </Grid>

                {/* Summary Widgets (Span 4 each) */}
                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <SummaryWidget
                        title="Sản phẩm đã bán"
                        total={stats?.totalProducts?.toString() || "0"}
                        percent={2.6}
                        color="#00a76f"
                        chartData={chartData.map(d => d.orders)}
                    />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <SummaryWidget
                        title="Tổng doanh thu"
                        total={stats?.totalRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue) : "0 ₫"}
                        percent={-0.1}
                        color="#ffab00"
                        chartData={chartData.map(d => d.revenue)}
                    />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <SummaryWidget
                        title="Tổng số đơn hàng"
                        total={stats?.totalOrders?.toString() || "0"}
                        percent={0.6}
                        color="#00b8d9"
                        chartData={chartData.map(d => d.orders)}
                    />
                </Grid>

                {/* Sales & Balance Section */}
                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <SalesOverview stats={stats} isLoading={isLoadingStats} />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <CurrentBalance stats={stats} isLoading={isLoadingStats} />
                </Grid>

                {/* Top Customers & Staff Section (Cái mà bạn khen đẹp) */}
                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <TopCustomers />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <TopStaff />
                </Grid>

                {/* Products Section */}
                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <LatestProducts />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <TopSellingProducts />
                </Grid>

                {/* New components added at the end */}
                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <PetDistribution />
                </Grid>

                <Grid
                    sx={{
                        flexBasis: 'auto', flexGrow: 0, 
                        width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                    }}
                >
                    <ServiceStatistics />
                </Grid>
            </Grid>
        </Box>
    );
};
