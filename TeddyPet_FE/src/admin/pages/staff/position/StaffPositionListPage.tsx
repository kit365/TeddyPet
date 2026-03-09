import { Box } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { StaffPositionList } from './sections/StaffPositionList';

export const StaffPositionListPage = () => (
    <>
        <ListHeader
            title="Danh mục chức vụ"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                { label: 'Danh mục chức vụ' },
            ]}
            addButtonLabel="Thêm chức vụ"
            addButtonPath={`/${prefixAdmin}/staff/position/create`}
        />
        <Box sx={{ px: '40px', mt: 3 }}>
            <StaffPositionList />
        </Box>
    </>
);
