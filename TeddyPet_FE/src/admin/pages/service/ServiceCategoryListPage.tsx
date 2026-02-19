import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { ServiceCategoryList } from './sections/ServiceCategoryList';

export const ServiceCategoryListPage = () => (
    <>
        <ListHeader
            title="Danh mục dịch vụ"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Quản lý dịch vụ', to: `/${prefixAdmin}/service/list` },
                { label: 'Danh mục dịch vụ' },
            ]}
            addButtonLabel="Thêm danh mục"
            addButtonPath={`/${prefixAdmin}/service-category/create`}
        />
        <ServiceCategoryList />
    </>
);
