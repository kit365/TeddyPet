import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon } from '../../../assets/icons';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import { useState, useMemo, useEffect } from 'react';
import { useUsers } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import type { IUserProfile, UserStatusEnum } from '../../../api/user.api';

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<UserStatusEnum, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    LOCKED: 'Khóa',
    PENDING_VERIFICATION: 'Chờ xác thực',
};

const getStatusStyles = (status: UserStatusEnum) => {
    switch (status) {
        case 'ACTIVE': return { color: '#22C55E' };
        case 'INACTIVE': return { color: '#EF4444' };
        case 'LOCKED': return { color: '#FF5630' };
        case 'PENDING_VERIFICATION': return { color: '#FFAB00' };
        default: return { color: '#919EAB' };
    }
};

// ─── Actions cell (Premium Styled) ───────────────────────────────────────────
const RenderUserActionsCell = ({ row }: { row: IUserProfile }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState<null | HTMLElement>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setOpen(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setOpen(null);
    };

    const handleViewDetail = () => {
        handleCloseMenu();
        navigate(`/${prefixAdmin}/user/detail/${row.id}`);
    };

    const handleInviteStaff = () => {
        handleCloseMenu();
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
        const inviteStaffPath = `/${prefixAdmin}/staff/profile/onboarding?${new URLSearchParams({
            ...(row.email && { email: row.email }),
            ...(fullName && { fullName }),
            ...(row.phoneNumber && { phoneNumber: row.phoneNumber }),
        }).toString()}`;
        navigate(inviteStaffPath);
    };

    return (
        <>
            <IconButton onClick={handleOpenMenu} sx={{ color: '#637381' }}>
                <MoreVertIcon />
            </IconButton>

            <Popover
                open={Boolean(open)}
                anchorEl={open}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 0.5,
                            width: 180,
                            borderRadius: '12px',
                            boxShadow: '0 12px 24px -4px rgba(145,158,171,0.12), 0 0 2px 0 rgba(145,158,171,0.2)',
                            '& .MuiMenuItem-root': {
                                px: 1,
                                py: 1,
                                borderRadius: '8px',
                                gap: 1.5,
                                color: '#1C252E',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: 'rgba(145, 158, 171, 0.08)',
                                },
                            },
                        },
                    },
                }}
            >
                <MenuItem onClick={handleViewDetail}>
                    <VisibilityIcon sx={{ width: 18, height: 18, color: '#637381' }} />
                    Xem chi tiết
                </MenuItem>

                <MenuItem onClick={handleInviteStaff}>
                    <PersonAddIcon sx={{ width: 18, height: 18, color: '#637381' }} />
                    Mời làm nhân viên
                </MenuItem>
            </Popover>
        </>
    );
};

// ─── Columns ──────────────────────────────────────────────────────────────────
const userColumns: GridColDef<IUserProfile>[] = [
    {
        field: 'username',
        headerName: 'Người dùng',
        minWidth: 260,
        flex: 1.5,
        renderCell: (params) => {
            const row = params.row;
            const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.username;
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '12px', width: '100%' }}>
                    <Avatar
                        src={row.avatarUrl ?? undefined}
                        alt={fullName}
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            bgcolor: '#F4F6F8',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#637381',
                            flexShrink: 0,
                        }}
                        variant="rounded"
                    >
                        {fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1C252E', lineHeight: 1.4 }}>
                            {fullName}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: '0.8125rem', color: '#919EAB', lineHeight: 1.4 }}>
                            {row.email}
                        </Typography>
                    </Box>
                </Box>
            );
        },
    },
    {
        field: 'phoneNumber',
        headerName: 'SĐT',
        width: 140,
        valueGetter: (v: string) => v ?? '—',
    },
    {
        field: 'role',
        headerName: 'Vai trò',
        width: 120,
        renderCell: (params) => {
            const role = params.value as string;
            return (
                <Box
                    sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: role === 'ADMIN' ? 'rgba(255, 86, 48, 0.16)' : 'rgba(145, 158, 171, 0.16)',
                        color: role === 'ADMIN' ? '#B71D18' : '#637381',
                        display: 'inline-flex',
                    }}
                >
                    {role}
                </Box>
            );
        },
    },
    {
        field: 'status',
        headerName: 'Trạng thái',
        width: 160,
        renderCell: (params) => {
            const status = params.value as UserStatusEnum;
            const styles = getStatusStyles(status);
            return (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '999px',
                            bgcolor: styles.color,
                            boxShadow: `0 0 0 3px ${styles.color}22`,
                            flexShrink: 0,
                        }}
                    />
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[status] ?? status}
                    </Typography>
                </Box>
            );
        },
    },
    {
        field: 'actions',
        headerName: '',
        width: 72,
        sortable: false,
        renderCell: (params) => <RenderUserActionsCell row={params.row} />,
    },
];

