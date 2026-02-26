import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { RoomTypeList } from './sections/RoomTypeList';

export const RoomTypeListPage = () => (
    <>
        <ListHeader
            title="Danh sách loại phòng"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                { label: 'Danh sách loại phòng' },
            ]}
            addButtonLabel="Thêm loại phòng"
            addButtonPath={`/${prefixAdmin}/room-type/create`}
        />
        <RoomTypeList />
    </>
);
