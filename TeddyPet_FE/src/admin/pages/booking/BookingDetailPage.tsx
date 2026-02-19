import { useParams, useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { prefixAdmin } from "../../constants/routes";

export const BookingDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/${prefixAdmin}/booking/list`)}>
                Trở lại
            </Button>
            <Typography variant="h5" sx={{ mt: 2 }}>
                Chi tiết đặt lịch #{id ?? "—"}
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>Nội dung sẽ được bổ sung.</Typography>
        </Box>
    );
};
