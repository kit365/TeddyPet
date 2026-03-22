import { Grid, Box, Typography, Button, Divider, Menu, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Stack, Avatar, Tabs, Tab, IconButton, Collapse } from "@mui/material"
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/useAuthStore";
import { prefixAdmin } from "../../constants/routes";
import Chart from 'react-apexcharts';
import { Icon } from '@iconify/react';
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getDashboardStats,
    getRevenueChart,
    getTopCustomers,
    getLatestProducts,
    getPetDistribution,
    getServiceStatistics,
    getVisitsByRegion,
    getCustomerGrowth,
    getTopSellingProducts,
    getRatingSummary,
    getTopStaff,
} from "../../api/dashboard.api";
import { DashboardDateFilter, DateRangeValue } from "../../components/dashboard/DashboardDateFilter";
import dayjs from "dayjs";
import type {
    DashboardStatsResponse,
    RevenueChartItem,
    VisitsByRegionResponse,
    CustomerGrowthResponse,
    ServiceStatisticsWithComparisonResponse,
    RatingSummaryResponse,
    TopSellingProductItem,
    TopStaffResponse,
} from "../../api/dashboard.api";
import type { ApiResponse } from "../../../types/common.type";
import DashboardCard from "../../components/dashboard/DashboardCard";
import SummaryWidget from "../../components/dashboard/SummaryWidget";
import WelcomeWidget from "../../components/dashboard/WelcomeWidget";
import { SalesOverview } from "../../components/dashboard/ecommerce/SalesOverview";
import { CurrentBalance } from "../../components/dashboard/ecommerce/CurrentBalance";
import { TodayRevenueModal } from "../../components/dashboard/ecommerce/TodayRevenueModal";
import { RevenueOverTimeChart } from "../../components/dashboard/ecommerce/RevenueOverTimeChart";

const CupIcon = ({ size = 20, sx }: { size?: number, sx?: any }) => (
    <Box
        component="svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        sx={{ ...sx }}
    >
        <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v6a7.99 7.99 0 0 0 6.941 7.923C9.746 19.347 11.233 20 13 20c1.867 0 3.5-.7 4.316-1.792A8.001 8.001 0 0 0 22 10V4a2 2 0 0 0-2-2m0 8a6 6 0 0 1-5.228 5.952c-.52.03-1.045.048-1.572.048s-1.052-.018-1.572-.048A6.001 6.001 0 0 1 4 10V4h16zM3.5 12h17a.5.5 0 0 1 .5.5v1a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-1a.5.5 0 0 1 .5-.5" />
    </Box>
);

/** Pie chart: lượt truy cập theo vùng (Bắc, Trung, Nam) — data từ API/Redis khi có tracking. */
const CurrentVisitsChart = ({ data }: { data?: { north: number; central: number; south: number; regions?: Array<{ label: string; count: number }> } }) => {
    const regions = data?.regions?.length ? data.regions : [
        { label: 'Miền Bắc', count: data?.north ?? 0 },
        { label: 'Miền Trung', count: data?.central ?? 0 },
        { label: 'Miền Nam', count: data?.south ?? 0 },
    ];
    const labels = regions.map((r) => r.label);
    const series = regions.map((r) => r.count);
    const total = series.reduce((a, b) => a + b, 0);
    const chartOptions: any = {
        chart: { type: 'pie' },
        labels,
        legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '13px', fontWeight: 500, itemMargin: { horizontal: 10, vertical: 5 }, markers: { radius: 12 } },
        stroke: { show: false },
        dataLabels: { enabled: true, dropShadow: { enabled: false } },
        tooltip: { fillSeriesColor: false, y: { formatter: (v: number) => `${v.toLocaleString()} lượt truy cập` } },
        plotOptions: { pie: { donut: { size: '90%', labels: { show: false } } } },
        colors: ['#00a76f', '#ffab00', '#004b50']
    };
    return (
        <DashboardCard sx={{ p: 3, height: '100%', position: 'relative' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Lượt truy cập theo vùng</Typography>
                <IconButton size="small" sx={{ color: 'text.disabled' }}><Icon icon="eva:maximize-fill" /></IconButton>
            </Stack>
            <Box sx={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {total > 0 ? (
                    <Chart options={chartOptions} series={series} type="pie" width="100%" height={340} />
                ) : (
                    <Typography variant="body2" color="text.secondary">Chưa có dữ liệu (sẽ có khi bật tracking Cookie/IP)</Typography>
                )}
            </Box>
        </DashboardCard>
    );
};

/** Line chart: tăng trưởng thành viên theo tháng — năm nay vs năm trước (từ API). */
const CustomerGrowthChart = ({ data }: { data?: { thisYearMonthly: number[]; lastYearMonthly: number[]; monthLabels: string[] } }) => {
    const labels = data?.monthLabels ?? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const thisYear = data?.thisYearMonthly ?? labels.map(() => 0);
    const lastYear = data?.lastYearMonthly ?? labels.map(() => 0);
    const chartOptions: any = {
        chart: { type: 'line', toolbar: { show: false }, dropShadow: { enabled: true, color: '#000', top: 18, left: 7, blur: 10, opacity: 0.2 } },
        colors: ['#00a76f', '#ffab00'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        grid: { borderColor: 'var(--palette-divider)', row: { colors: ['transparent', 'transparent'], opacity: 0.5 } },
        markers: { size: 1 },
        xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: 'var(--palette-text-secondary)' } } },
        legend: { position: 'top', horizontalAlign: 'right', offsetY: -20 }
    };
    const series = [
        { name: 'Năm nay', data: thisYear },
        { name: 'Năm trước', data: lastYear }
    ];
    return (
        <DashboardCard sx={{ p: 3, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Tăng trưởng thành viên</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>So sánh đăng ký mới theo tháng (năm nay vs năm trước)</Typography>
            </Box>
            <Box sx={{ height: 320, flexShrink: 0 }}>
                <Chart options={chartOptions} series={series} type="line" height={320} />
            </Box>
        </DashboardCard>
    );
};

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

const PetDistributionChart = ({ data }: { data?: Array<{ label: string; count: number; color: string }> }) => {
    const list = data ?? [];
    const labels = list.map((d) => d.label);
    const series = list.map((d) => d.count);
    const colors = list.length ? list.map((d) => d.color) : ['#007867', '#5BE49B', '#004B50'];
    const total = series.reduce((a, b) => a + b, 0);
    const chartOptions: any = {
        chart: { type: 'donut' },
        labels,
        legend: { show: false },
        stroke: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Tổng',
                            formatter: () => total.toLocaleString(),
                            color: 'var(--palette-text-secondary)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        },
                        value: { show: true, fontSize: '1.25rem', fontWeight: 600, color: 'var(--palette-text-primary)' }
                    }
                }
            }
        },
        colors
    };
    return (
        <DashboardCard>
            <Box sx={{ p: 3, pb: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Phân bổ thú cưng</Typography>
                <Typography variant="body2" sx={{ color: 'var(--palette-text-secondary)', mt: 0.5 }}>Thống kê theo chủng loại</Typography>
            </Box>
            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, mb: 2 }}>
                {series.length > 0 ? (
                    <Chart options={chartOptions} series={series} type="donut" width={260} height={260} />
                ) : (
                    <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>
                )}
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {labels.map((label: string, index: number) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: colors[index] }} />
                        <Typography sx={{ fontSize: '0.813rem', fontWeight: 600 }}>{label}</Typography>
                    </Box>
                ))}
            </Box>
        </DashboardCard>
    );
};

