import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { RoomList } from './sections/RoomList';

export const RoomListPage = () => (
    <>
        <ListHeader
            title="Danh sách phòng"
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                { label: 'Danh sách phòng' },
            ]}
            addButtonLabel="Thêm phòng"
            addButtonPath={`/${prefixAdmin}/room/create`}
        />
        <RoomList />
    </>
);
