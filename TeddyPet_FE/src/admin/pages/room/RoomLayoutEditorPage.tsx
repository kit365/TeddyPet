import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Stack, Divider } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomLayoutConfigById, getRooms, getRoomTypes, setRoomPosition, type IRoom, type IRoomLayoutConfig, type IRoomType } from '../../api/room.api';
import { ApiResponse } from '../../config/type';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ListHeader } from '../../components/ui/ListHeader';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FilterListIcon from '@mui/icons-material/FilterList';

const cellSize = 64;

export const RoomLayoutEditorPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dropTarget, setDropTarget] = useState<{ row: number; col: number } | null>(null);
    const [roomToPlace, setRoomToPlace] = useState<IRoom | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [roomNumber, setRoomNumber] = useState('');
    const [tier, setTier] = useState('');
    const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<number | ''>('');
    const leftCardRef = useRef<HTMLDivElement>(null);
    const [leftHeight, setLeftHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (!leftCardRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setLeftHeight(entries[0].target.getBoundingClientRect().height);
            }
        });
        observer.observe(leftCardRef.current);
        return () => observer.disconnect();
    }, []);

    const { data: layout, isLoading: layoutLoading } = useQuery({
        queryKey: ['room-layout-config', id],
        queryFn: () => getRoomLayoutConfigById(Number(id)),
        enabled: !!id,
        select: (res: ApiResponse<IRoomLayoutConfig>) => res.data,
    });
    const { data: rooms = [], isLoading: roomsLoading } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => getRooms(),
        select: (res: ApiResponse<IRoom[]>) => res.data ?? [],
    });
    const { data: roomTypes = [] } = useQuery({
        queryKey: ['room-types'],
        queryFn: () => getRoomTypes(),
        select: (res: ApiResponse<IRoomType[]>) => res.data ?? [],
    });

    const layoutId = layout?.id;
    const layoutServiceId = layout?.serviceId;

    // Build a map from roomTypeId -> serviceId
    const roomTypeServiceMap = useMemo(() => {
        const map = new Map<number, number | null>();
        roomTypes.forEach((rt) => {
            map.set(rt.roomTypeId, rt.serviceId ?? null);
        });
        return map;
    }, [roomTypes]);

    // Room types that belong to the layout's service (used for the filter dropdown)
    const serviceRoomTypes = useMemo(() => {
        if (!layoutServiceId) return roomTypes;
        return roomTypes.filter((rt) => rt.serviceId === layoutServiceId);
    }, [roomTypes, layoutServiceId]);

    const placedRooms = useMemo(() =>
        (rooms as IRoom[]).filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null),
        [rooms, layoutId]);

    const unplacedRooms = useMemo(() => {
        let filtered = (rooms as IRoom[]).filter((r) => {
            // Must be unplaced for this layout
            if (r.roomLayoutConfigId && r.roomLayoutConfigId === layoutId) return false;
            // If the layout has a serviceId, only show rooms whose RoomType is linked to the same service
            if (layoutServiceId) {
                const roomServiceId = roomTypeServiceMap.get(r.roomTypeId);
                return roomServiceId === layoutServiceId;
            }
            return true;
        });
        // Apply room type filter
        if (selectedRoomTypeFilter) {
            filtered = filtered.filter((r) => r.roomTypeId === selectedRoomTypeFilter);
        }
        return filtered;
    }, [rooms, layoutId, layoutServiceId, roomTypeServiceMap, selectedRoomTypeFilter]);

    const { mutate: placeRoom, isPending: isPlacing } = useMutation({
        mutationFn: ({ roomId, row, col }: { roomId: number; row: number; col: number }) =>
            setRoomPosition(roomId, {
                roomLayoutConfigId: Number(id),
                gridRow: row,
                gridCol: col,
                tier: tier.trim() || '1',
                roomNumber: roomNumber.trim() || String(roomId),
            }),
        onSuccess: (res) => {
            if (res?.success) {
                toast.success('Đã đặt vị trí phòng.');
                queryClient.invalidateQueries({ queryKey: ['rooms'] });
                setDialogOpen(false);
                setRoomToPlace(null);
                setDropTarget(null);
                setRoomNumber('');
                setTier('');
            } else toast.error((res as any)?.message ?? 'Lỗi');
        },
        onError: (e: any) => {
            const msg = e?.response?.data?.message ?? e?.message ?? 'Đặt vị trí thất bại';
            toast.error(msg);
        },
    });

    const handleDragStart = useCallback((e: React.DragEvent, room: IRoom) => {
        e.dataTransfer.setData('roomId', String(room.roomId));
        e.dataTransfer.setData('application/json', JSON.stringify(room));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, row: number, col: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDropTarget({ row, col });
    }, []);

    const handleDragLeave = useCallback(() => {
        setDropTarget(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, row: number, col: number) => {
        e.preventDefault();
        setDropTarget(null);
        try {
            const room = JSON.parse(e.dataTransfer.getData('application/json')) as IRoom;
            setRoomToPlace(room);
            setDropTarget({ row, col });
            setRoomNumber(room.roomNumber || '');
            setTier(room.tier ?? '1');
            setDialogOpen(true);
        } catch {
            toast.error('Dữ liệu phòng không hợp lệ');
        }
    }, []);

    const handleConfirmPlace = useCallback(() => {
        if (!roomToPlace || !dropTarget || !id) return;
        placeRoom({ roomId: roomToPlace.roomId, row: dropTarget.row, col: dropTarget.col });
    }, [roomToPlace, dropTarget, id, placeRoom]);

    const getRoomAt = useCallback((row: number, col: number) => {
        return placedRooms.find((r) => r.gridRow === row && r.gridCol === col);
    }, [placedRooms]);

    if (!id || layoutLoading || !layout) {
        return <Box sx={{ p: '40px' }}><Typography sx={{ fontSize: '1.4rem' }}>Đang tải layout...</Typography></Box>;
    }

    const maxRows = layout.maxRows ?? 10;
    const maxCols = layout.maxCols ?? 20;

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title={`Sắp xếp phòng: ${layout.layoutName || `Layout #${layout.id}`}`}
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Cấu hình sắp xếp phòng', to: `/${prefixAdmin}/room-layout-config/list` },
                    { label: 'Sắp xếp phòng' },
                ]}
                addButtonLabel="Thêm phòng mới"
                addButtonPath={`/${prefixAdmin}/room/create`}
            />

            {/* Layout info banner */}
            {layout.serviceName && (
                <Box sx={{ mx: '40px', display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5, borderRadius: '12px', background: 'rgba(0, 184, 217, 0.08)', border: '1px solid rgba(0, 184, 217, 0.24)' }}>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, color: '#006C9C' }}>
                        Dịch vụ:
                    </Typography>
                    <Chip
                        label={layout.serviceName}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(0, 184, 217, 0.16)',
                            color: '#006C9C',
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            height: 28,
                        }}
                    />
                    <Typography sx={{ fontSize: '1.3rem', color: '#637381', ml: 1 }}>
                        Chỉ hiển thị phòng thuộc loại phòng của dịch vụ này
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 3, mx: '40px', mb: '40px', flexWrap: { xs: 'wrap', md: 'nowrap' }, justifyContent: 'center', alignItems: 'flex-start' }}>
                <Card
                    ref={leftCardRef}
                    elevation={0}
                    sx={{
                        flex: '0 0 auto',
                        minWidth: 0,
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        overflow: 'auto',
                        boxShadow: '0 12px 24px 0 rgba(145,158,171,0.16)',
                        border: '1px solid rgba(145,158,171,0.24)',
                        p: 3,
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700 }}>
                            Sơ đồ ({maxRows}×{maxCols})
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${maxCols}, ${cellSize}px)`,
                            gridTemplateRows: `repeat(${maxRows}, ${cellSize}px)`,
                            gap: 1.5,
                            pb: 2,
                        }}
                    >
                        {Array.from({ length: maxRows * maxCols }, (_, i) => {
                            const row = Math.floor(i / maxCols);
                            const col = i % maxCols;
                            const room = getRoomAt(row, col);
                            const isDropTarget = dropTarget?.row === row && dropTarget?.col === col;
                            return (
                                <Box
                                    key={`${row}-${col}`}
                                    onDragOver={(e) => handleDragOver(e, row, col)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, row, col)}
                                    sx={{
                                        width: cellSize,
                                        height: cellSize,
                                        border: '2px dashed',
                                        borderColor: isDropTarget ? '#00A76F' : 'rgba(145, 158, 171, 0.24)',
                                        bgcolor: room ? 'rgba(0, 167, 111, 0.08)' : isDropTarget ? 'rgba(0, 167, 111, 0.16)' : '#FAFBFC',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        '&:hover': {
                                            borderColor: room ? 'rgba(0, 167, 111, 0.48)' : 'rgba(145, 158, 171, 0.48)',
                                            bgcolor: room ? 'rgba(0, 167, 111, 0.16)' : '#F4F6F8',
                                        }
                                    }}
                                >
                                    {room ? (
                                        <Stack alignItems="center" spacing={0.5}>
                                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#00A76F', lineHeight: 1 }}>
                                                {room.roomNumber ?? ''}
                                            </Typography>
                                            <Box sx={{ background: '#00A76F', color: '#fff', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '1rem', fontWeight: 600 }}>
                                                T{room.tier || 1}
                                            </Box>
                                        </Stack>
                                    ) : (
                                        <Typography sx={{ fontSize: '1rem', color: '#919EAB', fontWeight: 500 }}>
                                            {row + 1},{col + 1}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        width: { xs: '100%', md: 320 },
                        height: leftHeight ? `${leftHeight}px` : 'auto',
                        maxHeight: leftHeight ? `${leftHeight}px` : 'none',
                        flexShrink: 0,
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 24px 0 rgba(145,158,171,0.16)',
                        border: '1px solid rgba(145,158,171,0.24)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box sx={{ p: 2.5, borderBottom: '1px dashed rgba(145, 158, 171, 0.24)' }}>
                        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700 }}>
                            Chuồng chờ xếp
                        </Typography>
                        <Typography sx={{ fontSize: '1.3rem', color: '#637381', mt: 0.5 }}>
                            Kéo và thả vào vị trí trống
                        </Typography>
                    </Box>

                    {/* Room type filter */}
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: '1.3rem' }}>
                                <FilterListIcon sx={{ fontSize: '1.4rem', mr: 0.5, verticalAlign: 'middle' }} />
                                Lọc theo loại phòng
                            </InputLabel>
                            <Select
                                value={selectedRoomTypeFilter}
                                onChange={(e) => setSelectedRoomTypeFilter(e.target.value as number | '')}
                                label="Lọc theo loại phòng___"
                                sx={{
                                    fontSize: '1.3rem',
                                    borderRadius: '10px',
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(145,158,171,0.32)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#919EAB' },
                                }}
                            >
                                <MenuItem value="" sx={{ fontSize: '1.3rem' }}>
                                    <em>Tất cả loại phòng ({unplacedRooms.length + (selectedRoomTypeFilter ? (rooms as IRoom[]).filter((r) => {
                                        if (r.roomLayoutConfigId && r.roomLayoutConfigId === layoutId) return false;
                                        if (layoutServiceId) {
                                            const roomServiceId = roomTypeServiceMap.get(r.roomTypeId);
                                            return roomServiceId === layoutServiceId;
                                        }
                                        return true;
                                    }).length - unplacedRooms.length : 0)})</em>
                                </MenuItem>
                                {serviceRoomTypes.map((rt) => {
                                    const count = (rooms as IRoom[]).filter((r) => {
                                        if (r.roomLayoutConfigId && r.roomLayoutConfigId === layoutId) return false;
                                        if (layoutServiceId) {
                                            const roomServiceId = roomTypeServiceMap.get(r.roomTypeId);
                                            if (roomServiceId !== layoutServiceId) return false;
                                        }
                                        return r.roomTypeId === rt.roomTypeId;
                                    }).length;
                                    return (
                                        <MenuItem key={rt.roomTypeId} value={rt.roomTypeId} sx={{ fontSize: '1.3rem' }}>
                                            {rt.displayTypeName || rt.typeName} ({count})
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ p: 2, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {roomsLoading ? (
                            <Typography sx={{ fontSize: '1.4rem', color: '#637381', textAlign: 'center', py: 4 }}>Đang tải...</Typography>
                        ) : unplacedRooms.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, px: 2, background: '#F9FAFB', borderRadius: '12px', border: '1px dashed rgba(145, 158, 171, 0.24)' }}>
                                <Typography sx={{ fontSize: '1.4rem', color: '#637381' }}>
                                    {selectedRoomTypeFilter ? 'Không có chuồng nào thuộc loại phòng này.' : 'Không có chuồng nào cần xếp.'}
                                </Typography>
                            </Box>
                        ) : (
                            unplacedRooms.map((room) => (
                                <Box
                                    key={room.roomId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, room)}
                                    sx={{
                                        p: 1.5,
                                        border: '1px solid rgba(145, 158, 171, 0.24)',
                                        borderRadius: '10px',
                                        bgcolor: '#fff',
                                        cursor: 'grab',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)',
                                            transform: 'translateY(-2px)'
                                        },
                                        '&:active': { cursor: 'grabbing' },
                                    }}
                                >
                                    <DragIndicatorIcon sx={{ color: '#919EAB' }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 600 }}>
                                            {room.roomName || room.roomNumber || `Phòng #${room.roomId}`}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.2rem', color: '#637381', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {room.roomTypeName || 'Chưa phân loại'}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Card>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setRoomToPlace(null); setDropTarget(null); }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', padding: '8px' }
                }}
            >
                <DialogTitle sx={{ fontSize: '2rem', fontWeight: 700, pb: 2 }}>Thông tin vị trí</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
                    <Box sx={{ background: 'rgba(0, 167, 111, 0.08)', borderRadius: '8px', p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, color: '#00A76F' }}>
                            Khu vực đặt:
                        </Typography>
                        <Typography sx={{ fontSize: '1.4rem', color: '#212B36' }}>
                            Hàng {dropTarget ? dropTarget.row + 1 : ''}, Cột {dropTarget ? dropTarget.col + 1 : ''}
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        label="Số phòng hiển thị (roomNumber)"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="VD: P.101"
                        InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                        InputProps={{ sx: { fontSize: '1.4rem' } }}
                    />

                    <TextField
                        fullWidth
                        label="Tầng / Ngăn chuồng (tier)"
                        value={tier}
                        onChange={(e) => setTier(e.target.value)}
                        placeholder="VD: 1 hoặc 2"
                        InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                        InputProps={{ sx: { fontSize: '1.4rem' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={() => { setDialogOpen(false); setRoomToPlace(null); setDropTarget(null); }}
                        variant="outlined"
                        fullWidth
                        sx={{
                            minHeight: '4.8rem',
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            borderRadius: '8px',
                            textTransform: 'none',
                            borderColor: '#637381',
                            color: '#637381',
                            '&:hover': { borderColor: '#454F5B', color: '#454F5B', bgcolor: 'rgba(99,115,129,0.08)' },
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmPlace}
                        disabled={isPlacing || !roomNumber.trim()}
                        fullWidth
                        sx={{
                            background: '#1C252E',
                            minHeight: '4.8rem',
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': { background: '#454F5B' },
                            '&.Mui-disabled': {
                                background: 'rgba(145, 158, 171, 0.24)',
                                color: 'rgba(145, 158, 171, 0.8)',
                            }
                        }}
                    >
                        {isPlacing ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
