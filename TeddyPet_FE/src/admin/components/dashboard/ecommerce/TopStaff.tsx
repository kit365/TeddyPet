import { Box, Typography, Stack, Avatar } from "@mui/material";
import DashboardCard from "../DashboardCard";
import { Icon } from '@iconify/react';

export const TopStaff = () => {
    // Mock data for Top Staff (since API might not be ready yet)
    const staff = [
        { name: 'Jayvion Simon', orders: 9910, avatar: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/avatar/avatar-1.webp' },
        { name: 'Deja Brady', orders: 9120, avatar: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/avatar/avatar-2.webp' },
        { name: 'Lucian Obrien', orders: 1950, avatar: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/avatar/avatar-3.webp' },
    ];

    const getIconConfig = (index: number) => {
        const configs = [
            { color: '#00A76F', icon: 'eva:trophy-fill' },  // Green
            { color: '#00B8D9', icon: 'eva:trophy-fill' },  // Cyan
            { color: '#FF5630', icon: 'eva:trophy-fill' },  // Red/Orange
        ];
        return configs[index] || { color: '#919EAB', icon: 'eva:trophy-fill' };
    };

    return (
        <DashboardCard sx={{ height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Nhân viên tiêu biểu
            </Typography>
            
            <Stack spacing={3}>
                {staff.map((employee, index) => {
                    const config = getIconConfig(index);
                    return (
                        <Stack key={employee.name} direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar 
                                    src={employee.avatar} 
                                    sx={{ width: 44, height: 44 }} 
                                />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {employee.name}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Icon icon="eva:heart-fill" color="text.disabled" width={16} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {(employee.orders / 1000).toFixed(2)}k
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: `${config.color}14`,
                                    color: config.color
                                }}
                            >
                                <Icon icon={config.icon} width={18} />
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>
        </DashboardCard>
    );
};
