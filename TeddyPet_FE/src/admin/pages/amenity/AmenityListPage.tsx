import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { AmenityList } from './sections/AmenityList';

export const AmenityListPage = () => (
    <>
        <ListHeader
            title="Tiện nghi"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                { label: 'Tiện nghi' },
            ]}
            addButtonLabel="Thêm tiện nghi"
            addButtonPath={`/${prefixAdmin}/amenity/create`}
        />
        <AmenityList />
    </>
);
