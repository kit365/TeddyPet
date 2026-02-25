import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomLayoutConfigById, getRooms, setRoomPosition, type IRoom, type IRoomLayoutConfig } from '../../api/room.api';
import { ApiResponse } from '../../config/type';
import { prefixAdmin } from '../../constants/routes';
import { toast } from 'react-toastify';
import { useState, useCallback } from 'react';

const cellSize = 56;

export const RoomLayoutEditorPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dropTarget, setDropTarget] = useState<{ row: number; col: number } | null>(null);
    const [roomToPlace, setRoomToPlace] = useState<IRoom | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [roomNumber, setRoomNumber] = useState('');
    const [tier, setTier] = useState('');

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

    const layoutId = layout?.id;
    const placedRooms = (rooms as IRoom[]).filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null);
    const unplacedRooms = (rooms as IRoom[]).filter((r) => !r.roomLayoutConfigId || r.roomLayoutConfigId !== layoutId);

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
        return <Box sx={{ p: 3 }}><Typography>Đang tải layout...</Typography></Box>;
    }

    const maxRows = layout.maxRows ?? 10;
    const maxCols = layout.maxCols ?? 20;

    return (
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ mb: 2, width: '100%' }}>
                <Button size="small" onClick={() => navigate(`/${prefixAdmin}/room-layout-config/list`)}>← Quay lại danh sách layout</Button>
                <Typography variant="h6" sx={{ mt: 1 }}>Sắp xếp phòng: {layout.layoutName || `Layout #${layout.id}`} ({maxRows}×{maxCols})</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flex: '1 1 700px', minWidth: 0 }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${maxCols}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${maxRows}, ${cellSize}px)`,
                        gap: 1,
                        p: 1,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        border: '1px solid #ddd',
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
                                    borderColor: isDropTarget ? 'primary.main' : '#ccc',
                                    bgcolor: room ? '#e3f2fd' : isDropTarget ? 'action.hover' : '#fff',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {room ? `${room.roomNumber ?? ''}${room.tier ? ` (Tầng ${room.tier})` : ''}` : `${row + 1},${col + 1}`}
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ width: 280, flexShrink: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Chuồng thô (chưa xếp) — Kéo thả vào ô</Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {roomsLoading ? <Typography color="text.secondary">Đang tải...</Typography> : unplacedRooms.length === 0 ? (
                            <Typography color="text.secondary">Không còn phòng chưa xếp.</Typography>
                        ) : (
                            unplacedRooms.map((room) => (
                                <Box
                                    key={room.roomId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, room)}
                                    sx={{
                                        p: 1,
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                        bgcolor: '#fff',
                                        cursor: 'grab',
                                        '&:active': { cursor: 'grabbing' },
                                    }}
                                >
                                    {room.roomName || room.roomNumber || `Phòng #${room.roomId}`} {room.roomTypeName ? `(${room.roomTypeName})` : ''}
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setRoomToPlace(null); setDropTarget(null); }}>
                <DialogTitle>Điền thông tin đặt phòng</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Vị trí: Hàng {dropTarget ? dropTarget.row + 1 : ''}, Cột {dropTarget ? dropTarget.col + 1 : ''}
                    </Typography>
                    <TextField fullWidth label="Số phòng (roomNumber)" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} margin="dense" placeholder="VD: 1" />
                    <TextField fullWidth label="Ngăn/Tầng chuồng (tier)" value={tier} onChange={(e) => setTier(e.target.value)} margin="dense" placeholder="VD: 1 hoặc 2" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setDialogOpen(false); setRoomToPlace(null); setDropTarget(null); }}>Hủy</Button>
                    <Button variant="contained" onClick={handleConfirmPlace} disabled={isPlacing || !roomNumber.trim()}>Xác nhận</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
