import { Box, Typography } from "@mui/material";
import Chart from 'react-apexcharts';
import DashboardCard from "./DashboardCard";
import { Link as RouterLink } from "react-router-dom";
import { Stack } from "@mui/material";
import { Icon } from '@iconify/react';

interface SummaryWidgetProps {
    title: string;
    total: string;
    percent?: number;
    color?: string;
    chartData?: number[];
    showChart?: boolean;
    to?: string;
}

const SummaryWidget = ({ title, total, percent, color = '#0062ff', chartData, showChart = true, to }: SummaryWidgetProps) => {

    const chartOptions: any = {
        chart: {
            sparkline: { enabled: true },
            animations: { enabled: true }
        },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 100],
                colorStops: [
                    { offset: 0, color: color, opacity: 0.4 },
                    { offset: 100, color: color, opacity: 0 },
                ]
            }
        },
        colors: [color],
        tooltip: { enabled: false },
        markers: {
            size: 0,
            hover: { size: 4 }
        },
        dataLabels: { enabled: false }
    };

    const content = (
        <DashboardCard sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 3,
            bgcolor: 'background.paper',
            border: '1px solid rgba(145, 158, 171, 0.16)',
            boxShadow: 'none',
            cursor: to ? 'pointer' : 'default',
            '&:hover': {
                boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.15)',
                transform: to ? 'translateY(-2px)' : 'none',
                transition: 'all 0.3s ease'
            }
        }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: '2.25rem', fontWeight: 700, fontFamily: 'Public Sans, sans-serif', color: 'text.primary', lineHeight: 1 }}>
                    {total}
                </Typography>

                {percent !== undefined && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            borderRadius: '4px',
                            bgcolor: percent >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 86, 48, 0.1)',
                            color: percent >= 0 ? '#118d57' : '#b71d47',
                        }}>
                            <Icon 
                                icon={percent >= 0 ? "solar:trend-up-bold-duotone" : "solar:trend-down-bold-duotone"} 
                                width={12}
                            />
                        </Box>
                        <Typography variant="subtitle2" sx={{ 
                            fontWeight: 700,
                            color: percent >= 0 ? '#118d57' : '#b71d47',
                            fontSize: '0.813rem'
                        }}>
                            {percent >= 0 ? '+' : ''}{percent}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                            so với tháng trước
                        </Typography>
                    </Stack>
                )}
            </Box>

            {showChart && chartData && (
                <Box sx={{ width: 100, height: 60, mt: 1 }}>
                    <Chart type="area" series={[{ data: chartData }]} options={chartOptions} width={100} height={60} />
                </Box>
            )}
        </DashboardCard>
    );

    if (to) {
        return (
            <RouterLink to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
                {content}
            </RouterLink>
        );
    }

    return content;
};

export default SummaryWidget;
