import { GridColDef } from '@mui/x-data-grid';
import { ShippingRule } from '../../../../types/shipping.type';
import { IconButton, Tooltip, Typography, Box, Stack } from '@mui/material';
import { DeleteIcon, EditIcon } from '../../../assets/icons';
import { PROVINCES } from './provinces';

interface ShippingColumnProps {
    onEdit: (row: ShippingRule) => void;
    onDelete: (id: number) => void;
}

export const getShippingColumns = ({ onEdit, onDelete }: ShippingColumnProps): GridColDef[] => [
    {
        field: 'provinceId',
        headerName: 'Vùng áp dụng',
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => {
            const province = PROVINCES.find(p => p.id === params.value);
            const isInnerCity = params.row.isInnerCity;
            return (
                <Stack spacing={0.5} sx={{ py: 1.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1C252E' }}>
                        {province ? province.name : `Mã: ${params.value}`}
                    </Typography>
                    <Box sx={{
                        display: 'inline-flex',
                        width: 'fit-content',
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                        bgcolor: isInnerCity ? 'rgba(0, 167, 111, 0.1)' : 'rgba(0, 108, 156, 0.1)',
                        color: isInnerCity ? '#00A76F' : '#006C9C',
                    }}>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            {isInnerCity ? 'Nội thành' : 'Ngoại thành'}
                        </Typography>
                    </Box>
                </Stack>
            );
        }
    },
    {
        field: 'feePerKm',
        headerName: 'Đơn giá & Tối thiểu',
        flex: 1.5,
        minWidth: 220,
        renderCell: (params) => (
            <Stack spacing={0.5} sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1C252E' }}>
                    +{params.value?.toLocaleString()}đ<Box component="span" sx={{ fontSize: '0.75rem', color: '#637381', fontWeight: 500 }}>/km</Box>
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#637381', fontWeight: 600 }}>
                    Tối thiểu: <Box component="span" sx={{ color: '#1C252E', fontWeight: 700 }}>{(params.row.minFee || 0).toLocaleString()}đ</Box>
                </Typography>
            </Stack>
        )
    },
    {
        field: 'overWeightFee',
        headerName: 'Phụ phí cân nặng',
        flex: 1.2,
        minWidth: 160,
        renderCell: (params) => (
            <Stack spacing={0.5} sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1C252E' }}>
                    +{params.value?.toLocaleString()}đ<Box component="span" sx={{ fontSize: '0.75rem', color: '#637381', fontWeight: 500 }}>/kg</Box>
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: '#637381', fontWeight: 600 }}>
                    Trên {params.row.baseWeight}kg
                </Typography>
            </Stack>
        )
    },
    {
        field: 'freeShipDistanceKm',
        headerName: 'Miễn phí (KM & Đơn)',
        flex: 1.5,
        minWidth: 200,
        renderCell: (params) => (
            <Stack spacing={0.5} sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#00A76F' }}>
                    Dưới {params.value} km
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#637381', fontWeight: 600 }}>
                    Hoặc đơn từ: <Box component="span" sx={{ color: '#1C252E', fontWeight: 700 }}>{(params.row.freeShipThreshold || 0).toLocaleString()}đ</Box>
                </Typography>
            </Stack>
        )
    },
    {
        field: 'maxInternalDistanceKm',
        headerName: 'Giới hạn & Phương thức',
        flex: 1.5,
        minWidth: 200,
        renderCell: (params) => {
            const isSelfShip = params.row.isSelfShip;
            return (
                <Stack spacing={0.5} sx={{ py: 1.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1C252E' }}>
                        Dưới {params.value} km
                    </Typography>
                    <Box sx={{
                        display: 'inline-flex',
                        width: 'fit-content',
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                        bgcolor: isSelfShip ? 'rgba(0, 167, 111, 0.1)' : 'rgba(255, 86, 48, 0.1)',
                        color: isSelfShip ? '#00A76F' : '#FF5630',
                        border: isSelfShip ? 'none' : '1px solid rgba(255, 86, 48, 0.2)'
                    }}>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            {isSelfShip ? 'Shop tự vận chuyển' : 'Cần gọi Grab/Ahamove'}
                        </Typography>
                    </Box>
                </Stack>
            );
        }
    },
    {
        field: 'actions',
        headerName: 'Thao tác',
        width: 120,
        sortable: false,
        filterable: false,
        hideable: false,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Stack direction="row" spacing={1} justifyContent="center" width="100%">
                <Tooltip title="Chỉnh sửa">
                    <IconButton
                        size="small"
                        onClick={() => onEdit(params.row)}
                        sx={{
                            color: '#006C9C',
                            bgcolor: 'rgba(0, 108, 156, 0.05)',
                            '&:hover': { bgcolor: 'rgba(0, 108, 156, 0.15)' }
                        }}
                    >
                        <EditIcon sx={{ fontSize: '1.125rem' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                    <IconButton
                        size="small"
                        onClick={() => onDelete(params.row.id)}
                        sx={{
                            color: '#FF5630',
                            bgcolor: 'rgba(255, 86, 48, 0.05)',
                            '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.15)' }
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: '1.125rem' }} />
                    </IconButton>
                </Tooltip>
            </Stack>
        ),
    },
];