export const UserList = () => {
    const [role] = useState<string | undefined>('USER');
    const { data: users = [], isLoading, isError, refetch } = useUsers(role);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isError) {
            toast.error('Không tải được danh sách. Đăng xuất rồi đăng nhập lại bằng tài khoản ADMIN.');
        }
    }, [isError]);


    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        
        const q = search.trim().toLowerCase();
        return users.filter(u => 
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q) ||
            u.phoneNumber?.toLowerCase().includes(q)
        );
    }, [users, search]);


    return (
        <Card
            elevation={0}
            sx={{
                background: 'white',
                border: '1px solid rgba(145, 158, 171, 0.2)',
                borderRadius: '16px',
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                sx={{ px: 3, py: 3, gap: 2 }}
            >
                <TextField
                    size="small"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        flex: 1,
                        maxWidth: 320,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '14px',
                            bgcolor: 'white',
                            height: '44px',
                            border: '1px solid rgba(145, 158, 171, 0.24)',
                            transition: 'all 0.2s ease',
                            '& fieldset': { border: 'none' },
                            '&:hover': {
                                bgcolor: '#F9FAFB',
                                borderColor: 'rgba(145, 158, 171, 0.44)',
                            },
                            '&.Mui-focused': {
                                bgcolor: 'white',
                                boxShadow: '0 0 0 3px rgba(28, 37, 46, 0.05)',
                                borderColor: '#1C252E',
                            },
                            fontSize: '0.9375rem',
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 1 }}>
                                <SearchIcon sx={{ color: '#637381', fontSize: '1.25rem' }} />
                            </InputAdornment>
                        ),
                    }}
                />


                <Box sx={{ flexGrow: 1 }} />

                <IconButton 
                    onClick={() => {
                        refetch();
                        toast.info('Đang làm mới dữ liệu...');
                    }}
                    sx={{ 
                        color: '#637381',
                        bgcolor: 'rgba(145, 158, 171, 0.08)',
                        '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.16)' }
                    }}
                >
                    <RefreshIcon />
                </IconButton>
            </Stack>

            <Box sx={{ width: '100%' }}>
                <DataGrid
                    autoHeight
                    loading={isLoading}
                    rows={filteredUsers}
                    getRowId={(row) => row.id}
                    columns={userColumns}
                    density="comfortable"
                    slots={{
                        columnSortedAscendingIcon: SortAscendingIcon,
                        columnSortedDescendingIcon: SortDescendingIcon,
                        columnUnsortedIcon: UnsortedIcon,
                        noRowsOverlay: () => (
                            <Stack height="100%" alignItems="center" justifyContent="center" sx={{ py: 5 }}>
                                <div className="w-[80px] h-[80px] mb-[12px]">
                                    <img
                                        src="https://img.icons8.com/fluency/200/nothing-found.png"
                                        alt="No data"
                                        className="w-full h-full object-contain filter grayscale opacity-60"
                                    />
                                </div>
                                <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'text.secondary' }}>
                                    {isError ? 'Không tải được danh sách người dùng' : 'Không tìm thấy người dùng'}
                                </Typography>
                            </Stack>
                        ),
                    }}
                    localeText={DATA_GRID_LOCALE_VN}
                    pagination
                    pageSizeOptions={[5, 10, 20, { value: -1, label: 'Tất cả' }]}
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                    getRowHeight={() => 'auto'}
                    getEstimatedRowHeight={() => 72}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeader': {
                            bgcolor: '#F4F6F8',
                            color: '#637381',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                        },
                        '& .MuiDataGrid-columnHeader:first-of-type': { pl: 3 },
                        '& .MuiDataGrid-cell:first-of-type': { pl: 3 },
                        '& .MuiDataGrid-cell': {
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(145, 158, 171, 0.08)',
                            fontSize: '0.875rem',
                        },
                    }}
                />
            </Box>
        </Card>
    );
};
