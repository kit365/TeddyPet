import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { useQuery } from '@tanstack/react-query';
import { getRoomLayoutConfigs } from '../../api/room.api';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ApiResponse } from '../../config/type';
import type { IRoomLayoutConfig } from '../../api/room.api';
import { createRoomLayoutConfig } from '../../api/room.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import GridOnIcon from '@mui/icons-material/GridOn';

export const RoomLayoutConfigListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: list = [], isLoading } = useQuery({
        queryKey: ['room-layout-configs'],
        queryFn: () => getRoomLayoutConfigs(),
        select: (res: ApiResponse<IRoomLayoutConfig[]>) => res.data ?? [],
    });

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: () => createRoomLayoutConfig({ maxRows: 10, maxCols: 20, layoutName: 'Layout mới' }),
        onSuccess: (res: ApiResponse<IRoomLayoutConfig>) => {
            queryClient.invalidateQueries({ queryKey: ['room-layout-configs'] });
            if (res?.data?.id) {
                toast.success('Tạo layout thành công. Có thể chỉnh maxRows/maxCols khi sửa.');
                navigate(`/${prefixAdmin}/room-layout-config/editor/${res.data.id}`);
            } else toast.error((res as any)?.message);
        },
        onError: () => toast.error('Tạo layout thất bại'),
    });

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title="Cấu hình sắp xếp phòng"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Quản lý phòng', to: `/${prefixAdmin}/room-type/list` },
                    { label: 'Cấu hình sắp xếp phòng' },
                ]}
                addButtonLabel="Thêm layout phòng"
                addButtonPath={undefined}
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => create()}
                        disabled={isCreating}
                        sx={{
                            background: '#1C252E',
                            minHeight: '3.6rem',
                            minWidth: '14rem',
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            padding: '6px 18px',
                            borderRadius: '8px',
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                                background: '#454F5B',
                                boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)',
                            },
                        }}
                    >
                        {isCreating ? 'Đang tạo...' : 'Thêm layout phòng'}
                    </Button>
                }
            />
            <Card
                elevation={0}
                sx={{
                    mx: '40px',
                    mb: '40px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 24px 0 rgba(145,158,171,0.16)',
                    border: '1px solid rgba(145,158,171,0.24)',
                }}
            >
                <TableContainer>
                    <Table
                        size="small"
                        sx={{
                            '& .MuiTableCell-root': {
                                fontSize: '1.4rem',
                                paddingTop: 1.5,
                                paddingBottom: 1.5,
                            },
                            '& thead .MuiTableCell-root': {
                                fontWeight: 700,
                                color: '#637381',
                                background: 'linear-gradient(90deg,#FFF3E0 0%,#E3F2FD 100%)',
                                borderBottom: '1px solid rgba(145,158,171,0.24)',
                            },
                            '& tbody .MuiTableRow-root:nth-of-type(even)': {
                                backgroundColor: '#F9FAFB',
                            },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tên layout</TableCell>
                                <TableCell>Block</TableCell>
                                <TableCell>Tầng</TableCell>
                                <TableCell>maxRows</TableCell>
                                <TableCell>maxCols</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Typography sx={{ fontSize: '1.4rem' }}>Đang tải...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : list.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Typography color="text.secondary" sx={{ fontSize: '1.4rem' }}>
                                            Chưa có layout. Bấm &quot;Tạo sân chơi&quot; để tạo.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                list.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell>{row.layoutName ?? '—'}</TableCell>
                                        <TableCell>{row.block ?? '—'}</TableCell>
                                        <TableCell>{row.floor ?? '—'}</TableCell>
                                        <TableCell>{row.maxRows}</TableCell>
                                        <TableCell>{row.maxCols}</TableCell>
                                        <TableCell align="right">
                                            <Button size="small" startIcon={<GridOnIcon />} onClick={() => navigate(`/${prefixAdmin}/room-layout-config/editor/${row.id}`)} sx={{ mr: 1 }}>
                                                Sắp xếp
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </div>
    );
};