const stockStatusMap: Record<string, { label: string; color: string }> = {
    IN_STOCK: { label: 'Còn hàng', color: '#00a76f' },
    LOW_STOCK: { label: 'Sắp hết', color: '#ffab00' },
    OUT_OF_STOCK: { label: 'Hết hàng', color: '#ff5630' },
};
const productStatusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Đang bán', color: '#00a76f' },
    HIDDEN: { label: 'Ẩn', color: '#637381' },
    DRAFT: { label: 'Nháp', color: '#ffab00' },
};
const NewProductsTable = ({ data }: { data?: Array<{ productId: number; name: string; minPrice?: number; maxPrice?: number; categories?: Array<{ name?: string }>; stockStatus?: string; status?: string }> }) => {
    const list = data ?? [];
    const navigate = useNavigate();
    const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    return (
        <DashboardCard>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Sản phẩm mới</Typography>
            </Box>
            <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 640 }}>
                    <TableHead sx={{ bgcolor: 'var(--palette-background-neutral)', borderBottom: 'none' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Tên sản phẩm</TableCell>
                            <TableCell sx={{ color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Danh mục</TableCell>
                            <TableCell sx={{ color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Giá</TableCell>
                            <TableCell sx={{ color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Kho</TableCell>
                            <TableCell sx={{ color: 'var(--palette-text-secondary)', fontWeight: 600, borderBottom: 'none' }}>Trạng thái</TableCell>
                            <TableCell sx={{ borderBottom: 'none' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {list.map((row) => {
                            const price = row.minPrice != null ? (row.maxPrice != null && row.maxPrice !== row.minPrice ? `${formatMoney(row.minPrice)} - ${formatMoney(row.maxPrice)}` : formatMoney(row.minPrice)) : '-';
                            const stock = stockStatusMap[row.stockStatus ?? ''] ?? { label: row.stockStatus ?? '-', color: '#637381' };
                            const pStatus = productStatusMap[row.status ?? ''] ?? { label: row.status ?? '-', color: '#637381' };
                            return (
                                <TableRow
                                    key={row.productId}
                                    sx={{ height: '68.4px', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                    onClick={() => navigate(`/${prefixAdmin}/product/detail/${row.productId}`)}
                                >
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--palette-text-primary)', borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }}>{row.name}</TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'var(--palette-text-primary)', borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }}>{row.categories?.[0]?.name ?? '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'var(--palette-text-primary)', borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }}>{price}</TableCell>
                                    <TableCell sx={{ borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }}>
                                        <Box sx={{ height: 24, minWidth: 22, lineHeight: 0, borderRadius: '6px', alignItems: 'center', whiteSpace: 'nowrap', display: 'inline-flex', justifyContent: 'center', padding: '0px 6px', fontSize: '0.75rem', fontWeight: 700, bgcolor: `${stock.color}14`, color: stock.color }}>{stock.label}</Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }}>
                                        <Box sx={{ height: 24, minWidth: 22, lineHeight: 0, borderRadius: '6px', alignItems: 'center', whiteSpace: 'nowrap', display: 'inline-flex', justifyContent: 'center', padding: '0px 6px', fontSize: '0.75rem', fontWeight: 700, bgcolor: `${pStatus.color}14`, color: pStatus.color }}>{pStatus.label}</Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px dashed var(--palette-divider)', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                                        <Icon icon="eva:more-vertical-fill" width={20} height={20} style={{ color: 'var(--palette-text-disabled)' }} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ p: 2, textAlign: 'right' }}>
                <Button component={Link} to={`/${prefixAdmin}/product/list`} size="small" color="inherit" endIcon={<Icon icon="eva:arrow-ios-forward-fill" />} sx={{ p: '4px', borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'var(--palette-action-hover)' } }}>Xem tất cả</Button>
            </Box>
        </DashboardCard>
    );
};

const TopSellingProducts = ({ data, days, onDaysChange }: { data?: Array<{ product: { productId: number; name: string; minPrice?: number; maxPrice?: number; images?: Array<{ url?: string }> }; quantitySold: number }>; days: number | null; onDaysChange: (d: number | null) => void }) => {
    const tab = days === 7 ? 0 : days === 30 ? 1 : 2;
    const list = data ?? [];
    const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
    return (
        <DashboardCard sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Sản phẩm bán chạy</Typography>
            </Box>
            <Box sx={{ px: 2, mb: 2 }}>
                <Box sx={{ bgcolor: 'var(--palette-background-neutral)', borderRadius: '8px', px: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => onDaysChange(v === 0 ? 7 : v === 1 ? 30 : null)}
                        variant="fullWidth"
                        sx={{
                            width: '100%', minHeight: 48,
                            '& .MuiTabs-indicator': { height: 'calc(100% - 8px)', borderRadius: '8px', bgcolor: 'var(--palette-common-white)', boxShadow: 'var(--customShadows-z1)', zIndex: 0, top: '50%', transform: 'translateY(-50%)' }
                        }}
                    >
                        {['7 ngày qua', '30 ngày qua', 'Tất cả'].map((label, i) => (
                            <Tab key={label} label={label} sx={{ zIndex: 1, minHeight: 52, fontSize: '0.875rem', textTransform: 'none', fontWeight: 600, py: '0px', color: tab === i ? 'var(--palette-text-primary) !important' : 'var(--palette-text-secondary)', opacity: 1 }} />
                        ))}
                    </Tabs>
                </Box>
            </Box>
            <Stack spacing={3} sx={{ p: 3, pt: 0 }}>
                {list.map((item) => (
                    <Stack key={item.product.productId} direction="row" alignItems="center" spacing={2} component={Link} to={`/${prefixAdmin}/product/detail/${item.product.productId}`} sx={{ textDecoration: 'none', color: 'inherit', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Avatar variant="rounded" src={item.product.images?.[0]?.url} sx={{ width: 48, height: 48, bgcolor: 'var(--palette-background-neutral)' }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{item.product.name}</Typography>
                                {item.product.minPrice != null && (
                                    <Box sx={{ px: 0.8, py: 0.2, borderRadius: '6px', bgcolor: 'var(--palette-background-neutral)', fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>
                                        {formatMoney(item.product.minPrice)}
                                    </Box>
                                )}
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5, color: 'var(--palette-text-disabled)' }}>
                                <Icon icon="solar:cart-large-2-bold" width={16} />
                                <Typography variant="caption">Đã bán: {item.quantitySold.toLocaleString()}</Typography>
                            </Stack>
                        </Box>
                        <IconButton size="small" component={Link} to={`/${prefixAdmin}/product/list`} onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0 }}>
                            <Icon icon="eva:chevron-right-fill" width={20} style={{ color: 'var(--palette-text-disabled)' }} />
                        </IconButton>
                    </Stack>
                ))}
                {list.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Chưa có dữ liệu</Typography>}
            </Stack>
            <Box sx={{ p: 2, textAlign: 'right' }}>
                <Button component={Link} to={`/${prefixAdmin}/product/list`} size="small" color="inherit" endIcon={<Icon icon="eva:arrow-ios-forward-fill" />} sx={{ textTransform: 'none', fontWeight: 600 }}>Xem tất cả</Button>
            </Box>
        </DashboardCard>
    );
};

const COLORS = ['#ffab00', '#00b8d9', '#8e33ff', '#00a76f', '#ff5630'];
const TopCustomers = ({ data }: { data?: Array<{ name: string; totalSpent: number; orderCount: number; avatarUrl?: string }> }) => {
    const list = data ?? [];
    const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + 'đ';
    return (
        <DashboardCard sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Khách hàng tiêu biểu</Typography>
                <IconButton size="small" component={Link} to={`/${prefixAdmin}/user/list`}>
                    <Icon icon="eva:chevron-right-fill" width={20} />
                </IconButton>
            </Stack>
            <Stack spacing={3}>
                {list.map((customer, i) => (
                    <Stack key={customer.name + i} direction="row" alignItems="center" spacing={2}>
                        <Avatar src={customer.avatarUrl} sx={{ width: 40, height: 40, bgcolor: COLORS[i % COLORS.length] + '20' }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{customer.name}</Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'var(--palette-text-disabled)' }}>
                                <Icon icon="solar:cart-bold" width={16} />
                                <Typography variant="caption">{formatMoney(customer.totalSpent)} ({customer.orderCount} đơn)</Typography>
                            </Stack>
                        </Box>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: `${COLORS[i % COLORS.length]}14`, color: COLORS[i % COLORS.length]
                        }}>
                            <Icon icon="solar:medal-star-bold" width={20} />
                        </Box>
                    </Stack>
                ))}
                {list.length === 0 && <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>}
            </Stack>
        </DashboardCard>
    );
};

const STAFF_COLORS = ['#00a76f', '#00b8d9', '#ff5630'];

const TopStaff = ({ data }: { data?: Array<{ staffId: number; name: string; avatarUrl?: string; positionName: string; completedTasksCount: number }> }) => {
    const list = data ?? [];
    return (
        <DashboardCard sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Nhân viên tiêu biểu</Typography>
                <IconButton size="small" component={Link} to={`/${prefixAdmin}/staff/profile/list`}>
                    <Icon icon="eva:chevron-right-fill" width={20} />
                </IconButton>
            </Stack>
            <Stack spacing={3}>
                {list.map((staff, i) => (
                    <Stack
                        key={staff.staffId}
                        component={Link}
                        to={`/${prefixAdmin}/staff/profile/detail/${staff.staffId}`}
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ textDecoration: 'none', color: 'inherit', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                    >
                        <Avatar src={staff.avatarUrl} sx={{ width: 40, height: 40, bgcolor: STAFF_COLORS[i % STAFF_COLORS.length] + '20' }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{staff.name}</Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'var(--palette-text-disabled)' }}>
                                <CupIcon size={16} />
                                <Typography variant="caption">{staff.completedTasksCount} công việc hoàn thành</Typography>
                            </Stack>
                        </Box>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: `${STAFF_COLORS[i % STAFF_COLORS.length]}14`, color: STAFF_COLORS[i % STAFF_COLORS.length]
                        }}>
                            <CupIcon />
                        </Box>
                    </Stack>
                ))}
                {list.length === 0 && <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>}
            </Stack>
        </DashboardCard>
    );
};

const ProgressCard = ({ title, total, percent, color, bgIcon }: any) => {
    const isConversion = title === "Conversion";
    const chartColor = isConversion ? "#00a76f" : color || "#00b8d9";

    const chartOptions: any = {
        chart: { sparkline: { enabled: true } },
        stroke: { lineCap: 'round' },
        grid: { padding: { top: -15, bottom: -15 } },
        plotOptions: {
            radialBar: {
                hollow: { size: '62%' },
                track: {
                    background: 'rgba(145, 158, 171, 0.08)',
                    strokeWidth: '100%',
                    margin: 0
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 6,
                        color: 'var(--palette-text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        formatter: (val: number) => `${val}%`,
                    },
                },
            },
        },
        fill: {
            type: 'solid',
            colors: [chartColor]
        },
    };

    return (
        <Box sx={{
            p: 3,
            gap: 3,
            borderRadius: '16px',
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'center',
            bgcolor: 'var(--palette-common-white)',
            border: '1px solid var(--palette-divider)',
            boxShadow: '0 8px 16px -4px rgba(145, 158, 171, 0.04)',
            height: 120,
        }}>
            <Box sx={{
                width: 120,
                height: 120,
                position: 'absolute',
                right: -40,
                opacity: 0.1,
                color: chartColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 0,
            }}>
                {bgIcon}
            </Box>

            <Box sx={{
                width: 80,
                height: 80,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
            }}>
                <Chart
                    type="radialBar"
                    series={[percent]}
                    options={chartOptions}
                    width={80}
                    height={80}
                />
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--palette-text-primary)' }}>{total}</Typography>
                <Typography sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    lineHeight: 1.57143,
                    color: 'var(--palette-text-secondary)',
                    mt: 0.5
                }}>
                    {title}
                </Typography>
            </Box>
        </Box>
    );
};

