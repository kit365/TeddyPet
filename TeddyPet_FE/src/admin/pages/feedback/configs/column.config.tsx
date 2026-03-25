import { GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Stack, Rating, Avatar, IconButton, Tooltip } from '@mui/material';
import { FeedbackResponse } from '../../../../api/feedback.api';
import DeleteIcon from '@mui/icons-material/Delete';

export const getFeedbackColumns = (
    onDeleteFeedback?: (id: number) => void
): GridColDef<FeedbackResponse>[] => [
        {
            field: 'id',
            headerName: 'ID',
            width: 60,
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'customer',
            headerName: 'Khách hàng',
            width: 200,
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1, width: '100%' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#F4F6F8', color: '#637381', fontSize: '1rem', fontWeight: 800 }}>
                            {(row.userName || row.guestName || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack spacing={0} sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#1C252E' }}>
                                {row.userName || row.guestName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#919EAB', fontWeight: 700 }}>
                                {row.isPurchased ? 'Đã mua' : 'Chưa khách'}
                            </Typography>
                        </Stack>
                    </Stack>
                );
            }
        },
        {
            field: 'product',
            headerName: 'Sản phẩm',
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => {
                const row = params.row;
                return (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1, width: '100%' }}>
                        <Box
                            component="img"
                            src={row.productImage}
                            alt={row.productName}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '6px',
                                objectFit: 'cover',
                                border: '1px solid #919eab1f',
                                shrink: 0
                            }}
                        />
                        <Stack spacing={0} sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1C252E' }}>
                                {row.productName}
                            </Typography>
                            {row.variantName && (
                                <Typography noWrap sx={{ fontSize: '0.95rem', color: '#637381', fontWeight: 600 }}>
                                    {row.variantName}
                                </Typography>
                            )}
                        </Stack>
                    </Stack>
                );
            }
        },
        {
            field: 'rating',
            headerName: 'Đánh giá',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rating value={params.value as number} readOnly size="small" sx={{ fontSize: '1.4rem' }} />
                </Box>
            )
        },
        {
            field: 'comment',
            headerName: 'Nội dung',
            flex: 2,
            minWidth: 250,
            renderCell: (params) => (
                <Box sx={{ py: 1, pr: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Typography
                        sx={{
                            fontSize: '1.15rem',
                            color: '#454F5B',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'normal'
                        }}
                    >
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Ngày gửi',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const date = new Date(params.value);
                return (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stack spacing={0} alignItems="center">
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1C252E' }}>
                                {date.toLocaleDateString('vi-VN')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#919EAB', fontWeight: 700 }}>
                                {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </Stack>
                    </Box>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 100,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center" sx={{ height: '100%' }}>
                    <Tooltip title="Xóa đánh giá">
                        <IconButton
                            size="small"
                            onClick={() => onDeleteFeedback?.(params.row.id)}
                            sx={{ color: '#FF5630', '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.08)' } }}
                        >
                            <DeleteIcon sx={{ fontSize: '1.8rem' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ];
