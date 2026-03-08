import { useState } from 'react';
import { Box, Button, Stack, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Typography, Divider } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useRealtimeStatus, useSetRealtimeAvailable, useSetRealtimeBusy, useSetRealtimeOffline, useSetRealtimeOnBreak } from '../hooks/useStaffRealtime';
import { toast } from 'react-toastify';
import type { IStaffProfile } from '../../../api/staffProfile.api';

const STATUS_LABELS: Record<string, string> = { OFFLINE: 'Offline', AVAILABLE: 'Sẵn sàng', BUSY: 'Bận', ON_BREAK: 'Nghỉ' };

const StaffStatusCard = ({
    staffId,
    fullName,
    avatarUrl,
    onOpenBusyDialog,
    onOpenProfileDetail,
}: {
    staffId: number;
    fullName: string;
    avatarUrl?: string | null;
    onOpenBusyDialog: (staffId: number, fullName: string) => void;
    onOpenProfileDetail: (staffId: number) => void;
}) => {
    const { data: res } = useRealtimeStatus(staffId);
    const statusData = (res as any)?.data;
    const { mutate: setAvailable } = useSetRealtimeAvailable();
    const { mutate: setOffline } = useSetRealtimeOffline();
    const { mutate: setOnBreak } = useSetRealtimeOnBreak();

    const status = statusData?.currentStatus ?? 'OFFLINE';
    const lastUpdated = statusData?.lastUpdated ? new Date(statusData.lastUpdated).toLocaleString('vi-VN') : '—';

    return (
        <Card sx={{ p: 2.25, minWidth: 280, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar
                    src={avatarUrl ?? undefined}
                    alt={fullName}
                    sx={{ width: 44, height: 44, cursor: 'pointer', bgcolor: 'primary.light' }}
                    onClick={() => onOpenProfileDetail(staffId)}
                >
                    {fullName?.charAt(0) ?? '?'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }} noWrap>
                        {fullName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>ID: {staffId}</Typography>
                </Box>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>
                Trạng thái: {STATUS_LABELS[status] ?? status} · Cập nhật: {lastUpdated}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant={status === 'AVAILABLE' ? 'contained' : 'outlined'} onClick={() => setAvailable(staffId)}>
                    Sẵn sàng
                </Button>
                <Button size="small" variant={status === 'BUSY' ? 'contained' : 'outlined'} color="warning" onClick={() => onOpenBusyDialog(staffId, fullName)}>
                    Bận
                </Button>
                <Button size="small" variant={status === 'ON_BREAK' ? 'contained' : 'outlined'} onClick={() => setOnBreak(staffId)}>
                    Nghỉ
                </Button>
                <Button size="small" variant={status === 'OFFLINE' ? 'contained' : 'outlined'} onClick={() => setOffline(staffId)}>
                    Offline
                </Button>
            </Stack>
        </Card>
    );
};

export const StaffRealtimePage = () => {
    const { data: profiles = [], isLoading } = useStaffProfiles();
    const [busyDialog, setBusyDialog] = useState<{ staffId: number; fullName: string } | null>(null);
    const [bookingId, setBookingId] = useState('');
    const { mutate: setBusy, isPending: settingBusy } = useSetRealtimeBusy();
    const [selectedProfile, setSelectedProfile] = useState<IStaffProfile | null>(null);

    const handleOpenBusyDialog = (staffId: number, fullName: string) => {
        setBusyDialog({ staffId, fullName });
        setBookingId('');
    };

    const handleOpenProfileDetail = (staffId: number) => {
        const profile = (profiles as IStaffProfile[]).find((p) => p.staffId === staffId);
        if (profile) {
            setSelectedProfile(profile);
        }
    };

    const handleConfirmBusy = () => {
        if (!busyDialog) return;
        const id = bookingId.trim();
        if (!id) {
            toast.error('Nhập mã đặt lịch (Booking ID)');
            return;
        }
        setBusy(
            { staffId: busyDialog.staffId, bookingId: id },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success('Đã đánh dấu nhân viên đang bận');
                        setBusyDialog(null);
                        setBookingId('');
                    } else toast.error(res?.message ?? 'Cập nhật thất bại');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Cập nhật thất bại');
                },
            }
        );
    };

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
                {isLoading ? (
                    <span>Đang tải...</span>
                ) : (
                    (profiles as IStaffProfile[]).map((p) => (
                        <StaffStatusCard
                            key={p.staffId}
                            staffId={p.staffId}
                            fullName={p.fullName}
                            avatarUrl={p.avatarUrl}
                            onOpenBusyDialog={handleOpenBusyDialog}
                            onOpenProfileDetail={handleOpenProfileDetail}
                        />
                    ))
                )}
                {!isLoading && profiles.length === 0 && <span>Chưa có nhân viên</span>}
            </Box>

            <Dialog open={!!busyDialog} onClose={() => setBusyDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Đánh dấu nhân viên đang bận</DialogTitle>
                <DialogContent>
                    {busyDialog && (
                        <Box sx={{ pt: 1 }}>
                            <Box sx={{ mb: 2, color: 'text.secondary' }}>{busyDialog.fullName} (ID: {busyDialog.staffId})</Box>
                            <TextField
                                fullWidth
                                size="small"
                                label="Mã đặt lịch (Booking ID)"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                placeholder="UUID của booking"
                                helperText="Nhập ID đặt lịch mà nhân viên đang phục vụ"
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBusyDialog(null)}>Hủy</Button>
                    <Button variant="contained" color="warning" onClick={handleConfirmBusy} disabled={settingBusy || !bookingId.trim()}>
                        Đánh dấu Bận
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!selectedProfile} onClose={() => setSelectedProfile(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Thông tin nhân viên</DialogTitle>
                <DialogContent dividers>
                    {selectedProfile && (
                        <Box sx={{ pt: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Avatar
                                    src={selectedProfile.avatarUrl ?? undefined}
                                    alt={selectedProfile.fullName}
                                    sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}
                                >
                                    {selectedProfile.fullName?.charAt(0) ?? '?'}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{selectedProfile.fullName}</Typography>
                                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                        ID: {selectedProfile.staffId}
                                        {selectedProfile.positionName ? ` · ${selectedProfile.positionName}` : ''}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1.2} sx={{ fontSize: '0.875rem' }}>
                                {selectedProfile.employmentType && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Loại nhân viên:
                                        </Typography>{' '}
                                        {selectedProfile.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
                                    </Box>
                                )}
                                {selectedProfile.email && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Email:
                                        </Typography>{' '}
                                        {selectedProfile.email}
                                    </Box>
                                )}
                                {selectedProfile.phoneNumber && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Số điện thoại:
                                        </Typography>{' '}
                                        {selectedProfile.phoneNumber}
                                    </Box>
                                )}
                                {selectedProfile.address && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Địa chỉ:
                                        </Typography>{' '}
                                        {selectedProfile.address}
                                    </Box>
                                )}
                                {selectedProfile.bankAccountNo && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Số tài khoản:
                                        </Typography>{' '}
                                        {selectedProfile.bankAccountNo}
                                    </Box>
                                )}
                                {selectedProfile.bankName && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            Ngân hàng:
                                        </Typography>{' '}
                                        {selectedProfile.bankName}
                                    </Box>
                                )}
                                {selectedProfile.citizenId && (
                                    <Box>
                                        <Typography component="span" sx={{ fontWeight: 600 }}>
                                            CCCD:
                                        </Typography>{' '}
                                        {selectedProfile.citizenId}
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedProfile(null)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