/** Màu biểu đồ (lặp lại nếu nhiều dịch vụ). */
const SERVICE_CHART_COLORS = [
    '#007867', '#FFAB00', '#00B8D9', '#7635dc', '#2065d1', '#FF5630', '#118D57', '#B76E00', '#003768', '#9C27B0',
];

const ServiceUsageChart = ({
    data,
    serviceSeries,
    year: selectedYearNum,
    onYearChange,
    percentChange
}: {
    data?: Array<{ month: string; serviceCounts: Record<string, number> }>;
    serviceSeries?: Array<{ serviceId: number; name: string }>;
    year: number;
    onYearChange: (y: number) => void;
    percentChange?: number;
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showServices, setShowServices] = useState(false);
    const selectedYear = String(selectedYearNum);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleClose = (year?: string) => {
        if (year != null) {
            const y = parseInt(year, 10);
            if (!Number.isNaN(y)) onYearChange(y);
        }
        setAnchorEl(null);
    };
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i).reverse();
    const dataList = Array.isArray(data) ? data : [];
    const categories = dataList.map((d) => d.month);
    const fallbackCats = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const categoriesFinal = categories.length ? categories : fallbackCats;
    const seriesDefs = Array.isArray(serviceSeries) && serviceSeries.length > 0
        ? serviceSeries
        : [];
    const series = seriesDefs.map((s) => ({
        name: s.name,
        data: dataList.map((d) => Number(d.serviceCounts?.[String(s.serviceId)] ?? 0)),
    }));
    const chartColors = series.map((_, i) => SERVICE_CHART_COLORS[i % SERVICE_CHART_COLORS.length]);
    const chartOptions: any = {
        chart: { type: 'bar', stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: '22.4px', borderRadius: 4 } },
        xaxis: { categories: categoriesFinal, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { show: true } },
        grid: { strokeDashArray: 3, borderColor: 'var(--palette-divider)' },
        legend: { show: false },
        colors: chartColors.length ? chartColors : SERVICE_CHART_COLORS,
        dataLabels: { enabled: false }
    };
    const pct = percentChange != null ? percentChange : 0;
    const pctText = pct >= 0 ? `(+${pct.toFixed(1)}%)` : `(${pct.toFixed(1)}%)`;

    return (
        <DashboardCard sx={{ p: 3, pb: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Thống kê dịch vụ</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--palette-text-secondary)', mt: 0.5 }}>
                        <span style={{ fontWeight: 600, color: pct >= 0 ? 'var(--palette-success-main)' : 'var(--palette-error-main)' }}>{pctText}</span> so với năm ngoái
                    </Typography>
                </Box>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClick}
                    endIcon={<Icon icon={open ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} />}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        bgcolor: 'transparent',
                        color: 'inherit',
                        pr: 'var(--spacing)',
                        pl: 'calc(1.5 * var(--spacing))',
                        gap: 'calc(1.5 * var(--spacing))',
                        height: '34px',
                        borderRadius: 'var(--shape-borderRadius)',
                        fontFamily: '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        lineHeight: 1.57143,
                        border: 'solid 1px rgba(var(--palette-grey-500Channel) / 24%)',
                        textTransform: 'none',
                        '&:hover': {
                            bgcolor: 'rgba(var(--palette-grey-500Channel) / 8%)',
                            border: 'solid 1px rgba(var(--palette-grey-500Channel) / 32%)',
                        }
                    }}
                >
                    {selectedYear}
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => handleClose()}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                        sx: { mt: 1, borderRadius: '12px', boxShadow: 'var(--customShadows-z20)', border: 'solid 1px rgba(145, 158, 171, 0.08)', minWidth: 100, p: 0.5 }
                    }}
                >
                    {yearOptions.map((y) => {
                        const yearStr = String(y);
                        return (
                        <MenuItem
                            key={yearStr}
                            selected={yearStr === selectedYear}
                            onClick={() => handleClose(yearStr)}
                            sx={{
                                borderRadius: '8px',
                                typography: 'body2',
                                fontWeight: yearStr === selectedYear ? 600 : 400,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(var(--palette-grey-500Channel) / 8%)',
                                    '&:hover': { bgcolor: 'rgba(var(--palette-grey-500Channel) / 12%)' }
                                }
                            }}
                        >
                            {yearStr}
                        </MenuItem>
                    );})}
                </Menu>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: series.length > 0 ? 1 : 3 }}>
                {series.length > 0 && (
                    <Button 
                        size="small" 
                        onClick={() => setShowServices(!showServices)}
                        endIcon={<Icon icon={showServices ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} />}
                        sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 600,
                            textTransform: 'none',
                            bgcolor: 'rgba(145, 158, 171, 0.08)',
                            '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.16)' },
                            borderRadius: '8px',
                            px: 2
                        }}
                    >
                        {showServices ? 'Ẩn danh sách dịch vụ chi tiết' : 'Hiển thị danh sách dịch vụ chi tiết'}
                    </Button>
                )}
            </Box>

            <Collapse in={showServices || series.length === 0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3, p: 2, bgcolor: 'var(--palette-background-neutral)', borderRadius: '12px' }}>
                    {series.length === 0 ? (
                        <Typography sx={{ fontSize: '0.875rem', color: 'var(--palette-text-secondary)' }}>
                            Chưa có dịch vụ hoạt động trong hệ thống. Thêm dịch vụ tại mục Quản lý → Dịch vụ.
                        </Typography>
                    ) : (
                        series.map((item, index) => (
                            <Box key={`${item.name}-${index}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: chartOptions.colors[index] }} />
                                    <Typography sx={{ fontSize: '0.813rem', fontWeight: 500 }}>{item.name}</Typography>
                                </Box>
                                <Typography sx={{ mt: 'var(--spacing)', fontWeight: 600, fontSize: '1.125rem' }}>
                                    {item.data.reduce((a, b) => a + b, 0).toLocaleString()}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Collapse>

            {series.length > 0 ? (
                <Chart options={chartOptions} series={series} type="bar" height={280} />
            ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: 'rgba(var(--palette-grey-500Channel) / 8%)' }}>
                    <Typography color="text.secondary">Không có dữ liệu biểu đồ</Typography>
                </Box>
            )}
        </DashboardCard>
    );
};

const formatVnd = (value: unknown) => {
    const n = typeof value === "string" ? parseFloat(value) : Number(value);
    if (!Number.isFinite(n)) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(n);
};

const SystemStats = ({ stats, chartData, ratingSummary }: { stats?: DashboardStatsResponse; chartData?: RevenueChartItem[]; ratingSummary?: RatingSummaryResponse }) => {
    const defaultChartData = [25, 66, 41, 89, 63, 25, 44, 12];
    const customerChartData = (chartData && chartData.length > 0) ? chartData.map((d: any) => d.orders) : defaultChartData;

    const cards = [
        // Row 1
        <SummaryWidget
            key="customer"
            title="Khách hàng"
            total={stats?.totalCustomers?.toLocaleString() ?? "0"}
            percent={8.5}
            color="#00a76f"
            chartData={customerChartData}
            to={`/${prefixAdmin}/user/list`}
        />,
        <SummaryWidget
            key="completed-orders"
            title="Đơn hàng HT"
            total={stats?.completedOrders?.toLocaleString() ?? "0"}
            percent={5.4}
            color="#00b8d9"
            chartData={[15, 32, 45, 32, 56, 32, 44, 55]}
            to={`/${prefixAdmin}/order/list`}
        />,
        <SummaryWidget
            key="sold-products"
            title="Sản phẩm đã bán"
            total={stats?.totalProducts?.toLocaleString() ?? "0"}
            percent={2.6}
            color="#00a76f"
            chartData={defaultChartData}
            to="/admin/product/list"
        />,

        // Row 2
        <SummaryWidget
            key="avg-rating"
            title="Đánh giá TB"
            total={stats?.avgRating != null ? stats.avgRating.toFixed(1) : "0.0"}
            percent={0.2}
            color="#ffab00"
            chartData={[4.5, 4.2, 4.8, 4.5, 4.3, 4.7, 4.5, 4.6]}
            to={`/${prefixAdmin}/feedback/list`}
        />,
        <ProgressCard
            key="rating"
            title="Độ hài lòng (Rating)"
            total={ratingSummary != null ? `${Number(ratingSummary.averageScore).toFixed(1)} / 5.0` : '— / 5.0'}
            percent={ratingSummary != null ? Math.round((ratingSummary.averageScore / 5) * 100) : 0}
            color="#007867"
            bgIcon={
                <svg width="120" height="120" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41l-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"/>
                </svg>
            }
        />,
        <ProgressCard
            key="reviews"
            title="Tương tác người dùng"
            total={ratingSummary != null ? `${ratingSummary.totalCount.toLocaleString()} reviews` : '0 reviews'}
            percent={ratingSummary != null && ratingSummary.totalCount > 0 ? Math.min(100, Math.round(ratingSummary.totalCount / 50)) : 0}
            color="var(--palette-info-dark)"
            bgIcon={
                <svg width="120" height="120" viewBox="0 0 24 24">
                    <path fill="currentColor" fillRule="evenodd" d="M3.172 5.172C2 6.343 2 8.229 2 12s0 5.657 1.172 6.828S6.229 20 10 20h4c3.771 0 5.657 0 6.828-1.172S22 15.771 22 12s0-5.657-1.172-6.828S17.771 4 14 4h-4C6.229 4 4.343 4 3.172 5.172M18.576 7.52a.75.75 0 0 1-.096 1.056l-2.196 1.83c-.887.74-1.605 1.338-2.24 1.746c-.66.425-1.303.693-2.044.693s-1.384-.269-2.045-.693c-.634-.408-1.352-1.007-2.239-1.745L5.52 8.577a.75.75 0 0 1 .96-1.153l2.16 1.799c.933.777 1.58 1.315 2.128 1.667c.529.34.888.455 1.233.455s.704-.114 1.233-.455c.547-.352 1.195-.89 2.128-1.667l2.159-1.8a.75.75 0 0 1 1.056.097" clipRule="evenodd" />
                </svg>
            }
        />,

        // Row 3
        <SummaryWidget
            key="completed-bookings"
            title="Lịch đặt HT"
            total={stats?.completedBookings?.toLocaleString() ?? "0"}
            percent={12.5}
            color="#8e33ff"
            chartData={[10, 22, 18, 25, 30, 24, 28, 35]}
            to={`/${prefixAdmin}/booking/list`}
        />,
        <SummaryWidget
            key="total-orders"
            title="Tổng đơn hàng"
            total={stats?.totalOrders?.toLocaleString() ?? "0"}
            percent={0.6}
            color="#00b8d9"
            chartData={defaultChartData}
            to={`/${prefixAdmin}/order/list`}
        />,
        <SummaryWidget
            key="booking-customers"
            title="Khách đặt lịch (trừ hủy)"
            total={(stats?.bookingCustomersExcludingCancelled ?? 0).toLocaleString()}
            color="#118d57"
            chartData={[12, 18, 14, 22, 19, 24, 20, 26]}
            to={`/${prefixAdmin}/booking/list`}
        />,

        // Row 4
        <SummaryWidget
            key="booking-fully-paid"
            title="Đặt lịch thanh toán đủ"
            total={(stats?.bookingFullyPaidCount ?? 0).toLocaleString()}
            color="#078dee"
            chartData={[8, 12, 10, 15, 14, 18, 16, 20]}
            to={`/${prefixAdmin}/booking/list`}
        />,
        <SummaryWidget
            key="booking-deposits"
            title="Cọc đã thanh toán"
            total={(stats?.bookingDepositsPaidCount ?? 0).toLocaleString()}
            color="#b76e00"
            chartData={[5, 8, 7, 11, 9, 12, 10, 13]}
            to={`/${prefixAdmin}/booking/list`}
        />,
        <SummaryWidget
            key="booking-refunds"
            title="Tiền cọc đã hoàn"
            total={formatVnd(stats?.bookingDepositsRefundedTotal ?? 0)}
            color="#637381"
            chartData={[3, 5, 4, 6, 5, 7, 6, 8]}
            to={`/${prefixAdmin}/booking/list`}
        />,
    ];

    return (
        <Grid
            sx={{
                width: '100%',
                flexBasis: '100%',
                maxWidth: '100%',
                minWidth: 0,
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: 'var(--Grid-rowSpacing) var(--Grid-columnSpacing)',
                boxSizing: 'border-box',
            }}
        >
            {cards.map((card) => (
                <Grid
                    key={card.key}
                    sx={{
                        flexGrow: 0,
                        flexBasis: 'auto',
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                        minWidth: 0,
                    }}
                >
                    {card}
                </Grid>
            ))}
        </Grid>
    );
};

const TIME_RANGE_OPTIONS = ['7 ngày qua', '30 ngày qua', 'Tháng này', 'Tháng trước', 'Năm nay'] as const;
export type TimeRangeLabel = typeof TIME_RANGE_OPTIONS[number];

/** Số ngày dùng cho revenue chart theo lựa chọn thời gian báo cáo (giãn time). */
export function getDaysFromTimeRange(range: TimeRangeLabel): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (range) {
        case '7 ngày qua': return 7;
        case '30 ngày qua': return 30;
        case 'Tháng này': {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            return Math.ceil((today.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)) || 1;
        }
        case 'Tháng trước': {
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
            return lastDay.getDate();
        }
        case 'Năm nay': {
            const first = new Date(now.getFullYear(), 0, 1);
            return Math.ceil((today.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)) || 1;
        }
        default: return 30;
    }
}

// Removed legacy GlobalFilter


export const SystemPage = () => {
    const { user } = useAuthStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTodayRevenueOpen, setIsTodayRevenueOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRangeValue>({
        label: '30 ngày qua',
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs()
    });
    const [serviceStatisticsYear, setServiceStatisticsYear] = useState(new Date().getFullYear());

    const queryClient = useQueryClient();
    
    const startDateStr = dateRange.startDate?.toISOString();
    const endDateStr = dateRange.endDate?.toISOString();

    const { data: statsRes, refetch: refetchStats } = useQuery({
        queryKey: ["dashboard-stats", startDateStr, endDateStr],
        queryFn: () => getDashboardStats(startDateStr, endDateStr)
    });
    const { data: chartRes, refetch: refetchChart } = useQuery({
        queryKey: ["revenue-chart", startDateStr, endDateStr],
        queryFn: () => getRevenueChart(30, startDateStr, endDateStr)
    });
    const { data: topCustomersRes } = useQuery({
        queryKey: ["dashboard-top-customers", startDateStr, endDateStr],
        queryFn: () => getTopCustomers(startDateStr, endDateStr)
    });
    const { data: latestProductsRes } = useQuery({
        queryKey: ["dashboard-latest-products"],
        queryFn: getLatestProducts
    });
    const { data: petDistRes } = useQuery({
        queryKey: ["dashboard-pet-distribution"],
        queryFn: getPetDistribution
    });
    const { data: serviceStatsRes } = useQuery({
        queryKey: ["dashboard-service-statistics", serviceStatisticsYear],
        queryFn: () => getServiceStatistics(serviceStatisticsYear)
    });
    const { data: visitsByRegionRes } = useQuery({
        queryKey: ["dashboard-visits-by-region"],
        queryFn: getVisitsByRegion
    });
    const { data: customerGrowthRes } = useQuery({
        queryKey: ["dashboard-customer-growth"],
        queryFn: getCustomerGrowth
    });
    const [topSellingDays, setTopSellingDays] = useState<number | null>(7);
    const { data: topSellingRes } = useQuery({
        queryKey: ["dashboard-top-selling-products", topSellingDays],
        queryFn: () => getTopSellingProducts(topSellingDays)
    });
    const { data: ratingSummaryRes } = useQuery({
        queryKey: ["dashboard-rating-summary"],
        queryFn: getRatingSummary
    });
    const { data: topStaffRes } = useQuery({
        queryKey: ["dashboard-top-staff"],
        queryFn: getTopStaff
    });

    // API trả về ApiResponse<T> = { success, data: T } — lấy payload từ .data để tránh data.map is not a function
    const payload = <T,>(res: ApiResponse<T> | T | undefined): T | undefined =>
        res != null && typeof res === 'object' && 'data' in res
            ? (res as ApiResponse<T>).data
            : (res as T | undefined);
    const stats: DashboardStatsResponse | undefined = payload(statsRes?.data as unknown as ApiResponse<DashboardStatsResponse>) ?? (statsRes?.data as DashboardStatsResponse);
    const chartData: RevenueChartItem[] = (() => {
        const d = payload(chartRes?.data as unknown as ApiResponse<RevenueChartItem[]>);
        return Array.isArray(d) ? d : (Array.isArray(chartRes?.data) ? (chartRes!.data as RevenueChartItem[]) : []);
    })();
    const topCustomers = ((): Array<{ name: string; totalSpent: number; orderCount: number; avatarUrl?: string }> => {
        const d = payload(topCustomersRes?.data as unknown as ApiResponse<unknown[]>);
        return Array.isArray(d) ? (d as Array<{ name: string; totalSpent: number; orderCount: number; avatarUrl?: string }>) : (Array.isArray(topCustomersRes?.data) ? topCustomersRes.data as Array<{ name: string; totalSpent: number; orderCount: number; avatarUrl?: string }> : []);
    })();
    const latestProducts = ((): Array<{ productId: number; name: string; minPrice?: number; maxPrice?: number; categories?: Array<{ name?: string }>; stockStatus?: string; status?: string }> => {
        const d = payload(latestProductsRes?.data as unknown as ApiResponse<unknown[]>);
        return Array.isArray(d) ? d as Array<{ productId: number; name: string; minPrice?: number; maxPrice?: number; categories?: Array<{ name?: string }>; stockStatus?: string; status?: string }> : (Array.isArray(latestProductsRes?.data) ? latestProductsRes.data : []);
    })();
    const petDistribution = ((): Array<{ label: string; count: number; color: string }> => {
        const d = payload(petDistRes?.data as unknown as ApiResponse<unknown[]>);
        const arr = Array.isArray(d) ? d : (Array.isArray(petDistRes?.data) ? petDistRes.data : []);
        return arr.map((x: { label?: string; count?: number; color?: string }) => ({ label: x?.label ?? '', count: x?.count ?? 0, color: x?.color ?? '#637381' }));
    })();
    const serviceStatistics: ServiceStatisticsWithComparisonResponse | undefined = payload(serviceStatsRes?.data as unknown as ApiResponse<ServiceStatisticsWithComparisonResponse>) ?? (serviceStatsRes?.data as ServiceStatisticsWithComparisonResponse);
    const visitsByRegion: VisitsByRegionResponse | undefined = payload(visitsByRegionRes?.data as unknown as ApiResponse<VisitsByRegionResponse>) ?? (visitsByRegionRes?.data as VisitsByRegionResponse);
    const customerGrowth: CustomerGrowthResponse | undefined = payload(customerGrowthRes?.data as unknown as ApiResponse<CustomerGrowthResponse>) ?? (customerGrowthRes?.data as CustomerGrowthResponse);
    const topSellingProducts: TopSellingProductItem[] = (() => {
        const d = payload(topSellingRes?.data as unknown as ApiResponse<TopSellingProductItem[]>);
        return Array.isArray(d) ? d : (Array.isArray(topSellingRes?.data) ? topSellingRes.data : []);
    })();
    const ratingSummary: RatingSummaryResponse | undefined = payload(ratingSummaryRes?.data as unknown as ApiResponse<RatingSummaryResponse>) ?? (ratingSummaryRes?.data as RatingSummaryResponse);
    const topStaff: TopStaffResponse[] = (() => {
        const d = payload(topStaffRes?.data as unknown as ApiResponse<TopStaffResponse[]>);
        return Array.isArray(d) ? d : (Array.isArray(topStaffRes?.data) ? topStaffRes.data : []);
    })();

    // Mỗi section 1 listener riêng: 1 socket/topic die không ảnh hưởng section khác
    useEffect(() => {
        const handlers: Array<[string, (e: any) => void]> = [
            ["DASHBOARD_SECTION_STATS", (e) => queryClient.setQueryData(["dashboard-stats", startDateStr, endDateStr], { success: true, data: e.detail })],
            ["DASHBOARD_SECTION_REVENUE_CHART", (e) => queryClient.setQueryData(["revenue-chart", startDateStr, endDateStr], { success: true, data: e.detail })],
            ["DASHBOARD_SECTION_TOP_CUSTOMERS", (e) => queryClient.setQueryData(["dashboard-top-customers", startDateStr, endDateStr], { success: true, data: e.detail })],
            ["DASHBOARD_SECTION_LATEST_PRODUCTS", (e) => queryClient.setQueryData(["dashboard-latest-products"], { success: true, data: e.detail })],
            ["DASHBOARD_SECTION_PET_DISTRIBUTION", (e) => queryClient.setQueryData(["dashboard-pet-distribution"], { success: true, data: e.detail })],
            ["DASHBOARD_SECTION_SERVICE_STATISTICS", (e) => queryClient.setQueryData(["dashboard-service-statistics", serviceStatisticsYear], { success: true, data: e.detail })],
            ["DASHBOARD_STATS_UPDATED", (e) => queryClient.setQueryData(["dashboard-stats", startDateStr, endDateStr], { success: true, data: e.detail })],
        ];
        handlers.forEach(([name, fn]) => window.addEventListener(name, fn));
        return () => handlers.forEach(([name, fn]) => window.removeEventListener(name, fn));
    }, [queryClient, startDateStr, endDateStr, serviceStatisticsYear]);

    useEffect(() => {
        const onOrdersRefresh = () => {
            refetchStats();
            refetchChart();
        };
        window.addEventListener("REFRESH_ADMIN_ORDERS", onOrdersRefresh);
        return () => window.removeEventListener("REFRESH_ADMIN_ORDERS", onOrdersRefresh);
    }, [refetchStats, refetchChart]);

    // Auto-scroll carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleNext = () => setActiveIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + CAROUSEL_DATA.length) % CAROUSEL_DATA.length);

    return (
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
            <Grid sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <DashboardDateFilter value={dateRange} onChange={setDateRange} />
                </Box>
            </Grid>


            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <WelcomeWidget
                    title={`Chào mừng trở lại 👋 \\n ${user ? `${user.lastName} ${user.firstName}` : 'Quản trị viên'}`}
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
            </Grid >

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
                    {/* Carousel Content */}
                    <div className="m-auto max-w-full overflow-hidden relative h-full">
                        <ul
                            className="flex list-none p-0 m-0 h-full transition-transform duration-500 ease-in-out"
                            style={{ transform: `translate3d(-${activeIndex * 100}%, 0px, 0px)` }}
                        >
                            {CAROUSEL_DATA.map((item, index) => (
                                <li key={index} className="block relative min-w-0 flex-[0_0_100%] h-full">
                                    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
                                        {/* Text Content Overlay */}
                                        <div className="absolute bottom-0 z-[9] w-full p-[calc(3*var(--spacing))] flex flex-col gap-[var(--spacing)] text-[var(--palette-common-white)]">
                                            <span className="m-0 font-bold text-[0.75rem] uppercase text-[var(--palette-primary-light)]">
                                                Featured App
                                            </span>
                                            <Typography
                                                component="a"
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '1.1875rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {item.title}
                                            </Typography>
                                            <p className="m-0 font-normal text-[0.875rem] leading-[1.57143] overflow-hidden text-ellipsis whitespace-nowrap">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Image with Overlay */}
                                        <span className="relative inline-block align-bottom w-full h-full overflow-hidden">
                                            <span className="absolute top-0 left-0 w-full h-full z-[1] bg-[linear-gradient(to_bottom,transparent_0%,var(--palette-common-black)_75%)]"></span>
                                            <img
                                                alt={item.title}
                                                className="top-0 left-0 w-full h-full object-cover vertical-middle"
                                                src={item.image}
                                            />
                                        </span>
                                    </Box>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Navigation Dots */}
                    <ul className="absolute z-[10] flex gap-[2px] h-[20px] top-[16px] left-[16px] text-[var(--palette-primary-light)] list-none p-0 m-0">
                        {CAROUSEL_DATA.map((_, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    aria-label={`dot-${index}`}
                                    onClick={() => setActiveIndex(index)}
                                    className={`inline-flex items-center justify-center relative bg-transparent border-none p-0 cursor-pointer w-[20px] h-[20px] 
                                               before:content-[''] before:w-[8px] before:h-[8px] before:rounded-full before:bg-current 
                                               before:transition-[width,opacity] before:duration-200 before:ease-[cubic-bezier(0.4,0,0.6,1)]
                                               ${index === activeIndex ? 'before:opacity-100' : 'before:opacity-[0.24]'}`}
                                />
                            </li>
                        ))}
                    </ul>

                    {/* Carousel Arrows */}
                    <div className="absolute top-[8px] right-[8px] z-[10] inline-flex items-center gap-[4px] text-[var(--palette-common-white)]">
                        <button
                            type="button"
                            aria-label="Prev button"
                            onClick={handlePrev}
                            className="inline-flex items-center justify-center relative bg-transparent cursor-pointer rounded-full p-[var(--spacing)] border-none transition-all duration-250 ease-[cubic-bezier(0.4,0,0.6,1)] hover:bg-[rgba(255,255,255,0.08)]"
                        >
                            <svg className="user-select-none inline-block flex-shrink-0 fill-current text-[1.5rem] w-[20px] h-[20px] transition-fill duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
                                <path fill="currentColor" fillRule="evenodd" d="M15.488 4.43a.75.75 0 0 1 .081 1.058L9.988 12l5.581 6.512a.75.75 0 1 1-1.138.976l-6-7a.75.75 0 0 1 0-.976l6-7a.75.75 0 0 1 1.057-.081" clipRule="evenodd"></path>
                            </svg>
                        </button>
                        <button
                            type="button"
                            aria-label="Next button"
                            onClick={handleNext}
                            className="inline-flex items-center justify-center relative bg-transparent cursor-pointer rounded-full p-[var(--spacing)] border-none transition-all duration-250 ease-[cubic-bezier(0.4,0,0.6,1)] hover:bg-[rgba(255,255,255,0.08)]"
                        >
                            <svg className="user-select-none inline-block flex-shrink-0 fill-current text-[1.5rem] w-[20px] h-[20px] transition-fill duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
                                <path fill="currentColor" fillRule="evenodd" d="M8.512 4.43a.75.75 0 0 1 1.057.082l6 7a.75.75 0 0 1 0 .976l-6 7a.75.75 0 0 1-1.138-.976L14.012 12L8.431 5.488a.75.75 0 0 1 .08-1.057" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </DashboardCard>
            </Grid>
            {/* Stats Cards */}
            <SystemStats stats={stats} chartData={chartData} ratingSummary={ratingSummary} />


            {/* Sales & Balance Section */}
            <Grid
                sx={{
                    flexBasis: 'auto', flexGrow: 0, 
                    width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <SalesOverview stats={stats} isLoading={!stats} hideCosts />
            </Grid>

            <Grid
                sx={{
                    flexBasis: 'auto', flexGrow: 0, 
                    width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <CurrentBalance stats={stats} isLoading={!stats} hideWithdraw hideLowStock onOpenStats={() => setIsTodayRevenueOpen(true)} />
            </Grid>

            {/* Doanh thu theo thời gian */}
            <Grid
                sx={{
                    flexBasis: 'auto', flexGrow: 0, 
                    width: '100%',
                }}
            >
                <RevenueOverTimeChart />
            </Grid>

            {/* Ngay sau Doanh số tổng quan: Phân bổ thú cưng (trái) + Thống kê dịch vụ (phải) */}
            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <PetDistributionChart data={petDistribution} />
            </Grid>

            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <ServiceUsageChart
                    data={serviceStatistics?.months}
                    serviceSeries={serviceStatistics?.services}
                    year={serviceStatisticsYear}
                    onYearChange={setServiceStatisticsYear}
                    percentChange={serviceStatistics?.percentChange}
                />
            </Grid>

            {/* Sản phẩm mới (đẩy lên trước) + Top bán chạy */}
            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 8 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 8) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <NewProductsTable data={latestProducts} />
            </Grid>

            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <TopSellingProducts data={topSellingProducts} days={topSellingDays} onDaysChange={setTopSellingDays} />
            </Grid>

            {/* Tăng trưởng thành viên (trái) + Lượt truy cập theo vùng (phải) */}
            <Grid
                sx={{
                    flexBasis: 'auto', flexGrow: 0, alignSelf: 'flex-start',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <CustomerGrowthChart data={customerGrowth} />
            </Grid>

            <Grid
                sx={{
                    flexBasis: 'auto', flexGrow: 0, alignSelf: 'flex-start',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <CurrentVisitsChart data={visitsByRegion} />
            </Grid>

            {/* Bottom Section */}
            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <TopCustomers data={topCustomers} />
            </Grid>

            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <TopStaff data={topStaff} />
            </Grid>
            
            <TodayRevenueModal open={isTodayRevenueOpen} onClose={() => setIsTodayRevenueOpen(false)} />
        </Grid >
    );
};
