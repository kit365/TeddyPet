import { Box, Typography, Stack } from "@mui/material";
import { Icon } from '@iconify/react';
import DashboardCard from "./DashboardCard";

const SystemAlerts = () => {
    const alerts = [
        { id: 1, title: '5 đơn hàng bị khiếu nại', type: 'error', icon: 'solar:danger-bold' },
        { id: 2, title: '2 nhân viên chưa check-in', type: 'warning', icon: 'solar:clock-circle-bold' },
        { id: 3, title: 'Database đang đạt 85% dung lượng', type: 'info', icon: 'solar:database-bold' },
    ];

    return (
        <DashboardCard sx={{ p: 0, bgcolor: 'var(--palette-background-neutral)', border: '1px dashed var(--palette-divider)' }}>
            <Box sx={{ p: 2.5, px: 3, borderBottom: '1px solid var(--palette-divider)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Icon icon="solar:bell-bing-bold-duotone" width={22} style={{ color: '#FF5630' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Thông báo hệ thống</Typography>
            </Box>
            <Stack spacing={0} sx={{ p: 1 }}>
                {alerts.map((alert) => (
                    <Stack 
                        key={alert.id} 
                        direction="row" 
                        alignItems="center" 
                        spacing={2} 
                        sx={{ 
                            p: 1.5, px: 2, borderRadius: '8px', 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'white' } 
                        }}
                    >
                        <Box sx={{ 
                            width: 32, height: 32, borderRadius: '8px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alert.type === 'error' ? 'rgba(255, 86, 48, 0.16)' : alert.type === 'warning' ? 'rgba(255, 171, 0, 0.16)' : 'rgba(0, 184, 217, 0.16)',
                            color: alert.type === 'error' ? '#FF5630' : alert.type === 'warning' ? '#B76E00' : '#00B8D9'
                        }}>
                            <Icon icon={alert.icon} width={18} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>{alert.title}</Typography>
                        <Icon icon="eva:arrow-ios-forward-fill" width={16} />
                    </Stack>
                ))}
            </Stack>
        </DashboardCard>
    );
};

export default SystemAlerts;
