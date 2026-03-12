import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Autocomplete,
    Typography,
    Box,
    InputAdornment,
    Stack,
    IconButton,
    Divider,
    FormControlLabel,
    Switch
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useState, useEffect, useMemo } from "react";
import { ShippingRule, CreateShippingRuleRequest } from "../../../../types/shipping.type";
import { createShippingRule, updateShippingRule } from "../../../api/shipping.api";
import { toast } from "react-toastify";
import { PROVINCES } from "../configs/provinces";
import { COLORS } from "../../product/configs/constants"; // Import system colors

interface ShippingRuleFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ShippingRule | null;
}

export const ShippingRuleFormDialog = ({ open, onClose, onSuccess, initialData }: ShippingRuleFormDialogProps) => {
    const [formData, setFormData] = useState<CreateShippingRuleRequest>({
        isInnerCity: true,
        provinceId: 79,
        fixedFee: 0,
        freeShipThreshold: 0,
        feePerKm: 5000,
        freeShipDistanceKm: 1.5,
        maxInternalDistanceKm: 10,
        isSelfShip: true,
        minFee: 0,
        baseWeight: 0,
        overWeightFee: 0,
        note: ""
    });
    const [loading, setLoading] = useState(false);

    // Simulation states
    const [testDistance, setTestDistance] = useState<number>(5);
    const [testOrderTotal, setTestOrderTotal] = useState<number>(500000);
    const [testWeight, setTestWeight] = useState<number>(1);

    useEffect(() => {
        if (initialData) {
            setFormData({
                isInnerCity: initialData.isInnerCity,
                provinceId: initialData.provinceId,
                fixedFee: 0,
                freeShipThreshold: initialData.freeShipThreshold ?? 0,
                feePerKm: initialData.feePerKm ?? 5000,
                freeShipDistanceKm: initialData.freeShipDistanceKm ?? 1.5,
                maxInternalDistanceKm: initialData.maxInternalDistanceKm ?? 10,
                isSelfShip: initialData.isSelfShip ?? true,
                minFee: initialData.minFee ?? 0,
                baseWeight: initialData.baseWeight ?? 0,
                overWeightFee: initialData.overWeightFee ?? 0,
                note: initialData.note || ""
            });
        }
    }, [initialData, open]);

    const previewResult = useMemo(() => {
        // Freeship by Distance
        if (testDistance < (formData.freeShipDistanceKm || 0)) return 0;

        // Freeship by Order Total
        if (formData.freeShipThreshold && formData.freeShipThreshold > 0 && testOrderTotal >= formData.freeShipThreshold) {
            return 0;
        }

        const excessWeight = Math.max(0, testWeight - (formData.baseWeight || 0));
        const calculatedFee = (testDistance * (formData.feePerKm || 0)) + (excessWeight * (formData.overWeightFee || 0));

        return Math.max(formData.minFee || 0, calculatedFee);
    }, [testDistance, testWeight, testOrderTotal, formData]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (initialData) {
                await updateShippingRule(initialData.id, formData);
                toast.success("Cập nhật quy tắc thành công");
            } else {
                await createShippingRule(formData);
                toast.success("Tạo quy tắc mới thành công");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const selectedProvince = PROVINCES.find(p => p.id === formData.provinceId) || undefined;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    boxShadow: '0 0 2px 0 rgba(145 158 171 / 0.2), 0 24px 48px -12px rgba(145 158 171 / 0.16)',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 4, py: 3,
                bgcolor: '#F4F6F8'
            }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'white', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <LocalShippingIcon sx={{ color: COLORS.primary }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary }}>
                        {initialData ? "Cập nhật quy tắc" : "Thêm quy tắc vận chuyển"}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fff' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 4, py: 4 }}>
                <Stack spacing={4}>
                    {/* Section 1: Target Area */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ color: COLORS.primary, fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MapIcon sx={{ fontSize: '1.2rem', color: COLORS.secondary }} /> Vùng áp dụng
                        </Typography>
                        <Box sx={{ p: 3, borderRadius: '16px', bgcolor: COLORS.backgroundLight, border: `1px dashed ${COLORS.border}` }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Autocomplete
                                    options={PROVINCES}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedProvince}
                                    onChange={(_, newValue) => {
                                        setFormData({
                                            ...formData,
                                            provinceId: newValue ? newValue.id : 0
                                        });
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tỉnh/Thành phố" fullWidth />
                                    )}
                                    fullWidth
                                    sx={{ bgcolor: 'white', borderRadius: '12px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isInnerCity}
                                                onChange={(e) => setFormData({ ...formData, isInnerCity: e.target.checked })}
                                                color="primary"
                                            />
                                        }
                                        label={<Typography sx={{ fontWeight: 700, color: '#1C252E' }}>Nội thành</Typography>}
                                    />
                                </Box>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Section 2: Pricing Rules */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ color: COLORS.primary, fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon sx={{ fontSize: '1.2rem', color: COLORS.secondary }} /> Cấu hình phí
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                            <TextField
                                label="Ngưỡng Freeship (km)"
                                fullWidth
                                value={(formData?.freeShipDistanceKm ?? 0) === 0 ? "" : (formData?.freeShipDistanceKm ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, freeShipDistanceKm: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Khoảng cách dưới ngưỡng này phí ship = 0₫"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>km</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />
                            <TextField
                                label="Ngưỡng Freeship (Số tiền)"
                                fullWidth
                                value={(formData?.freeShipThreshold ?? 0) === 0 ? "" : (formData?.freeShipThreshold ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, freeShipThreshold: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Tổng đơn trên mức này sẽ được miễn phí ship"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>₫</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />
                            <TextField
                                label="Đơn giá mỗi km"
                                fullWidth
                                value={(formData?.feePerKm ?? 0) === 0 ? "" : (formData?.feePerKm ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, feePerKm: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>₫</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />
                            <TextField
                                label="Phí tối thiểu"
                                fullWidth
                                value={(formData?.minFee ?? 0) === 0 ? "" : (formData?.minFee ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, minFee: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Phí ship thấp nhất khi không được miễn phí"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>₫</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />
                            <TextField
                                label="Tối đa tự ship (km)"
                                fullWidth
                                value={(formData?.maxInternalDistanceKm ?? 0) === 0 ? "" : (formData?.maxInternalDistanceKm ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, maxInternalDistanceKm: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Quá km này sẽ hiện cảnh báo Book Grab"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>km</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isSelfShip ?? true}
                                        onChange={(e) => setFormData({ ...formData, isSelfShip: e.target.checked })}
                                        color="primary"
                                    />
                                }
                                label={<Typography sx={{ fontWeight: 700, color: '#1C252E' }}>Shop tự vận chuyển</Typography>}
                                sx={{ gridColumn: 'span 2' }}
                            />

                            <Divider sx={{ gridColumn: 'span 2', my: 1, opacity: 0.5 }} />

                            <TextField
                                label="Cân nặng cơ bản"
                                fullWidth
                                value={(formData?.baseWeight ?? 0) === 0 ? "" : (formData?.baseWeight ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, baseWeight: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Khoảng cân nặng đã bao gồm trong phí km"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>kg</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />
                            <TextField
                                label="Phụ thu quá cân"
                                fullWidth
                                value={(formData?.overWeightFee ?? 0) === 0 ? "" : (formData?.overWeightFee ?? 0).toLocaleString("vi-VN")}
                                onChange={(e) => setFormData({ ...formData, overWeightFee: Number(e.target.value.replace(/\D/g, "")) })}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                helperText="Phí cộng thêm cho mỗi kg vượt mức"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>₫/kg</InputAdornment>,
                                    sx: { borderRadius: '12px' }
                                }}
                            />

                            <TextField
                                label="Ghi chú (Nội bộ)"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                sx={{ gridColumn: 'span 2' }}
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {/* Section 3: Sandbox */}
                    <Box sx={{
                        bgcolor: '#F8FAFC',
                        p: 3.5,
                        borderRadius: '20px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                        {/* Background Decoration */}
                        <CalculateIcon sx={{ position: 'absolute', right: -15, bottom: -15, fontSize: '140px', opacity: 0.05, color: COLORS.primary, transform: 'rotate(-10deg)' }} />

                        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                            <Box sx={{ bgcolor: COLORS.primary, p: 1, borderRadius: '10px', display: 'flex' }}>
                                <CalculateIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, letterSpacing: -0.5 }}>
                                    Sandbox Simulator
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#1C252E', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Kiểm tra logic tính phí
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="column" spacing={3}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    label="Số km dự kiến"
                                    fullWidth
                                    size="small"
                                    value={testDistance === 0 ? "" : testDistance.toLocaleString("vi-VN")}
                                    onChange={(e) => setTestDistance(Number(e.target.value.replace(/\D/g, "")))}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end" sx={{ fontWeight: 900, color: '#1C252E' }}>km</InputAdornment>,
                                        sx: {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& input': { fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', color: '#1C252E' }
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 900, color: '#1C252E !important' } }}
                                />
                                <TextField
                                    label="Tổng đơn hàng"
                                    fullWidth
                                    size="small"
                                    value={testOrderTotal === 0 ? "" : testOrderTotal.toLocaleString("vi-VN")}
                                    onChange={(e) => setTestOrderTotal(Number(e.target.value.replace(/\D/g, "")))}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end" sx={{ fontWeight: 900, color: '#1C252E' }}>₫</InputAdornment>,
                                        sx: {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& input': { fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', color: '#1C252E' }
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 900, color: '#1C252E !important' } }}
                                />
                                <TextField
                                    label="Cân nặng thực tế"
                                    fullWidth
                                    size="small"
                                    value={testWeight === 0 ? "" : testWeight.toLocaleString("vi-VN")}
                                    onChange={(e) => setTestWeight(Number(e.target.value.replace(/\D/g, "")))}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end" sx={{ fontWeight: 900, color: '#1C252E' }}>kg</InputAdornment>,
                                        sx: {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& input': { fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', color: '#1C252E' }
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 900, color: '#1C252E !important' } }}
                                />
                            </Stack>

                            <Box sx={{
                                p: 2.5,
                                bgcolor: 'white',
                                borderRadius: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: `2px solid #E2E8F0`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}>
                                <Box>
                                    <Typography variant="overline" sx={{ color: '#454F5B', fontWeight: 900, display: 'block', mb: 0.5, fontSize: '0.8rem' }}>
                                        Phí ship ước tính:
                                    </Typography>
                                    <Typography variant="h4" sx={{
                                        color: testDistance > (formData.maxInternalDistanceKm || 10) ? '#D32F2F' : '#00A76F',
                                        fontWeight: 900,
                                        fontSize: '2.2rem'
                                    }}>
                                        {testDistance > (formData.maxInternalDistanceKm || 10) ? "⚠️ Book Grab" : `${previewResult.toLocaleString()}₫`}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                    <Typography sx={{ color: '#1C252E', fontWeight: 900, mb: 1, display: 'block', fontSize: '1.2rem' }}>
                                        Công thức: Max(MinFee, Km*Giá + Cân*Phụ)
                                    </Typography>
                                    <Box sx={{ bgcolor: '#1C252E', color: 'white', px: 3, py: 1.5, borderRadius: '14px', display: 'inline-block' }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: '1.4rem' }}>
                                            {previewResult.toLocaleString()}₫
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 4, py: 4, bgcolor: '#F4F6F8', borderTop: `1px solid ${COLORS.borderLight}` }}>
                <Button onClick={onClose} sx={{
                    color: COLORS.secondary,
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 3
                }}>
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        bgcolor: COLORS.primary,
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        px: 6,
                        py: 1.5,
                        borderRadius: '12px',
                        boxShadow: '0 8px 16px rgba(28, 37, 46, 0.2)',
                        '&:hover': {
                            bgcolor: '#454F5B',
                        }
                    }}
                >
                    {loading ? "Đang xử lý..." : (initialData ? "Lưu thay đổi" : "Tạo quy tắc ngay")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
