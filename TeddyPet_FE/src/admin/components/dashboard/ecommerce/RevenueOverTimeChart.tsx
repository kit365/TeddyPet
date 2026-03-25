import { useState } from 'react';
import { Box, Typography, Tabs, Tab, FormControl, Select, MenuItem, Stack, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getRevenueChart } from '../../../api/dashboard.api';
import DashboardCard from '../DashboardCard';
import { ApexOptions } from 'apexcharts';

export const RevenueOverTimeChart = () => {
    const [viewMode, setViewMode] = useState<0 | 1 | 2>(1); // 0: Tuần, 1: Tháng, 2: Năm
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
    const [selectedYear, setSelectedYear] = useState(dayjs().year());

    let startDate: string | undefined;
    let endDate: string | undefined;
    let type: 'DAY' | 'MONTH' | undefined;
    let days = 30;

    const today = dayjs();

    if (viewMode === 0) {
        // Tuần (7 ngày qua)
        endDate = today.endOf('day').toISOString();
        startDate = today.subtract(6, 'day').startOf('day').toISOString();
        days = 7;
        type = 'DAY';
    } else if (viewMode === 1) {
        // Tháng (chọn tháng/năm)
        const date = dayjs().year(selectedYear).month(selectedMonth);
        startDate = date.startOf('month').toISOString();
        endDate = date.endOf('month').toISOString();
        days = date.daysInMonth();
        type = 'DAY';
    } else {
        // Năm (chọn năm)
        const date = dayjs().year(selectedYear);
        startDate = date.startOf('year').toISOString();
        endDate = date.endOf('year').toISOString();
        days = 365;
        type = 'MONTH';
    }

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['revenueOverTime', viewMode, selectedMonth, selectedYear],
        queryFn: () => getRevenueChart(days, startDate, endDate, type)
    });

    const actualData = chartData && 'data' in chartData ? (chartData.data as any[]) : (Array.isArray(chartData) ? chartData : []);
    const categories = actualData.map(d => d.label) || [];
    const revenueSeries = actualData.map(d => d.revenue) || [];

    const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

    const chartOptions: ApexOptions = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            dropShadow: { enabled: true, color: 'var(--palette-primary-main)', top: 18, left: 7, blur: 10, opacity: 0.1 }
        },
        colors: ['var(--palette-primary-main)'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: 'var(--palette-text-secondary)', fontSize: '0.75rem' } }
        },
        yaxis: {
            labels: {
                style: { colors: 'var(--palette-text-secondary)', fontSize: '0.75rem' },
                formatter: (val) => formatMoney(val)
            }
        },
        grid: {
            borderColor: 'var(--palette-divider)',
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        tooltip: {
            y: { formatter: (val) => formatMoney(val) }
        }
    };

    const currentYear = dayjs().year();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const monthOptions = Array.from({ length: 12 }, (_, i) => i);

    return (
        <DashboardCard sx={{ p: 3, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Doanh thu theo thời gian</Typography>
                </Box>
                
                <Stack direction="row" alignItems="center" spacing={2}>
                    {/* Controls */}
                    {viewMode === 1 && (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                sx={{ 
                                    borderRadius: 1.5, 
                                    bgcolor: 'var(--palette-background-neutral)',
                                    '& fieldset': { border: 'none' },
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            >
                                {monthOptions.map((m) => (
                                    <MenuItem key={m} value={m} sx={{ fontSize: '0.875rem' }}>Tháng {m + 1}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {(viewMode === 1 || viewMode === 2) && (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                sx={{ 
                                    borderRadius: 1.5, 
                                    bgcolor: 'var(--palette-background-neutral)',
                                    '& fieldset': { border: 'none' },
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            >
                                {yearOptions.map((y) => (
                                    <MenuItem key={y} value={y} sx={{ fontSize: '0.875rem' }}>Năm {y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Box sx={{ bgcolor: 'var(--palette-background-neutral)', borderRadius: '8px', px: '4px', display: 'flex', alignItems: 'center' }}>
                        <Tabs
                            value={viewMode}
                            onChange={(_, newValue) => setViewMode(newValue)}
                            sx={{
                                minHeight: 40,
                                '& .MuiTabs-indicator': { 
                                    height: 'calc(100% - 8px)', 
                                    borderRadius: '6px', 
                                    bgcolor: 'var(--palette-common-white)', 
                                    boxShadow: 'var(--customShadows-z1)', 
                                    zIndex: 0, 
                                    top: '50%', 
                                    transform: 'translateY(-50%)' 
                                }
                            }}
                        >
                            <Tab label="Tuần" sx={{ zIndex: 1, minHeight: 40, py: 0, fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', color: viewMode === 0 ? 'text.primary' : 'text.secondary' }} />
                            <Tab label="Tháng" sx={{ zIndex: 1, minHeight: 40, py: 0, fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', color: viewMode === 1 ? 'text.primary' : 'text.secondary' }} />
                            <Tab label="Năm" sx={{ zIndex: 1, minHeight: 40, py: 0, fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', color: viewMode === 2 ? 'text.primary' : 'text.secondary' }} />
                        </Tabs>
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 320, position: 'relative' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <Chart 
                        options={chartOptions} 
                        series={[{ name: 'Doanh thu', data: revenueSeries }]} 
                        type="area" 
                        height="100%" 
                    />
                )}
            </Box>
        </DashboardCard>
    );
};
