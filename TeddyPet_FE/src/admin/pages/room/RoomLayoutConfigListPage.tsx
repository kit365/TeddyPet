import { useState } from 'react';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomLayoutConfigs, createRoomLayoutConfig } from '../../api/room.api';
import {
    Box,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ApiResponse } from '../../config/type';
import type { IRoomLayoutConfig } from '../../api/room.api';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import GridOnIcon from '@mui/icons-material/GridOn';
import { DataGrid } from '@mui/x-data-grid';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../assets/icons';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../service/configs/localeText.config';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { UploadSingleFile } from '../../components/upload/UploadSingleFile';

export const RoomLayoutConfigListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: list = [], isLoading } = useQuery({
        queryKey: ['room-layout-configs'],
        queryFn: () => getRoomLayoutConfigs(),
        select: (res: ApiResponse<IRoomLayoutConfig[]>) => res.data ?? [],
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [layoutName, setLayoutName] = useState('Layout mới');
    const [block, setBlock] = useState('');
    const [maxRows, setMaxRows] = useState<number | ''>('');
    const [maxCols, setMaxCols] = useState<number | ''>('');
    const [backgroundImage, setBackgroundImage] = useState('');

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: () =>
            createRoomLayoutConfig({
                layoutName: layoutName.trim() || 'Layout mới',
                block: block.trim() || null,
                maxRows: typeof maxRows === 'number' ? maxRows : Number(maxRows),
                maxCols: typeof maxCols === 'number' ? maxCols : Number(maxCols),
                backgroundImage: backgroundImage.trim() || null,
            }),
        onSuccess: (res: ApiResponse<IRoomLayoutConfig>) => {
            queryClient.invalidateQueries({ queryKey: ['room-layout-configs'] });
            if (res?.data?.id) {
                toast.success('Tạo layout thành công. Có thể chỉnh maxRows/maxCols khi sửa.');
                navigate(`/${prefixAdmin}/room-layout-config/editor/${res.data.id}`);
            } else toast.error((res as any)?.message);
            setDialogOpen(false);
        },
        onError: (e: any) => {
            const msg = e?.response?.data?.message ?? e?.message ?? 'Tạo layout thất bại';
            toast.error(msg);
        },
    });

    const handleClose = () => {
        setDialogOpen(false);
        setLayoutName('Layout mới');
        setBlock('');
        setMaxRows('');
        setMaxCols('');
        setBackgroundImage('');
    };

    const columns = [
        { field: 'id', headerName: 'Mã layout', width: 100 },
        { field: 'layoutName', headerName: 'Tên cấu hình', flex: 1, minWidth: 200, renderCell: (params: any) => params.row?.layoutName ?? '—' },
        { field: 'block', headerName: 'Khu / Tòa nhà', width: 150, renderCell: (params: any) => params.row?.block ?? '—' },
        { field: 'maxRows', headerName: 'Số hàng tối đa', width: 150 },
        { field: 'maxCols', headerName: 'Số cột tối đa', width: 150 },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 150,
            sortable: false,
            filterable: false,
            align: 'right' as const,
            headerAlign: 'right' as const,
            renderCell: (params: any) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: '100%', mr: 2 }}>
                    <Button
                        size="small"
                        startIcon={<GridOnIcon />}
                        onClick={() => navigate(`/${prefixAdmin}/room-layout-config/editor/${params.row.id}`)}
                    >
                        Sắp xếp
                    </Button>
                </Stack>
            ),
        },
    ];

    return (
        <>
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
                        onClick={() => setDialogOpen(true)}
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

            <Box sx={{ px: '40px', mx: '-40px', mt: '24px' }}>
                <Card
                    elevation={0}
                    sx={{ ...dataGridCardStyles }}
                >
                    <div style={dataGridContainerStyles}>
                        <DataGrid
                            rows={list}
                            getRowId={(row) => row.id}
                            showToolbar
                            loading={isLoading}
                            columns={columns}
                            density="comfortable"
                            slots={{
                                toolbar: () => (
                                    <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />
                                ),
                                columnSortedAscendingIcon: SortAscendingIcon,
                                columnSortedDescendingIcon: SortDescendingIcon,
                                columnUnsortedIcon: UnsortedIcon,
                                noRowsOverlay: () => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        {isLoading ? <CircularProgress size={32} /> : <span className="text-[1.8rem]">Chưa có layout. Bấm "Thêm layout phòng" để tạo.</span>}
                                    </Box>
                                ),
                            }}
                            localeText={DATA_GRID_LOCALE_VN}
                            pagination
                            pageSizeOptions={[5, 10, 20, { value: -1, label: 'Tất cả' }]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
                            }}
                            getRowHeight={() => 'auto'}
                            disableRowSelectionOnClick
                            sx={dataGridStyles}
                        />
                    </div>
                </Card>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', padding: '8px' }
                }}
            >
                <DialogTitle sx={{ fontSize: '2rem', fontWeight: 700, pb: 2 }}>Thêm layout phòng</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        fullWidth
                        label="Tên layout"
                        margin="dense"
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                        InputProps={{ sx: { fontSize: '1.4rem' } }}
                    />
                    <TextField
                        fullWidth
                        label="Block"
                        margin="dense"
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                        InputProps={{ sx: { fontSize: '1.4rem' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Số hàng (maxRows)"
                            margin="dense"
                            value={maxRows}
                            onChange={(e) => setMaxRows(e.target.value === '' ? '' : Number(e.target.value))}
                            InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                            InputProps={{ sx: { fontSize: '1.4rem' } }}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Số cột (maxCols)"
                            margin="dense"
                            value={maxCols}
                            onChange={(e) => setMaxCols(e.target.value === '' ? '' : Number(e.target.value))}
                            InputLabelProps={{ sx: { fontSize: '1.4rem' } }}
                            InputProps={{ sx: { fontSize: '1.4rem' } }}
                        />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                        <UploadSingleFile
                            title="Ảnh nền (tùy chọn)"
                            value={backgroundImage}
                            onChange={(url) => setBackgroundImage(url)}
                            compact
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        sx={{
                            minHeight: '4.8rem',
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            padding: '8px 24px',
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
                        disabled={
                            isCreating ||
                            !maxRows ||
                            !maxCols ||
                            Number(maxRows) <= 0 ||
                            Number(maxCols) <= 0
                        }
                        onClick={() => create()}
                        sx={{
                            background: '#1C252E',
                            minHeight: '4.8rem',
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            padding: '8px 24px',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': { background: '#454F5B' },
                            '&.Mui-disabled': {
                                background: 'rgba(145, 158, 171, 0.24)',
                                color: 'rgba(145, 158, 171, 0.8)',
                            }
                        }}
                    >
                        {isCreating ? 'Đang xử lý...' : 'Tạo layout'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

