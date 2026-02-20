import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Box, MenuItem, Select, InputLabel, FormControl, Checkbox, ListItemText } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { servicePricingUpsertSchema, type ServicePricingUpsertFormValues } from '../../../schemas/service-pricing.schema';
import { SwitchButton } from '../../../components/ui/SwitchButton';
import type { IServicePricing } from '../configs/types';
import { usePetTypes } from '../hooks/useEnums';

type Props = {
    open: boolean;
    onClose: () => void;
    serviceId: number;
    editingRule: IServicePricing | null;
    onSubmit: (data: ServicePricingUpsertFormValues) => void;
    isPending?: boolean;
};

export const ServicePricingFormModal = ({ open, onClose, serviceId, editingRule, onSubmit, isPending }: Props) => {
    const { data: petTypes = [] } = usePetTypes();
    const { control, handleSubmit, reset } = useForm<ServicePricingUpsertFormValues>({
        resolver: zodResolver(servicePricingUpsertSchema),
        defaultValues: {
            serviceId,
            pricingName: '',
            price: 0,
            suitablePetTypes: [],
            weekendMultiplier: null,
            peakSeasonMultiplier: null,
            holidayMultiplier: null,
            minWeight: null,
            maxWeight: null,
            effectiveFrom: '',
            effectiveTo: '',
            priority: 0,
            isActive: true,
        },
    });

    const handleOpen = () => {
        if (editingRule) {
            reset({
                pricingId: editingRule.pricingId,
                serviceId: editingRule.serviceId,
                pricingName: editingRule.pricingName,
                price: editingRule.price,
                suitablePetTypes: (editingRule.suitablePetTypes ?? '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                weekendMultiplier: editingRule.weekendMultiplier ?? undefined,
                peakSeasonMultiplier: editingRule.peakSeasonMultiplier ?? undefined,
                holidayMultiplier: editingRule.holidayMultiplier ?? undefined,
                minWeight: editingRule.minWeight ?? undefined,
                maxWeight: editingRule.maxWeight ?? undefined,
                effectiveFrom: editingRule.effectiveFrom ? editingRule.effectiveFrom.slice(0, 16) : '',
                effectiveTo: editingRule.effectiveTo ? editingRule.effectiveTo.slice(0, 16) : '',
                priority: editingRule.priority,
                isActive: editingRule.isActive,
            });
        } else {
            reset({
                serviceId,
                pricingName: '',
                price: 0,
                suitablePetTypes: [],
                weekendMultiplier: null,
                peakSeasonMultiplier: null,
                holidayMultiplier: null,
                minWeight: null,
                maxWeight: null,
                effectiveFrom: '',
                effectiveTo: '',
                priority: 0,
                isActive: true,
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth onTransitionEnter={handleOpen}>
            <DialogTitle>{editingRule ? 'Sửa quy tắc giá' : 'Thêm quy tắc giá'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack gap={2} pt={1}>
                        <Controller
                            name="pricingName"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Tên quy tắc" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                            )}
                        />
                        <Controller
                            name="price"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label="Giá (VNĐ)"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    fullWidth
                                    onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || 0)}
                                />
                            )}
                        />
                        <Controller
                            name="suitablePetTypes"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel id="pricing-suitable-pet-types-label">Loại thú cưng phù hợp</InputLabel>
                                    <Select
                                        labelId="pricing-suitable-pet-types-label"
                                        multiple
                                        value={field.value ?? []}
                                        label="Loại thú cưng phù hợp"
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        onChange={(e) => field.onChange(e.target.value as string[])}
                                    >
                                        {petTypes.map((pt) => (
                                            <MenuItem key={pt} value={pt}>
                                                <Checkbox checked={(field.value ?? []).includes(pt)} />
                                                <ListItemText primary={pt} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            <Controller
                                name="minWeight"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        label="Cân nặng tối thiểu (kg)"
                                        fullWidth
                                        onChange={(e) => {
                                            const v = (e.target as HTMLInputElement).value;
                                            field.onChange(v === '' ? null : Number(v));
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="maxWeight"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        label="Cân nặng tối đa (kg)"
                                        fullWidth
                                        onChange={(e) => {
                                            const v = (e.target as HTMLInputElement).value;
                                            field.onChange(v === '' ? null : Number(v));
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                            <Controller
                                name="weekendMultiplier"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        label="Hệ số cuối tuần"
                                        fullWidth
                                        onChange={(e) => {
                                            const v = (e.target as HTMLInputElement).value;
                                            field.onChange(v === '' ? null : Number(v));
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="peakSeasonMultiplier"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        label="Hệ số mùa cao điểm"
                                        fullWidth
                                        onChange={(e) => {
                                            const v = (e.target as HTMLInputElement).value;
                                            field.onChange(v === '' ? null : Number(v));
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="holidayMultiplier"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        label="Hệ số ngày lễ"
                                        fullWidth
                                        onChange={(e) => {
                                            const v = (e.target as HTMLInputElement).value;
                                            field.onChange(v === '' ? null : Number(v));
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            <Controller
                                name="effectiveFrom"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="datetime-local"
                                        label="Hiệu lực từ"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Để trống nếu áp dụng ngay."
                                    />
                                )}
                            />
                            <Controller
                                name="effectiveTo"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="datetime-local"
                                        label="Hiệu lực đến"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Để trống nếu không có ngày kết thúc."
                                    />
                                )}
                            />
                        </Box>

                        <Controller
                            name="priority"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label="Thứ tự ưu tiên"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    fullWidth
                                    onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value) || 0)}
                                />
                            )}
                        />
                        <SwitchButton control={control} name="isActive" label="Trạng thái (đang áp dụng)" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {isPending ? 'Đang lưu...' : editingRule ? 'Cập nhật' : 'Thêm'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
