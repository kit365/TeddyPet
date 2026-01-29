import { Box, Card, Stack, Typography } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArticleIcon from '@mui/icons-material/Article';

const stats = [
    {
        title: "Tổng doanh thu",
        value: "128,450,000₫",
        change: "+12.5%",
        isUp: true,
        icon: <AttachMoneyIcon sx={{ fontSize: "3rem", color: "#007B55" }} />,
        bgColor: "#C8FACD"
    },
    {
        title: "Đơn hàng mới",
        value: "156",
        change: "+8.2%",
        isUp: true,
        icon: <ShoppingBagIcon sx={{ fontSize: "3rem", color: "#005249" }} />,
        bgColor: "#D0F9FB"
    },
    {
        title: "Khách hàng",
        value: "1,240",
        change: "-2.4%",
        isUp: false,
        icon: <PeopleIcon sx={{ fontSize: "3rem", color: "#7A4F01" }} />,
        bgColor: "#FFF7CD"
    },
    {
        title: "Bài viết",
        value: "48",
        change: "+4.1%",
        isUp: true,
        icon: <ArticleIcon sx={{ fontSize: "3rem", color: "#7A0C2E" }} />,
        bgColor: "#FFE7D9"
    }
];

export const DashboardStats = () => {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px",
                mb: "40px"
            }}
        >
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    sx={{
                        p: "24px",
                        borderRadius: "24px",
                        boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px"
                    }}
                >
                    <Box
                        sx={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: stat.bgColor
                        }}
                    >
                        {stat.icon}
                    </Box>
                    <Stack>
                        <Typography sx={{ color: "#637381", fontSize: "1.4rem", fontWeight: 600 }}>
                            {stat.title}
                        </Typography>
                        <Typography sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#1C252E", my: "4px" }}>
                            {stat.value}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            {stat.isUp ? (
                                <TrendingUpIcon sx={{ color: "#00A76F", fontSize: "1.6rem" }} />
                            ) : (
                                <TrendingDownIcon sx={{ color: "#FF5630", fontSize: "1.6rem" }} />
                            )}
                            <Typography sx={{ color: stat.isUp ? "#00A76F" : "#FF5630", fontSize: "1.3rem", fontWeight: 600 }}>
                                {stat.change}
                            </Typography>
                            <Typography sx={{ color: "#919EAB", fontSize: "1.3rem" }}>
                                so với tháng trước
                            </Typography>
                        </Stack>
                    </Stack>
                </Card>
            ))}
        </Box>
    );
};
