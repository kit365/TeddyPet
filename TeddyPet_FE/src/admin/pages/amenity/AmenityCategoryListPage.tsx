import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { AmenityCategoryList } from './sections/AmenityCategoryList';

export const AmenityCategoryListPage = () => (
    <>
        <ListHeader
            title="Danh mục tiện nghi"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                { label: 'Tiện nghi', to: `/${prefixAdmin}/amenity/list` },
                { label: 'Danh mục tiện nghi' },
            ]}
            addButtonLabel="Thêm danh mục"
            addButtonPath={`/${prefixAdmin}/amenity-category/create`}
        />
        <AmenityCategoryList />
    </>
);
