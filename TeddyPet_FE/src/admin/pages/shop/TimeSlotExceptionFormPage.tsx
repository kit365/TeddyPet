import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Stack, TextField, Button, FormControlLabel, Checkbox, MenuItem, Typography } from '@mui/material';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Title } from '../../components/ui/Title';
import { CollapsibleCard } from '../../components/ui/CollapsibleCard';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { prefixAdmin } from '../../constants/routes';
import { useTimeSlotExceptionDetail, useCreateOrUpdateTimeSlotException } from './hooks/useTimeSlotException';
import { useServices } from '../service/hooks/useService';
import { toast } from 'react-toastify';

const FONT_LARGE = { fontSize: '0.9375rem', '& .MuiInputBase-input': { fontSize: '0.9375rem' }, '& .MuiInputLabel-root': { fontSize: '0.9375rem' }, '& .MuiFormHelperText-root': { fontSize: '0.8125rem' } };
const LABEL_FONT = { fontSize: '0.875rem' };

const schema = z
    .object({
        timeExceptionName: z.string().min(1, 'Tên ngoại lệ là bắt buộc'),
        startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
        endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
        scope: z.string(),
        exceptionType: z.string().optional(),
        reason: z.string().optional(),
        isRecurring: z.boolean(),
        recurrencePattern: z.string().optional(),
        serviceId: z.number().nullable().optional(),
    })
    .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
        message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
        path: ['endDate'],
    });

type FormValues = z.infer<typeof schema>;

const toDateStr = (d: string | Date) => {
    if (!d) return '';
    const x = new Date(d);
    return x.toISOString().slice(0, 10);
};

export const TimeSlotExceptionFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(true);
    const isEdit = !!id;
    const { data: detailRes, isLoading } = useTimeSlotExceptionDetail(id);
    const { data: servicesData } = useServices();
    const services = servicesData ?? [];
    const { mutate: upsert, isPending } = useCreateOrUpdateTimeSlotException();

    const { control, handleSubmit, reset, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            timeExceptionName: '',
            startDate: '',
            endDate: '',
            scope: 'STORE',
            exceptionType: 'Holiday',
            reason: '',
            isRecurring: false,
            recurrencePattern: 'YEARLY',
            serviceId: null,
        },
    });

    useEffect(() => {
        if (detailRes?.success && detailRes.data) {
            const d = detailRes.data;
            reset({
                timeExceptionName: d.timeExceptionName ?? '',
                startDate: toDateStr(d.startDate),
                endDate: toDateStr(d.endDate),
                scope: d.scope ?? 'STORE',
                exceptionType: d.exceptionType ?? 'Holiday',
                reason: d.reason ?? '',
                isRecurring: !!d.isRecurring,
                recurrencePattern: d.recurrencePattern ?? 'YEARLY',
                serviceId: d.serviceId ?? null,
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: FormValues) => {
        const scope = data.serviceId == null ? 'STORE' : 'SERVICE';
        upsert(
            {
                id: isEdit ? Number(id) : undefined,
                timeExceptionName: data.timeExceptionName,
                startDate: data.startDate,
                endDate: data.endDate,
                scope,
                exceptionType: data.exceptionType || null,
                reason: data.reason || null,
                isRecurring: data.isRecurring,
                recurrencePattern: data.isRecurring ? (data.recurrencePattern || 'YEARLY') : null,
                serviceId: data.serviceId ?? null,
            },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Đã lưu');
                        navigate(`/${prefixAdmin}/time-slot-exception/list`);
                    } else {
                        toast.error((res as any)?.message ?? 'Lỗi');
                    }
                },
                onError: () => toast.error('Không thể lưu'),
            }
        );
    };

    if (isEdit && isLoading) return <div className="p-8" style={{ fontSize: '0.9375rem' }}>Đang tải...</div>;

    return (
        <div className="mb-[40px]" style={{ fontSize: '0.9375rem' }}>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={isEdit ? 'Sửa ngoại lệ' : 'Thêm ngoại lệ'} sx={{ fontSize: '1.625rem' }} />
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Cài đặt lịch', to: `/${prefixAdmin}/shop-operation-hours` },
                            { label: 'Ngoại lệ', to: `/${prefixAdmin}/time-slot-exception/list` },
                            { label: isEdit ? 'Sửa' : 'Thêm' },
                        ]}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack sx={{ margin: '0px 120px', gap: '40px' }}>
                    <CollapsibleCard title="Thông tin" subheader="Chi tiết ngoại lệ" expanded={expanded} onToggle={() => setExpanded((p) => !p)}>
                        <Stack p="24px" gap="24px" sx={{ fontSize: '0.9375rem' }}>
                            <Controller
                                name="timeExceptionName"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        label="Tên ngoại lệ"
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        fullWidth
                                        placeholder="VD: Tết, 30/4, Bảo trì"
                                        sx={FONT_LARGE}
                                    />
                                )}
                            />
                            <Controller
                                name="serviceId"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                        select
                                        label="Phạm vi áp dụng"
                                        fullWidth
                                        sx={FONT_LARGE}
                                        helperText="Để trống = áp dụng cho toàn cửa hàng; chọn dịch vụ = chỉ áp dụng cho dịch vụ đó"
                                    >
                                        <MenuItem value="" sx={LABEL_FONT}>Toàn cửa hàng (Store)</MenuItem>
                                        {services.map((s) => (
                                            <MenuItem key={s.id} value={s.id} sx={LABEL_FONT}>
                                                {s.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="exceptionType"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Loại ngoại lệ" fullWidth sx={FONT_LARGE}>
                                        <MenuItem value="Holiday" sx={LABEL_FONT}>Ngày lễ</MenuItem>
                                        <MenuItem value="Maintenance" sx={LABEL_FONT}>Bảo trì</MenuItem>
                                        <MenuItem value="Special Event" sx={LABEL_FONT}>Sự kiện đặc biệt</MenuItem>
                                        <MenuItem value="Other" sx={LABEL_FONT}>Khác</MenuItem>
                                    </TextField>
                                )}
                            />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} type="date" label="Từ ngày" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth InputLabelProps={{ shrink: true }} sx={FONT_LARGE} />
                                    )}
                                />
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} type="date" label="Đến ngày" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth InputLabelProps={{ shrink: true }} sx={FONT_LARGE} />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="isRecurring"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={!!field.value} />}
                                        label={<Typography sx={{ fontSize: '0.875rem' }}>Lặp lại hàng năm (VD: Giỗ tổ, 30/4)</Typography>}
                                    />
                                )}
                            />
                            {watch('isRecurring') && (
                                <Controller
                                    name="recurrencePattern"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Chu kỳ lặp" fullWidth sx={FONT_LARGE}>
                                            <MenuItem value="YEARLY" sx={LABEL_FONT}>Hàng năm (YEARLY)</MenuItem>
                                            <MenuItem value="MONTHLY" sx={LABEL_FONT}>Hàng tháng (MONTHLY)</MenuItem>
                                        </TextField>
                                    )}
                                />
                            )}
                            <Controller
                                name="reason"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Ghi chú / lý do" multiline rows={2} fullWidth sx={FONT_LARGE} />}
                            />
                        </Stack>
                    </CollapsibleCard>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button type="button" variant="outlined" onClick={() => navigate(`/${prefixAdmin}/time-slot-exception/list`)} sx={{ fontSize: '0.875rem' }}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained" disabled={isPending} sx={{ background: '#1C252E', fontSize: '0.875rem', '&:hover': { background: '#454F5B' } }}>
                            {isPending ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </div>
    );
};
