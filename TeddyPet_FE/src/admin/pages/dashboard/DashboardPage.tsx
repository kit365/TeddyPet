import { Grid, Box, Typography } from "@mui/material";
import { DashboardStats } from "./sections/DashboardStats";
import { DashboardWelcome } from "./sections/DashboardWelcome";
import { DashboardChart } from "./sections/DashboardChart";
import { DashboardOrders } from "./sections/DashboardOrders";

export const DashboardPage = () => {
    return (
        <Box sx={{ pb: 8 }}>
            <DashboardWelcome />

            <DashboardStats />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                    gap: "24px",
                    mb: "40px"
                }}
            >
                <DashboardChart />
                <Box
                    sx={{
                        p: 3,
                        bgcolor: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.8rem", mb: "24px", color: "#1C252E" }}>
                        Báo cáo nhanh
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafb', borderRadius: '16px', border: '1px dashed #e5e7eb' }}>
                        <Typography sx={{ fontSize: '1.4rem', color: '#637381', textAlign: 'center', px: 3 }}>
                            Tính năng báo cáo chi tiết đang được phát triển...
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <DashboardOrders />
        </Box>
    )
}
