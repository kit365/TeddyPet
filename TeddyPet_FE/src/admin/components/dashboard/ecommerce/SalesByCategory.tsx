import { Box, Typography, Divider } from "@mui/material";
import DashboardCard from "../DashboardCard";
import Chart from 'react-apexcharts';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesByCategory } from "../../../api/dashboard.api";
import { useEffect } from "react";

export const SalesByCategory = () => {
    const queryClient = useQueryClient();
    const { data: res, isLoading } = useQuery({
        queryKey: ["sales-by-category"],
        queryFn: getSalesByCategory
    });

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["sales-by-category"] });
        };
        window.addEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
        return () => window.removeEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
    }, [queryClient]);

    const data = res?.data || [];
    const labels = data.map(item => item.categoryName);
    const series = data.map(item => {
        const totalRaw = data.reduce((acc, curr) => acc + curr.count, 0);
        return totalRaw > 0 ? Math.round((item.count / totalRaw) * 100) : 0;
    });

    const chartOptions: any = {
        chart: { type: 'radialBar' },
        labels: labels.length > 0 ? labels : ['Đang tải...'],
        stroke: { lineCap: 'round' },
        plotOptions: {
            radialBar: {
                hollow: { size: '40%' },
                track: {
                    background: 'rgba(145, 158, 171, 0.08)',
                    strokeWidth: '100%',
                },
                dataLabels: {
                    name: {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--palette-text-secondary)',
                        offsetY: -10,
                    },
                    value: {
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--palette-text-primary)',
                        offsetY: 5,
                        formatter: (val: number) => `${val}%`,
                    },
                    total: {
                        show: true,
                        label: 'Tổng số lượng',
                        formatter: () => data.reduce((acc, curr) => acc + curr.count, 0).toLocaleString(),
                    }
                }
            }
        },
        colors: ['#00a76f', '#ffab00', '#00b8d9', '#8e33ff'],
        legend: { show: false }
    };

    return (
        <DashboardCard sx={{ height: '100%' }}>
            <Box sx={{ p: 3, pb: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Doanh số theo loài</Typography>
            </Box>

            <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading ? (
                     <Typography color="textSecondary">Đang tải...</Typography>
                ) : (
                    <Chart options={chartOptions} series={series.length > 0 ? series : [0]} type="radialBar" width={300} height={300} />
                )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {labels.map((label: string, index: number) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: chartOptions.colors[index] }} />
                        <Typography sx={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--palette-text-secondary)' }}>{label}</Typography>
                    </Box>
                ))}
            </Box>
        </DashboardCard>
    );
};
