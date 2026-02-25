import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    IconButton,
    Stack,
    DialogActions,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import { useCreateRoomBlocking } from '../hooks/useRoom';
import dayjs from 'dayjs';

interface RoomBlockingDialogProps {
    open: boolean;
    onClose: () => void;
    roomId: number;
    roomNumber: string;
}

interface FormValues {
    blockReason: string;
    blockedFrom: string;
    blockedTo: string;
    blockedBy: string;
}

const toDatetimeLocal = (d: dayjs.Dayjs) => d.format('YYYY-MM-DDTHH:mm');

export const RoomBlockingDialog = ({ open, onClose, roomId, roomNumber }: RoomBlockingDialogProps) => {
    const { mutate: createBlocking, isPending } = useCreateRoomBlocking();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            blockReason: '',
            blockedFrom: toDatetimeLocal(dayjs()),
            blockedTo: toDatetimeLocal(dayjs().add(1, 'day')),
            blockedBy: '',
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                blockReason: '',
                blockedFrom: toDatetimeLocal(dayjs()),
                blockedTo: toDatetimeLocal(dayjs().add(1, 'day')),
                blockedBy: '',
            });
        }
    }, [open, reset]);

    const onSubmit = (data: FormValues) => {
        createBlocking(
            {
                roomId,
                blockReason: data.blockReason?.trim() || null,
                blockedFrom: dayjs(data.blockedFrom).toISOString(),
                blockedTo: dayjs(data.blockedTo).toISOString(),
                blockedBy: data.blockedBy?.trim() || null,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Khóa phòng thành công. Trạng thái phòng đã được đặt là BLOCKED.');
                        onClose();
                    } else {
                        toast.error((res as { message?: string })?.message ?? 'Có lỗi');
                    }
                },
                onError: () => toast.error('Có lỗi khi khóa phòng'),
            }
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Khóa phòng — {roomNumber}
                <IconButton onClick={onClose} size="small" aria-label="đóng">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack gap={2} pt={1}>
                        <Controller
                            name="blockReason"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Lý do khóa" multiline rows={2} fullWidth size="small" />
                            )}
                        />
                        <Controller
                            name="blockedFrom"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Từ ngày — giờ"
                                    type="datetime-local"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                        <Controller
                            name="blockedTo"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Đến ngày — giờ"
                                    type="datetime-local"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                        <Controller
                            name="blockedBy"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Người khóa (ghi chú)" fullWidth size="small" />}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={isPending}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained" disabled={isPending} sx={{ bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B' } }}>
                        {isPending ? 'Đang xử lý...' : 'Khóa phòng'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
