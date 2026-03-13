import { Box, Typography, Stack, Avatar, Tab, Tabs, IconButton } from "@mui/material";
import DashboardCard from "../DashboardCard";
import { useState } from "react";
import { Icon } from '@iconify/react';

export const TopSellingProducts = () => {
    const [tab, setTab] = useState(0);

    const products = [
        { name: 'Pate mèo Whiskas', sales: 9910, price: 'Miễn phí', image: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-1.webp' },
        { name: 'Cát vệ sinh Crystal', sales: 1950, price: 'Miễn phí', image: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-2.webp' },
        { name: 'Sữa tắm chó Joy', sales: 9120, price: '$68.71', image: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-3.webp' },
        { name: 'Xương gặm bò', sales: 6980, price: 'Miễn phí', image: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-4.webp' },
        { name: 'Bát ăn đôi Inox', sales: 8490, price: '$52.17', image: 'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/cover/cover-5.webp' },
    ];

    return (
        <DashboardCard sx={{ height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Sản phẩm bán chạy</Typography>
            
            <Box sx={{ bgcolor: 'rgba(145, 158, 171, 0.08)', borderRadius: 1.5, mb: 3, p: 0.5 }}>
                <Tabs 
                    value={tab} 
                    onChange={(_, v) => setTab(v)}
                    variant="fullWidth"
                    sx={{ 
                        minHeight: 32,
                        '& .MuiTabs-indicator': { bgcolor: 'background.paper', height: '100%', borderRadius: 1, zIndex: 0 },
                        '& .MuiTab-root': { zIndex: 1, minHeight: 32, textTransform: 'none', fontWeight: 700, fontSize: '0.813rem', color: 'text.secondary', '&.Mui-selected': { color: 'text.primary' } }
                    }}
                >
                    <Tab label="7 ngày qua" />
                    <Tab label="30 ngày qua" />
                    <Tab label="Tất cả" />
                </Tabs>
            </Box>

            <Stack spacing={2.5}>
                {products.map((product) => (
                    <Stack key={product.name} direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar src={product.image} variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'rgba(145, 158, 171, 0.12)' }} />
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                                    <Typography variant="caption" sx={{ bgcolor: 'rgba(145, 158, 171, 0.12)', px: 0.5, borderRadius: 0.5, color: 'text.secondary', fontWeight: 700 }}>
                                        {product.price}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Icon icon="eva:diagonal-arrow-left-down-fill" color="text.disabled" width={16} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{(product.sales / 1000).toFixed(2)}k</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Icon icon="eva:star-fill" color="#FFAB00" width={14} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{(product.sales / 1000).toFixed(2)}k</Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Stack>
                        <IconButton size="small">
                            <Icon icon="eva:more-vertical-fill" />
                        </IconButton>
                    </Stack>
                ))}
            </Stack>
        </DashboardCard>
    );
};
