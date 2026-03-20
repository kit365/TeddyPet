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

const SummaryWidget = ({ title, total, percent, color = '#00a76f', chartData, showChart = true, to }: SummaryWidgetProps) => {

    const chartOptions: any = {
        chart: {
            sparkline: { enabled: true },
            animations: { enabled: true }
        },
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
            type: 'gradient',
            gradient: {
                colorStops: [
                    { offset: 0, color: color, opacity: 1 },
                    { offset: 100, color: color, opacity: 1 },
                ]
            }
        },
        colors: [color],
        tooltip: { enabled: false },
        states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } }
        },
        grid: { padding: { top: 2, bottom: 2 } }
    };

    const content = (
        <DashboardCard sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 'calc(2.5 * var(--spacing))',
            cursor: to ? 'pointer' : 'default',
            '&:hover': to ? {
                bgcolor: 'rgba(145, 158, 171, 0.04)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
            } : {}
        }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: '2.1rem', fontWeight: 800, fontFamily: 'Public Sans, sans-serif', color: 'text.primary', lineHeight: 1 }}>
                    {total}
                </Typography>

                {percent !== undefined && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: percent >= 0 ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255, 86, 48, 0.16)',
                            color: percent >= 0 ? 'rgb(17, 141, 87)' : 'rgb(183, 29, 71)',
                        }}>
                            <Icon 
                                icon={percent >= 0 ? "solar:double-alt-arrow-up-bold-duotone" : "solar:double-alt-arrow-down-bold-duotone"} 
                                width={14}
                            />
                        </Box>
                        <Typography variant="subtitle2" sx={{ 
                            fontWeight: 700,
                            color: percent >= 0 ? 'rgb(17, 141, 87)' : 'rgb(183, 29, 71)',
                            fontSize: '0.875rem'
                        }}>
                            {percent >= 0 ? '+' : ''}{percent}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            so với tháng trước
                        </Typography>
                    </Stack>
                )}
            </Box>

            {showChart && chartData && (
                <Box sx={{ width: 100, height: 66, mt: 1 }}>
                    <Chart type="line" series={[{ data: chartData }]} options={chartOptions} width={100} height={66} />
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
