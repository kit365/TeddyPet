import { Box, Button, Stack } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useRealtimeStatus, useSetRealtimeAvailable, useSetRealtimeOffline, useSetRealtimeOnBreak } from '../hooks/useStaffRealtime';
import { Card } from '@mui/material';

const STATUS_LABELS: Record<string, string> = { OFFLINE: 'Offline', AVAILABLE: 'Sẵn sàng', BUSY: 'Bận', ON_BREAK: 'Nghỉ' };

const StaffStatusCard = ({ staffId, fullName }: { staffId: number; fullName: string }) => {
    const { data: res } = useRealtimeStatus(staffId);
    const statusData = (res as any)?.data;
    const { mutate: setAvailable } = useSetRealtimeAvailable();
    const { mutate: setOffline } = useSetRealtimeOffline();
    const { mutate: setOnBreak } = useSetRealtimeOnBreak();

    const status = statusData?.currentStatus ?? 'OFFLINE';
    const lastUpdated = statusData?.lastUpdated ? new Date(statusData.lastUpdated).toLocaleString('vi-VN') : '—';

    return (
        <Card sx={{ p: 2, minWidth: 260 }}>
            <Box sx={{ fontWeight: 600, mb: 1 }}>{fullName} (ID: {staffId})</Box>
            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2 }}>
                Trạng thái: {STATUS_LABELS[status] ?? status} · Cập nhật: {lastUpdated}
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant={status === 'AVAILABLE' ? 'contained' : 'outlined'} onClick={() => setAvailable(staffId)}>Sẵn sàng</Button>
                <Button size="small" variant={status === 'ON_BREAK' ? 'contained' : 'outlined'} onClick={() => setOnBreak(staffId)}>Nghỉ</Button>
                <Button size="small" variant={status === 'OFFLINE' ? 'contained' : 'outlined'} onClick={() => setOffline(staffId)}>Offline</Button>
            </Stack>
        </Card>
    );
};

export const StaffRealtimePage = () => {
    const { data: profiles = [], isLoading } = useStaffProfiles();

    return (
        <>
            <ListHeader
                title="Trạng thái realtime nhân viên"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Trạng thái realtime' },
                ]}
            />
            <Box sx={{ px: '40px', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {isLoading ? <span>Đang tải...</span> : profiles.map((p) => <StaffStatusCard key={p.staffId} staffId={p.staffId} fullName={p.fullName} />)}
                {!isLoading && profiles.length === 0 && <span>Chưa có nhân viên</span>}
            </Box>
        </>
    );
};
