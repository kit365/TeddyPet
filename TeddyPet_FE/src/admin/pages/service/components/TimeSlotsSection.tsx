import { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton,
} from '@mui/material';
import { CollapsibleCard } from '../../../components/ui/CollapsibleCard';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTimeSlotsByService, createOrUpdateTimeSlot, deleteTimeSlot } from '../../../api/time-slot.api';
import type { ITimeSlot, DayType, SlotType } from '../../../api/time-slot.api';
import { toast } from 'react-toastify';

const DAY_TYPES: { value: DayType; label: string }[] = [
    { value: 'WEEKDAY', label: 'Ngày thường' },
    { value: 'WEEKEND', label: 'Cuối tuần' },
    { value: 'HOLIDAY', label: 'Ngày lễ' },
];

const SLOT_TYPES: { value: SlotType; label: string }[] = [
    { value: 'REGULAR', label: 'Bình thường' },
    { value: 'PEAK', label: 'Cao điểm' },
    { value: 'OFF_PEAK', label: 'Thấp điểm' },
    { value: 'SPECIAL', label: 'Đặc biệt' },
];

const toTimeStr = (v: string) => (v ? String(v).slice(0, 5) : '');

interface TimeSlotsSectionProps {
    serviceId: number | null;
    expanded?: boolean;
    /** Gọi khi serviceId chưa có - để parent tạo dịch vụ trước. Trả về serviceId nếu thành công. */
    onEnsureService?: () => Promise<number | null>;
}

