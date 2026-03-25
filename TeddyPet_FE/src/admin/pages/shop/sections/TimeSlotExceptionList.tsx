import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { useTimeSlotExceptions, useDeleteTimeSlotException } from '../hooks/useTimeSlotException';
import type { ITimeSlotException } from '../../../api/time-slot-exception.api';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { DeleteIcon, EditIcon } from '../../../assets/icons';
import { toast } from 'react-toastify';
import Chip from '@mui/material/Chip';

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const columns = (navigate: (p: string) => void, onDelete: (id: number) => void): GridColDef<ITimeSlotException>[] => [
    { field: 'timeExceptionName', headerName: 'Tên ngoại lệ', flex: 1, minWidth: 200, align: 'center', headerAlign: 'center' },
    { field: 'scope', headerName: 'Phạm vi', width: 100, align: 'center', headerAlign: 'center' },
    {
        field: 'startDate',
        headerName: 'Từ ngày',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => formatDate(params.row.startDate),
    },
    {
        field: 'endDate',
        headerName: 'Đến ngày',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => formatDate(params.row.endDate),
    },
    { field: 'exceptionType', headerName: 'Loại', width: 120, align: 'center', headerAlign: 'center' },
    {
        field: 'isRecurring',
        headerName: 'Lặp',
        width: 80,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Chip
                label={params.row.isRecurring ? 'Có' : 'Không'}
                size="small"
                color={params.row.isRecurring ? 'success' : 'default'}
                variant="outlined"
            />
        ),
    },
    {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <>
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Sửa"
                    onClick={() => navigate(`/${prefixAdmin}/time-slot-exception/edit/${params.row.id}`)}
                />
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Xóa"
                    onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa ngoại lệ này?')) {
                            onDelete(params.row.id);
                        }
                    }}
                />
            </>
        ),
    },
];

export const TimeSlotExceptionList = () => {
    const navigate = useNavigate();
    const { data: exceptions = [], isLoading } = useTimeSlotExceptions();
    const { mutate: deleteException } = useDeleteTimeSlotException();

    const handleDelete = (id: number) => {
        deleteException(id, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success(res.message ?? 'Đã xóa');
                else toast.error(res?.message ?? 'Lỗi');
            },
            onError: () => toast.error('Không thể xóa'),
        });
    };

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    rows={exceptions}
                    getRowId={(row) => row.id}
                    columns={columns(navigate, handleDelete)}
                    showToolbar
                    loading={isLoading}
                    density="comfortable"
                    slots={{
                        toolbar: () => <Toolbar sx={{ minHeight: 'auto', py: 1, px: 2 }} />,
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: () => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {isLoading ? (
                                    <CircularProgress size={32} />
                                ) : (
                                    <span className="text-[1.125rem]">Chưa có ngoại lệ nào</span>
                                )}
                            </Box>
                        ),
                    }}
                    localeText={DATA_GRID_LOCALE_VN}
                    pagination
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                    getRowHeight={() => 'auto'}
                    sx={{
                        ...dataGridStyles,
                        fontSize: '0.875rem',
                        '& .MuiDataGrid-columnHeaders': { fontSize: '0.875rem' },
                        '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
                    }}
                />
            </div>
        </Card>
    );
};
