import { Box, Typography } from "@mui/material";
import DashboardCard from "../DashboardCard";
import Chart from 'react-apexcharts';
import { useQuery } from "@tanstack/react-query";
import { getPetDistribution } from "../../../api/dashboard.api";

export const PetDistribution = () => {
    const { data: res, isLoading } = useQuery({
        queryKey: ["pet-distribution"],
        queryFn: getPetDistribution
    });

    const data = res?.data || [];
    const labels = data.map((d: any) => d.label);
    const series = data.map((d: any) => d.count);
    const colors = data.map((d: any) => d.color);

    const total = series.reduce((a: number, b: number) => a + b, 0);

    const chartOptions: any = {
        chart: {
            type: 'donut',
        },
        labels: labels,
        colors: colors.length > 0 ? colors : ['#00a76f', '#36b37e', '#1a3b32'],
        stroke: { show: false },
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            itemMargin: { horizontal: 10, vertical: 5 },
            markers: { radius: 12 }
        },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '90%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Tổng',
                            formatter: () => total.toLocaleString(),
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#637381'
                        },
                        value: {
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#212b36',
                            formatter: (val: string) => val
                        }
                    }
                }
            }
        },
        tooltip: {
            fillSeriesColor: false,
        }
    };

    return (
        <DashboardCard sx={{ height: '100%' }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Phân bổ thú cưng</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Thống kê theo chủng loại</Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading ? (
                    <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Đang tải...</Typography>
                    </Box>
                ) : (
                    <Chart options={chartOptions} series={series} type="donut" height={360} width="100%" />
                )}
            </Box>
        </DashboardCard>
    );
};
