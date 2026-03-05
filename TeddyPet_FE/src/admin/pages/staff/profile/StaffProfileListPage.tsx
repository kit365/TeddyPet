import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { StaffProfileList } from './sections/StaffProfileList';

export const StaffProfileListPage = () => (
    <>
        <ListHeader
            title="Hồ sơ nhân viên"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                { label: 'Hồ sơ nhân viên' },
            ]}
            addButtonLabel="Thêm hồ sơ (onboarding)"
            addButtonPath={`/${prefixAdmin}/staff/profile/onboarding`}
        />
        <StaffProfileList />
    </>
);
