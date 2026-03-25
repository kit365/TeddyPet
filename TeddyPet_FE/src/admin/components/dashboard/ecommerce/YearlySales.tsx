import { Box, Typography, Menu, MenuItem, Button } from "@mui/material";
import DashboardCard from "../DashboardCard";
import Chart from 'react-apexcharts';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRevenueChart } from "../../../api/dashboard.api";
import { useState, useEffect } from "react";
import { Icon } from '@iconify/react';

export const YearlySales = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRange, setSelectedRange] = useState(30);
    const queryClient = useQueryClient();

    const { data: res, isLoading } = useQuery({
        queryKey: ["revenue-chart", selectedRange],
        queryFn: () => getRevenueChart(selectedRange)
    });

    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["revenue-chart"] });
        };
        window.addEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
        return () => window.removeEventListener('DASHBOARD_STATS_UPDATED', handleUpdate);
    }, [queryClient]);

    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = (days?: number) => {
        if (days) setSelectedRange(days);
        setAnchorEl(null);
    };

    const chartData = res?.data || [];
    
    const chartOptions: any = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            dropShadow: {
                enabled: true,
                top: 10,
                left: 0,
                blur: 10,
                color: ['#00A76F', '#FFAB00'],
                opacity: 0.1
            }
        },
        colors: ['#00A76F', '#FFAB00'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: {
            categories: chartData.map(d => d.label),
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                    return val;
                }
            }
        },
        grid: {
            strokeDashArray: 3,
            borderColor: 'rgba(145, 158, 171, 0.08)'
        },
        tooltip: {
            x: { show: false },
            y: {
                formatter: (val: number) => val.toLocaleString() + 'đ'
            },
            marker: { show: false }
        }
    };

    const series = [
        {
            name: 'Doanh thu',
            data: chartData.map(d => d.revenue)
        }
    ];

    return (
        <DashboardCard>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Biểu đồ doanh thu</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>(+2.5%) so với tháng trước</Typography>
                </Box>

                <Button
                    onClick={handleClick}
                    endIcon={<Icon icon={open ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} />}
                    sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        bgcolor: 'rgba(145, 158, 171, 0.08)',
                        '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.16)' }
                    }}
                >
                    {selectedRange} ngày qua
                </Button>
                <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
                    <MenuItem onClick={() => handleClose(7)}>7 ngày qua</MenuItem>
                    <MenuItem onClick={() => handleClose(30)}>30 ngày qua</MenuItem>
                    <MenuItem onClick={() => handleClose(90)}>90 ngày qua</MenuItem>
                </Menu>
            </Box>

            <Box sx={{ p: 3, pt: 0 }}>
                {isLoading ? (
                    <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Typography color="textSecondary">Đang tải biểu đồ...</Typography>
                    </Box>
                ) : (
                    <Chart options={chartOptions} series={series} type="area" height={320} />
                )}
            </Box>
        </DashboardCard>
    );
};
