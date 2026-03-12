import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getOrderStatus } from "../../constants/status";

interface StatusConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    newStatus: string;
    isUpdating: boolean;
    currentStatus?: string;
}

export const StatusConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    newStatus,
    isUpdating,
}: StatusConfirmDialogProps) => {
    const statusInfo = getOrderStatus(newStatus);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: '24px', p: 0, maxWidth: 500, width: '100%' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#00AB55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <HelpOutlineIcon sx={{ fontSize: '1.125rem' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.125rem', color: '#1C252E' }}>
                        Xác nhận chuyển trạng thái
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: '#F4F6F8' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 4, py: 2 }}>
                <Typography sx={{ mb: 2, fontSize: '0.875rem', color: '#637381' }}>
                    Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái:
                </Typography>

                <Box
                    sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: `${statusInfo.bgColor}`,
                        border: `1px dashed ${statusInfo.color}`,
                        textAlign: 'center'
                    }}
                >
                    <Typography sx={{ color: statusInfo.color, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>
                        {statusInfo.label}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    sx={{ py: 1.5, borderRadius: '12px', color: '#637381', borderColor: '#E5E8EB', fontWeight: 800 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onConfirm}
                    disabled={isUpdating}
                    sx={{
                        py: 1.5, borderRadius: '12px', fontWeight: 800,
                        bgcolor: '#00AB55',
                        boxShadow: '0 8px 16px rgba(0, 171, 85, 0.24)',
                        '&:hover': { bgcolor: '#007B55' },
                        '&:disabled': { bgcolor: '#E5E8EB' }
                    }}
                >
                    {isUpdating ? 'Đang xử lý...' : 'Đồng ý, chuyển luôn!'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
