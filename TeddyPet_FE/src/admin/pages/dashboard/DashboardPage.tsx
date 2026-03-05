import { Box } from "@mui/material";
import { DashboardStats } from "./sections/DashboardStats";
import { DashboardWelcome } from "./sections/DashboardWelcome";
import { DashboardChart } from "./sections/DashboardChart";
import { DashboardOrders } from "./sections/DashboardOrders";
import { DashboardOrderStatusChart } from "./sections/DashboardOrderStatusChart";

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
                <DashboardOrderStatusChart />
            </Box>

            <DashboardOrders />
        </Box>
    )
}
