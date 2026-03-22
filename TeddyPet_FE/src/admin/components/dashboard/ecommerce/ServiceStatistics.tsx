import { Box, Typography, MenuItem, TextField } from "@mui/material";
import DashboardCard from "../DashboardCard";
import Chart from 'react-apexcharts';
import { useQuery } from "@tanstack/react-query";
import { getServiceStatistics, type ServiceStatisticsWithComparisonResponse } from "../../../api/dashboard.api";
import { useMemo, useState } from "react";
import type { ApiResponse } from "../../../../types/common.type";

const CHART_COLORS = ['#00a76f', '#ffab00', '#00b8d9', '#7635dc', '#2065d1', '#FF5630', '#118D57', '#B76E00'];

export const ServiceStatistics = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(String(currentYear));
    const yearNum = parseInt(year, 10);

    const { data: res, isLoading } = useQuery({
        queryKey: ["service-statistics", yearNum],
        queryFn: () => getServiceStatistics(Number.isNaN(yearNum) ? currentYear : yearNum),
    });

    const payload = useMemo((): ServiceStatisticsWithComparisonResponse | undefined => {
        if (res == null) return undefined;
        const r = res as unknown as ApiResponse<ServiceStatisticsWithComparisonResponse> | ServiceStatisticsWithComparisonResponse;
        if (typeof r === 'object' && r !== null && 'data' in r && r.data != null) {
            return r.data as ServiceStatisticsWithComparisonResponse;
        }
        return r as ServiceStatisticsWithComparisonResponse;
    }, [res]);

    const data = Array.isArray(payload?.months) ? payload.months : [];
    const months = data.map((d) => d.month);
    const serviceSeries = Array.isArray(payload?.services) ? payload.services : [];

    const series = serviceSeries.map((s) => ({
        name: s.name,
        data: data.map((d) => Number(d.serviceCounts?.[String(s.serviceId)] ?? 0)),
    }));

    const colors = series.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    const pct = payload?.percentChange ?? 0;
    const pctText = pct >= 0 ? `(+${pct.toFixed(1)}%)` : `(${pct.toFixed(1)}%)`;

    const chartOptions: any = {
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
        },
        colors: colors.length ? colors : CHART_COLORS,
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

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i).reverse();

    return (
        <DashboardCard sx={{ height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Thống kê dịch vụ</Typography>
                    <Typography variant="body2" sx={{ color: pct >= 0 ? '#00a76f' : 'error.main', fontWeight: 700 }}>
                        {pctText} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>so với năm ngoái</Box>
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
                    {yearOptions.map((y) => (
                        <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{ p: 3, pt: 0 }}>
                {isLoading ? (
                    <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Đang tải...</Typography>
                    </Box>
                ) : series.length === 0 ? (
                    <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Chưa có dịch vụ hoạt động hoặc chưa có dữ liệu.</Typography>
                    </Box>
                ) : (
                    <Chart options={chartOptions} series={series} type="bar" height={360} />
                )}
            </Box>
        </DashboardCard>
    );
};
