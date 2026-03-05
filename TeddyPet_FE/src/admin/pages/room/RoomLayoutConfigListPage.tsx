import { useState } from 'react';
import { ListHeader } from '../../components/ui/ListHeader';
import { prefixAdmin } from '../../constants/routes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomLayoutConfigs, createRoomLayoutConfig, updateRoomLayoutStatus } from '../../api/room.api';
import { getServices } from '../../api/service.api';
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ApiResponse } from '../../config/type';
import type { IRoomLayoutConfig } from '../../api/room.api';
import type { IService } from '../service/configs/types';
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

const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Bản nháp', color: '#637381' },
    { value: 'IN_USE', label: 'Đang sử dụng', color: '#00A76F' },
    { value: 'READY_FOR_USE', label: 'Sẵn sàng sử dụng', color: '#00B8D9' },
    { value: 'NO_ROOMS_IS_SORTED', label: 'Chưa sắp xếp phòng', color: '#FFAB00' },
];

const getStatusOption = (value: string) => STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[3];

export const RoomLayoutConfigListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: list = [], isLoading } = useQuery({
        queryKey: ['room-layout-configs'],
        queryFn: () => getRoomLayoutConfigs(),
        select: (res: ApiResponse<IRoomLayoutConfig[]>) => res.data ?? [],
    });

    const { data: services = [] } = useQuery({
        queryKey: ['services', 'isRequiredRoom'],
        queryFn: () => getServices({ isRequiredRoom: true }),
        select: (res: ApiResponse<IService[]>) => res.data ?? [],
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [layoutName, setLayoutName] = useState('Layout mới');
    const [maxRows, setMaxRows] = useState<number | ''>('');
    const [maxCols, setMaxCols] = useState<number | ''>('');
    const [backgroundImage, setBackgroundImage] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: () =>
            createRoomLayoutConfig({
                layoutName: layoutName.trim() || 'Layout mới',
                maxRows: typeof maxRows === 'number' ? maxRows : Number(maxRows),
                maxCols: typeof maxCols === 'number' ? maxCols : Number(maxCols),
                backgroundImage: backgroundImage.trim() || null,
                serviceId: selectedServiceId || null,
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

    const { mutate: mutateStatus } = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => updateRoomLayoutStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room-layout-configs'] });
            toast.success('Cập nhật trạng thái thành công');
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? 'Cập nhật trạng thái thất bại');
        },
    });

    const handleClose = () => {
        setDialogOpen(false);
        setLayoutName('Layout mới');
        setMaxRows('');
        setMaxCols('');
        setBackgroundImage('');
        setSelectedServiceId('');
    };

    const columns = [
        { field: 'id', headerName: 'Mã layout', width: 100 },
        { field: 'layoutName', headerName: 'Tên cấu hình', flex: 1, minWidth: 200, renderCell: (params: any) => params.row?.layoutName ?? '—' },
        { field: 'serviceName', headerName: 'Dịch vụ', width: 180, renderCell: (params: any) => params.row?.serviceName ?? '—' },
        { field: 'maxRows', headerName: 'Số hàng tối đa', width: 130 },
        { field: 'maxCols', headerName: 'Số cột tối đa', width: 130 },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 220,
            sortable: false,
            renderCell: (params: any) => {
                const currentStatus = params.row?.status ?? 'NO_ROOMS_IS_SORTED';
                const opt = getStatusOption(currentStatus);
                return (
                    <Select
                        size="small"
                        value={currentStatus}
                        onChange={(e) => {
                            mutateStatus({ id: params.row.id, status: e.target.value as string });
                        }}
                        sx={{
                            fontSize: '1.3rem',
                            fontWeight: 600,
                            minWidth: 180,
                            borderRadius: '8px',
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(145,158,171,0.32)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: opt.color },
                        }}
                        renderValue={(value) => {
                            const o = getStatusOption(value);
                            return (
                                <Chip
                                    label={o.label}
                                    size="small"
                                    sx={{
                                        bgcolor: `${o.color}14`,
                                        color: o.color,
                                        fontWeight: 700,
                                        fontSize: '1.2rem',
                                        height: 28,
                                    }}
                                />
                            );
                        }}
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value} sx={{ fontSize: '1.3rem' }}>
                                <Chip
                                    label={o.label}
                                    size="small"
                                    sx={{
                                        bgcolor: `${o.color}14`,
                                        color: o.color,
                                        fontWeight: 700,
                                        fontSize: '1.2rem',
                                        height: 28,
                                        mr: 1,
                                    }}
                                />
                            </MenuItem>
                        ))}
                    </Select>
                );
            },
        },
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
                    <FormControl fullWidth margin="dense">
                        <InputLabel sx={{ fontSize: '1.4rem' }}>Dịch vụ yêu cầu phòng</InputLabel>
                        <Select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value as number)}
                            label="Dịch vụ yêu cầu phòng"
                            sx={{ fontSize: '1.4rem' }}
                        >
                            <MenuItem value="" sx={{ fontSize: '1.4rem' }}><em>— Không chọn —</em></MenuItem>
                            {services.map((s) => (
                                <MenuItem key={s.serviceId} value={s.serviceId} sx={{ fontSize: '1.4rem' }}>
                                    {s.serviceName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
