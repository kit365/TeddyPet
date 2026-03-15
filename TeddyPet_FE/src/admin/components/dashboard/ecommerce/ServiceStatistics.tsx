import { Box, Typography, MenuItem, TextField } from "@mui/material";
import DashboardCard from "../DashboardCard";
import Chart from 'react-apexcharts';
import { useQuery } from "@tanstack/react-query";
import { getServiceStatistics } from "../../../api/dashboard.api";
import { useState } from "react";

export const ServiceStatistics = () => {
    const [year, setYear] = useState('2024');
    const { data: res, isLoading } = useQuery({
        queryKey: ["service-statistics"],
        queryFn: getServiceStatistics
    });

    // API trả về ApiResponse<ServiceStatisticsWithComparisonResponse> → payload.data hoặc payload.months
    const payload = res != null && typeof res === 'object' && 'data' in res ? (res as { data: { months?: unknown[] } }).data : res as { months?: unknown[] } | undefined;
    const data = Array.isArray(payload?.months) ? payload.months : [];
    const months = data.map((d: any) => d.month);

    // Service categories
    const categories = ["Cắt tỉa", "Khám bệnh", "Huấn luyện"];
    const colors = ['#00a76f', '#ffab00', '#00b8d9'];

    const series = categories.map(cat => ({
        name: cat,
        data: data.map((d: any) => d.serviceCounts?.[cat] ?? 0)
    }));

    const chartOptions: any = {
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
        },
        colors: colors,
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '25%',
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: months,
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                    return val;
                }
            }
        },
        grid: {
            strokeDashArray: 3,
            borderColor: 'rgba(145, 158, 171, 0.08)',
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontWeight: 600,
            itemMargin: { horizontal: 10, vertical: 5 },
            markers: { radius: 12 }
        },
        tooltip: {
            y: {
                formatter: (val: number) => val.toLocaleString() + ' lượt'
            }
        }
    };

    return (
        <DashboardCard sx={{ height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Thống kê dịch vụ</Typography>
                    <Typography variant="body2" sx={{ color: '#00a76f', fontWeight: 700 }}>
                        (+43%) <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>so với năm ngoái</Box>
                    </Typography>
                </Box>

                <TextField
                    select
                    size="small"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    SelectProps={{
                        sx: { fontWeight: 600, fontSize: '0.875rem' }
                    }}
                >
                    <MenuItem value="2023">2023</MenuItem>
                    <MenuItem value="2024">2024</MenuItem>
                </TextField>
            </Box>

            <Box sx={{ p: 3, pt: 0 }}>
                {isLoading ? (
                    <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Đang tải...</Typography>
                    </Box>
                ) : (
                    <Chart options={chartOptions} series={series} type="bar" height={360} />
                )}
            </Box>
        </DashboardCard>
    );
};
