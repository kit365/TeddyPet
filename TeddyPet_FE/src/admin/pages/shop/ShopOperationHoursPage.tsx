import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { useShopOperationHours, useUpsertShopOperationHoursBatch, DAY_NAMES } from './hooks/useShopOperationHours';
import type { IShopOperationHour } from '../../../api/shop-operation-hours.api';
import {
    Card,
    CardContent,
    Box,
    Stack,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import ScheduleIcon from '@mui/icons-material/Schedule';

const toTimeStr = (v: string | null | undefined) => (v ? String(v).slice(0, 5) : '');

const getEmptyRow = (dayOfWeek: number): Partial<IShopOperationHour> & { dayOfWeek: number } => ({
    dayOfWeek,
    openTime: '08:00',
    closeTime: '20:00',
    isDayOff: dayOfWeek === 7,
    breakStartTime: '12:00',
    breakEndTime: '13:00',
});

const fillRows = (list: IShopOperationHour[]) => {
    const byDay: Record<number, IShopOperationHour> = {};
    list.forEach((r) => (byDay[r.dayOfWeek] = r));
    return [1, 2, 3, 4, 5, 6, 7].map((d) => byDay[d] ?? { ...getEmptyRow(d), id: 0 });
};

export const ShopOperationHoursPage = () => {
    const navigate = useNavigate();
    const { data: hours = [], isLoading } = useShopOperationHours();
    const { mutate: upsertBatch, isPending } = useUpsertShopOperationHoursBatch();

    const [rows, setRows] = useState<Array<Partial<IShopOperationHour> & { dayOfWeek: number }>>([]);

    useEffect(() => {
        if (hours.length > 0) {
            setRows(fillRows(hours));
        } else {
            setRows([1, 2, 3, 4, 5, 6, 7].map((d) => getEmptyRow(d)));
        }
    }, [hours]);

    const updateRow = (dayOfWeek: number, updates: Partial<IShopOperationHour>) => {
        setRows((prev) => prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...updates } : r)));
    };

    const handleSave = () => {
        const payload = rows.map((r) => ({
            id: r.id || undefined,
            dayOfWeek: r.dayOfWeek,
            openTime: r.isDayOff ? null : (r.openTime || '08:00'),
            closeTime: r.isDayOff ? null : (r.closeTime || '20:00'),
            isDayOff: !!r.isDayOff,
            breakStartTime: r.isDayOff ? null : (r.breakStartTime || null),
            breakEndTime: r.isDayOff ? null : (r.breakEndTime || null),
        }));

        upsertBatch(payload, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success('Đã lưu giờ hoạt động');
                else toast.error((res as any)?.message ?? 'Lỗi');
            },
            onError: () => toast.error('Không thể lưu'),
        });
    };

    return (
        <>
            <ListHeader
                title="Giờ hoạt động & ngày lễ"
                titleSx={{ fontSize: '1.625rem' }}
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Cài đặt lịch' },
                ]}
                action={
                    <Button
                        onClick={() => navigate(`/${prefixAdmin}/time-slot-exception/list`)}
                        variant="outlined"
                        sx={{ textTransform: 'none', fontSize: '0.9375rem' }}
                    >
                        Quản lý ngoại lệ
                    </Button>
                }
            />

            <Card sx={{ borderRadius: '16px', overflow: 'hidden', mx: 5, fontSize: '0.9375rem' }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" gap={2} mb={3}>
                        <ScheduleIcon sx={{ color: '#ffbaa0', fontSize: '1.75rem' }} />
                        <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Giờ hoạt động theo ngày trong tuần</Typography>
                    </Stack>

                    {isLoading ? (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Table size="medium" sx={{ '& .MuiTableCell-root': { fontSize: '0.9375rem' }, '& th': { fontWeight: 700, fontSize: '0.9375rem' } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Thứ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Nghỉ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Giờ mở cửa</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Giờ đóng cửa</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Nghỉ trưa từ</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>Nghỉ trưa đến</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((r) => (
                                    <TableRow key={r.dayOfWeek}>
                                        <TableCell sx={{ fontSize: '0.9375rem' }}>{DAY_NAMES[r.dayOfWeek] ?? `Thứ ${r.dayOfWeek}`}</TableCell>
                                        <TableCell sx={{ fontSize: '0.9375rem' }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={!!r.isDayOff}
                                                        onChange={(e) => updateRow(r.dayOfWeek, { isDayOff: e.target.checked })}
                                                    />
                                                }
                                                label={<span style={{ fontSize: '0.9375rem' }}>{r.isDayOff ? 'Nghỉ' : 'Làm'}</span>}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                size="medium"
                                                value={toTimeStr(r.openTime)}
                                                onChange={(e) => updateRow(r.dayOfWeek, { openTime: e.target.value })}
                                                disabled={!!r.isDayOff}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                InputProps={{ sx: { fontSize: '0.9375rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                size="medium"
                                                value={toTimeStr(r.closeTime)}
                                                onChange={(e) => updateRow(r.dayOfWeek, { closeTime: e.target.value })}
                                                disabled={!!r.isDayOff}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                InputProps={{ sx: { fontSize: '0.9375rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                size="medium"
                                                value={toTimeStr(r.breakStartTime)}
                                                onChange={(e) => updateRow(r.dayOfWeek, { breakStartTime: e.target.value || null })}
                                                disabled={!!r.isDayOff}
                                                InputLabelProps={{ shrink: true }}
                                                placeholder="12:00"
                                                fullWidth
                                                InputProps={{ sx: { fontSize: '0.9375rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                size="medium"
                                                value={toTimeStr(r.breakEndTime)}
                                                onChange={(e) => updateRow(r.dayOfWeek, { breakEndTime: e.target.value || null })}
                                                disabled={!!r.isDayOff}
                                                InputLabelProps={{ shrink: true }}
                                                placeholder="13:00"
                                                fullWidth
                                                InputProps={{ sx: { fontSize: '0.9375rem' } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <Box mt={3}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isPending}
                            sx={{ background: '#1C252E', fontSize: '0.9375rem', py: 1.5, '&:hover': { background: '#454F5B' } }}
                        >
                            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </>
    );
};
