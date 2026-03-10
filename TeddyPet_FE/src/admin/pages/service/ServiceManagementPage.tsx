import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { ServiceList } from './sections/ServiceList';
import { ServiceComboList } from './sections/ServiceComboList';
import { useServiceCategories } from './hooks/useServiceCategory';

export const ServiceManagementPage = () => {
    const [tab, setTab] = useState(0);
    const [categoryTab, setCategoryTab] = useState<number | null>(null);
    const { data: categories = [] } = useServiceCategories();

    const showCategoryTabs = tab === 0 || tab === 1 || tab === 2;

    const addButtonLabel =
        tab === 3 ? 'Thêm gói dịch vụ' : tab === 2 ? 'Thêm Additional Charge' : tab === 1 ? 'Thêm add-on' : 'Thêm dịch vụ';
    const addButtonPath = tab === 3 ? `/${prefixAdmin}/service-combo/create` : `/${prefixAdmin}/service/create`;

    return (
        <>
            <ListHeader
                title="Quản lý dịch vụ"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                    { label: 'Danh sách' },
                ]}
                addButtonLabel={addButtonLabel}
                addButtonPath={addButtonPath}
            />

            <Tabs
                value={tab}
                onChange={(_, newValue: number) => {
                    setTab(newValue);
                    setCategoryTab(null);
                }}
                sx={{
                    mb: showCategoryTabs ? '16px' : '24px',
                    minHeight: 48,
                    '& .MuiTabs-indicator': { backgroundColor: '#1C252E', height: 2 },
                    '& .MuiTab-root': { mx: 1, minWidth: 'auto', px: 2 },
                }}
            >
                <Tab label="Dịch vụ" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
                <Tab label="Add-ons" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
                <Tab label="Additional Charge" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
                <Tab label="Gói dịch vụ" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
            </Tabs>

            {showCategoryTabs && (
                <Tabs
                    value={categoryTab === null ? 'all' : categoryTab}
                    onChange={(_, v: string | number) => setCategoryTab(v === 'all' ? null : (v as number))}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: '24px',
                        minHeight: 40,
                        '& .MuiTabs-indicator': { backgroundColor: '#637381', height: 2 },
                        '& .MuiTab-root': { minHeight: 40, py: 1, textTransform: 'none', fontSize: '1.3rem', mx: 1, minWidth: 'auto', px: 2 },
                    }}
                >
                    <Tab label="Tất cả" value="all" />
                    {categories
                        .filter((c) => c.isActive !== false)
                        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                        .map((c) => (
                            <Tab key={c.categoryId} label={c.categoryName} value={c.categoryId} />
                        ))}
                </Tabs>
            )}

            <Box sx={{ px: '40px', mx: '-40px' }}>
                {tab === 0 && <ServiceList mode="non_addon" categoryId={categoryTab} hideCategoryColumn />}
                {tab === 1 && <ServiceList mode="addon" showAddonColumn categoryId={categoryTab} hideCategoryColumn />}
                {tab === 2 && <ServiceList mode="additional_charge" categoryId={categoryTab} hideCategoryColumn />}
                {tab === 3 && <ServiceComboList />}
            </Box>
        </>
    );
};
