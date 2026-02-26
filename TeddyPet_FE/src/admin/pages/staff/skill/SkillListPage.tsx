import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { SkillList } from './sections/SkillList';

export const SkillListPage = () => (
    <>
        <ListHeader
            title="Danh mục kỹ năng"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                { label: 'Danh mục kỹ năng' },
            ]}
            addButtonLabel="Thêm kỹ năng"
            addButtonPath={`/${prefixAdmin}/staff/skill/create`}
        />
        <SkillList />
    </>
);
