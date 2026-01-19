import { Box, Typography } from "@mui/material";

export const DashboardWelcome = () => {
    return (
        <Box
            sx={{
                p: "40px",
                borderRadius: "32px",
                background: "linear-gradient(135deg, rgba(91, 228, 155, 0.2), rgba(0, 167, 111, 0.2))",
                color: "#004B50",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
                overflow: "hidden",
                mb: "40px"
            }}
        >
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: "2.4rem" }}>
                Chào mừng trở lại! 👋
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.6rem", opacity: 0.8, maxWidth: "480px" }}>
                Hôm nay là một ngày tuyệt vời để quản lý cửa hàng TeddyPet của bạn. Hãy kiểm tra các số liệu mới nhất bên dưới.
            </Typography>

            {/* Trang trí */}
            <Box
                sx={{
                    position: "absolute",
                    right: "40px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "120px",
                    height: "120px",
                    opacity: 0.1,
                    background: "currentColor",
                    borderRadius: "50%",
                    filter: "blur(40px)"
                }}
            />
        </Box>
    );
};
