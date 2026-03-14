import { Box, Typography } from "@mui/material";
import Chart from 'react-apexcharts';
import DashboardCard from "./DashboardCard";

interface SummaryWidgetProps {
    title: string;
    total: string;
    percent?: number;
    color?: string;
    chartData?: number[];
    showChart?: boolean;
}

const SummaryWidget = ({ title, total, color = '#00a76f', chartData, showChart = true }: SummaryWidgetProps) => {

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

    return (
        <DashboardCard sx={{ display: 'flex', alignItems: 'center', p: 'calc(2.5 * var(--spacing))' }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: '2.4rem', fontWeight: 800, fontFamily: 'Public Sans, sans-serif', color: 'text.primary', lineHeight: 1 }}>
                    {total}
                </Typography>
            </Box>

            {showChart && chartData && (
                <Box sx={{ width: 100, height: 66, mt: 1 }}>
                    <Chart type="line" series={[{ data: chartData }]} options={chartOptions} width={100} height={66} />
                </Box>
            )}
        </DashboardCard>
    );
};

export default SummaryWidget;
