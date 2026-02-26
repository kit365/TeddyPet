import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { TimeSlotExceptionList } from './sections/TimeSlotExceptionList';

export const TimeSlotExceptionListPage = () => (
    <>
        <ListHeader
            title="Quản lý ngoại lệ lịch"
            titleSx={{ fontSize: '2.6rem' }}
            breadcrumbItems={[
                { label: 'Trang chủ', to: '/' },
                { label: 'Cài đặt lịch', to: `/${prefixAdmin}/shop-operation-hours` },
                { label: 'Ngoại lệ' },
            ]}
            addButtonLabel="Thêm ngoại lệ"
            addButtonPath={`/${prefixAdmin}/time-slot-exception/create`}
        />
        <TimeSlotExceptionList />
    </>
);