export const TimeSlotsSection = ({ serviceId, expanded: expandedProp = true, onEnsureService }: TimeSlotsSectionProps) => {
    const queryClient = useQueryClient();
    const [isEnsuring, setIsEnsuring] = useState(false);
    const [expanded, setExpanded] = useState(expandedProp);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ITimeSlot | null>(null);
    const [form, setForm] = useState({
        dayType: 'WEEKDAY' as DayType,
        startTime: '08:00',
        endTime: '09:00',
        maxCapacity: 1,
        slotType: 'REGULAR' as SlotType,
        notes: '',
    });

    const { data: slots = [], isLoading } = useQuery({
        queryKey: ['time-slots', serviceId],
        queryFn: () => getTimeSlotsByService(serviceId!),
        select: (res) => res.data ?? [],
        enabled: !!serviceId && serviceId > 0,
    });

    const { mutate: upsert, isPending: isUpserting } = useMutation({
        mutationFn: createOrUpdateTimeSlot,
        onSuccess: (res: any) => {
            if (res?.success) {
                toast.success(res.message ?? 'Đã lưu');
                queryClient.invalidateQueries({ queryKey: ['time-slots', serviceId] });
                setShowForm(false);
                setEditing(null);
                setForm({ dayType: 'WEEKDAY', startTime: '08:00', endTime: '09:00', maxCapacity: 1, slotType: 'REGULAR', notes: '' });
            } else toast.error(res?.message ?? 'Lỗi');
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu khung giờ';
            toast.error(msg);
        },
    });

    const { mutate: remove } = useMutation({
        mutationFn: deleteTimeSlot,
        onSuccess: (res: any) => {
            if (res?.success) {
                toast.success(res.message ?? 'Đã xóa');
                queryClient.invalidateQueries({ queryKey: ['time-slots', serviceId] });
                setEditing(null);
            } else toast.error(res?.message ?? 'Lỗi');
        },
    });

    const handleSave = () => {
        if (!serviceId) {
            toast.warning('Cần lưu dịch vụ trước khi thêm khung giờ');
            return;
        }
        upsert({
            id: editing?.id ?? undefined,
            serviceId,
            dayType: form.dayType,
            startTime: form.startTime,
            endTime: form.endTime,
            maxCapacity: form.maxCapacity,
            slotType: form.slotType,
            notes: form.notes || null,
        });
    };

    const handleEdit = (slot: ITimeSlot) => {
        setEditing(slot);
        setForm({
            dayType: slot.dayType,
            startTime: toTimeStr(slot.startTime),
            endTime: toTimeStr(slot.endTime),
            maxCapacity: slot.maxCapacity ?? 1,
            slotType: slot.slotType ?? 'REGULAR',
            notes: slot.notes ?? '',
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Bạn có chắc muốn xóa khung giờ này?')) remove(id);
    };

    const FONT = { fontSize: '1.25rem', '& .MuiInputBase-input': { fontSize: '1.25rem' }, '& .MuiInputLabel-root': { fontSize: '1.25rem' } };

    const handleEnsureAndAdd = async () => {
        if (!onEnsureService) {
            toast.warning('Cần lưu dịch vụ trước khi thêm khung giờ.');
            return;
        }
        setIsEnsuring(true);
        try {
            const id = await onEnsureService();
            if (id) setShowForm(true);
        } catch {
            // onEnsureService shows toast on error
        } finally {
            setIsEnsuring(false);
        }
    };

    if (!serviceId || serviceId <= 0) {
        return (
            <CollapsibleCard title="Khung giờ" subheader="Thêm các khung giờ cho dịch vụ" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                <Box p={3}>
                    <Typography color="text.secondary" sx={{ fontSize: '1.25rem', mb: 2 }}>Lưu dịch vụ trước khi thêm khung giờ.</Typography>
                    {onEnsureService && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleEnsureAndAdd}
                            disabled={isEnsuring}
                            sx={{ fontSize: '1.25rem' }}
                        >
                            {isEnsuring ? 'Đang tạo dịch vụ...' : 'Thêm khung giờ'}
                        </Button>
                    )}
                </Box>
            </CollapsibleCard>
        );
    }

    return (
        <CollapsibleCard title="Khung giờ" subheader="Các khung giờ có thể đặt cho dịch vụ" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
            <Stack p="24px" gap={2} sx={{ fontSize: '1.25rem' }}>
                {!showForm ? (
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowForm(true)} size="medium" sx={{ fontSize: '1.25rem' }}>
                        Thêm khung giờ
                    </Button>
                ) : (
                    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-end">
                        <TextField select label="Loại ngày" value={form.dayType} onChange={(e) => setForm((f) => ({ ...f, dayType: e.target.value as DayType }))} size="medium" sx={{ minWidth: 160, ...FONT }}>
                            {DAY_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>
                                    {t.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField type="time" label="Từ" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} size="medium" InputLabelProps={{ shrink: true }} sx={FONT} />
                        <TextField type="time" label="Đến" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} size="medium" InputLabelProps={{ shrink: true }} sx={FONT} />
                        <TextField type="number" label="Số pet tối đa" value={form.maxCapacity} onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value) || 1 }))} size="medium" sx={{ width: 120, ...FONT }} inputProps={{ min: 1 }} />
                        <TextField select label="Loại slot" value={form.slotType} onChange={(e) => setForm((f) => ({ ...f, slotType: e.target.value as SlotType }))} size="medium" sx={{ minWidth: 140, ...FONT }}>
                            {SLOT_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>
                                    {t.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Ghi chú" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} size="medium" sx={{ minWidth: 180, ...FONT }} />
                        <Button variant="contained" onClick={handleSave} disabled={isUpserting} size="medium" sx={{ fontSize: '1.25rem' }}>
                            {isUpserting ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                        <Button variant="outlined" onClick={() => { setShowForm(false); setEditing(null); }} size="medium" sx={{ fontSize: '1.25rem' }}>
                            Hủy
                        </Button>
                    </Stack>
                )}

                <Table size="medium" sx={{ '& .MuiTableCell-root': { fontSize: '1.25rem', py: 2 } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }}>Loại ngày</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }}>Giờ</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }}>Số pet tối đa</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }}>Loại slot</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }}>Ghi chú</TableCell>
                            <TableCell width={100} sx={{ fontWeight: 700, fontSize: '1.375rem', py: 2 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} sx={{ fontSize: '1.25rem' }}>Đang tải...</TableCell></TableRow>
                        ) : slots.length === 0 ? (
                            <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary', fontSize: '1.25rem', py: 4 }}>Chưa có khung giờ nào</TableCell></TableRow>
                        ) : (
                            slots.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell sx={{ fontSize: '1.25rem' }}>{DAY_TYPES.find((t) => t.value === s.dayType)?.label ?? s.dayType}</TableCell>
                                    <TableCell sx={{ fontSize: '1.25rem' }}>{toTimeStr(s.startTime)} - {toTimeStr(s.endTime)}</TableCell>
                                    <TableCell sx={{ fontSize: '1.25rem' }}>{s.maxCapacity}</TableCell>
                                    <TableCell sx={{ fontSize: '1.25rem' }}>{SLOT_TYPES.find((t) => t.value === s.slotType)?.label ?? s.slotType}</TableCell>
                                    <TableCell sx={{ fontSize: '1.25rem' }}>{s.notes || '—'}</TableCell>
                                    <TableCell>
                                        <IconButton size="medium" onClick={() => handleEdit(s)}><EditIcon fontSize="medium" /></IconButton>
                                        <IconButton size="medium" onClick={() => handleDelete(s.id)} color="error"><DeleteIcon fontSize="medium" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Stack>
        </CollapsibleCard>
    );
};
