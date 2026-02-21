import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { ServiceList } from './sections/ServiceList';
import { ServiceComboList } from './sections/ServiceComboList';

export const ServiceManagementPage = () => {
    const [tab, setTab] = useState(0);

    return (
        <>
            <ListHeader
                title="Quản lý dịch vụ"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                    { label: 'Danh sách' },
                ]}
                addButtonLabel={tab === 2 ? 'Thêm gói dịch vụ' : tab === 1 ? 'Thêm add-on' : 'Thêm dịch vụ'}
                addButtonPath={tab === 2 ? `/${prefixAdmin}/service-combo/create` : `/${prefixAdmin}/service/create`}
            />

            <Tabs
                value={tab}
                onChange={(_, newValue: number) => setTab(newValue)}
                sx={{
                    mb: '24px',
                    minHeight: 48,
                    '& .MuiTabs-indicator': { backgroundColor: '#1C252E', height: 2 },
                }}
            >
                <Tab label="Dịch vụ" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
                <Tab label="Add-ons" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
                <Tab label="Gói dịch vụ" sx={{ textTransform: 'none', fontSize: '1.4rem', fontWeight: 500 }} />
            </Tabs>

            <Box sx={{ px: '40px', mx: '-40px' }}>
                {tab === 0 && <ServiceList mode="non_addon" />}
                {tab === 1 && <ServiceList mode="addon" showAddonColumn />}
                {tab === 2 && <ServiceComboList />}
            </Box>
        </>
    );
};
