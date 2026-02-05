import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ShippingRuleList } from "./sections/ShippingRuleList";
import { ShippingRuleFormDialog } from "./components/ShippingRuleFormDialog";
import { useShippingRules } from "./hooks/useShippingRules";
import { ShippingRule } from "../../../types/shipping.type";
import { deleteShippingRule } from "../../api/shipping.api";
import { getAllSettings } from "../../api/setting.api";
import { APP_SETTING_KEYS } from "../../constants/settings";
import { toast } from "react-toastify";
import { Button, Card, CardContent, Typography, Box, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';

export const ShippingRuleListPage = () => {
    const navigate = useNavigate();
    const { rules, loading, refetch } = useShippingRules();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<ShippingRule | null>(null);
    const [shopAddress, setShopAddress] = useState<string>("");

    useEffect(() => {
        fetchShopSettings();
    }, []);

    const fetchShopSettings = async () => {
        try {
            const response = await getAllSettings();
            if (response.success && response.data) {
                const address = response.data.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue;
                if (address) {
                    setShopAddress(address);
                } else {
                    console.warn("Shop address setting not found in database");
                }
            }
        } catch (error) {
            console.error("Error fetching shop settings:", error);
            toast.error("Không thể tải địa chỉ cửa hàng");
        }
    };

    const handleCreate = () => {
        setSelectedRule(null);
        setDialogOpen(true);
    };

    const handleEdit = (rule: ShippingRule) => {
        setSelectedRule(rule);
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) {
            try {
                await deleteShippingRule(id);
                toast.success("Đã xóa quy tắc vận chuyển");
                refetch();
            } catch (error: any) {
                toast.error(error.message || "Không thể xóa quy tắc");
            }
        }
    };

    const AddButton = (
        <Button
            onClick={handleCreate}
            sx={{
                background: '#1C252E',
                minHeight: "3.6rem",
                minWidth: "6.4rem",
                fontWeight: 700,
                fontSize: "1.4rem",
                padding: "6px 12px",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                    background: "#454F5B",
                    boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)"
                }
            }}
            variant="contained"
            startIcon={<AddIcon />}
        >
            Thêm mới
        </Button>
    );

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title="Quản lý phí vận chuyển"
                breadcrumbItems={[
                    { label: "Trang chủ", to: "/" },
                    { label: "Vận chuyển", to: `/${prefixAdmin}/shipping/list` },
                    { label: "Danh sách" }
                ]}
                action={AddButton}
            />

            {/* Shop Config Section - Simplified & Linked to Settings */}
            <Card sx={{
                borderRadius: '24px',
                border: '1px solid #919eab33',
                boxShadow: 'none',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
                        <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box sx={{
                                p: 2,
                                borderRadius: '16px',
                                bgcolor: 'rgba(0, 171, 85, 0.1)',
                                color: '#00AB55',
                                display: 'flex'
                            }}>
                                <StorefrontIcon sx={{ fontSize: '2.8rem' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#00AB55', textTransform: 'uppercase', letterSpacing: '1px', mb: 0.5 }}>
                                    Địa chỉ gốc cửa hàng (Pickup Point)
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#1C252E' }}>
                                    {shopAddress || "Đang tải địa chỉ..."}
                                </Typography>
                                <Typography sx={{ fontSize: '1.3rem', color: '#637381', mt: 0.5 }}>
                                    Hệ thống sử dụng địa chỉ này để tính khoảng cách giao hàng.
                                </Typography>
                            </Box>
                        </Stack>

                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => navigate(`/${prefixAdmin}/settings`)}
                            sx={{
                                borderRadius: '12px',
                                px: 3,
                                py: 1.2,
                                color: '#1C252E',
                                borderColor: '#E5E8EB',
                                fontWeight: 800,
                                fontSize: '1.3rem',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#1C252E',
                                    bgcolor: 'rgba(28, 37, 46, 0.04)'
                                }
                            }}
                        >
                            Thay đổi trong Cài đặt
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <ShippingRuleList
                rules={rules}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <ShippingRuleFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={refetch}
                initialData={selectedRule}
            />
        </div>
    );
};
