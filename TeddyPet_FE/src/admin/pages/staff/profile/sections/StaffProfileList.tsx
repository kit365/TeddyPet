import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { SortAscendingIcon, SortDescendingIcon, UnsortedIcon, EditIcon, DeleteIcon, GoLiveIcon } from '../../../../assets/icons';
import { DATA_GRID_LOCALE_VN } from '../../../service/configs/localeText.config';
import { useStaffProfiles, useDeactivateStaff, useReactivateStaff } from '../../hooks/useStaffProfile';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../../constants/routes';
import { toast } from 'react-toastify';
import type { IStaffProfile } from '../../../../api/staffProfile.api';
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useMemo, useRef } from 'react';
import { SelectMulti } from '../../../../components/ui/SelectMulti';
import { ExportImport } from '../../../../components/ui/ExportImport';

// ─── Unified badge ───────────────────────────────────────────────────────────
const BADGE_PRESETS = {
    green:  { bg: 'rgba(0, 167, 111, 0.16)',   color: '#007867' },
    blue:   { bg: 'rgba(0, 184, 217, 0.16)',   color: '#006C9C' },
    orange: { bg: 'rgba(255, 171, 0, 0.16)',   color: '#B76E00' },
    red:    { bg: 'rgba(255, 86, 48, 0.16)',   color: '#B71D18' },
    indigo: { bg: 'rgba(99, 102, 241, 0.16)',  color: '#3730A3' },
    violet: { bg: 'rgba(139, 92, 246, 0.16)',  color: '#6D28D9' },
} as const;

type BadgePreset = keyof typeof BADGE_PRESETS;

const Chip = ({ label, preset }: { label: string; preset: BadgePreset }) => {
    const { bg, color } = BADGE_PRESETS[preset];
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                backgroundColor: bg,
                color,
            }}
        >
            {label}
        </span>
    );
};

// ─── Constants ───────────────────────────────────────────────────────────────
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    PART_TIME: 'Bán thời gian',
    FULL_TIME: 'Toàn thời gian',
};

const STATUS_FILTER_OPTIONS = [
    { label: 'Hoạt động', value: 'active' },
    { label: 'Ngừng HĐ', value: 'inactive' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
    { label: 'Toàn thời gian', value: 'FULL_TIME' },
    { label: 'Bán thời gian', value: 'PART_TIME' },
];

// ─── Actions cell ─────────────────────────────────────────────────────────────
const RenderStaffActionsCell = (params: GridRenderCellParams<IStaffProfile>) => {
    const navigate = useNavigate();
    const { mutate: deactivate } = useDeactivateStaff();
    const { mutate: reactivate } = useReactivateStaff();
    const { staffId, userId, active } = params.row;

    const handleEdit = () => navigate(`/${prefixAdmin}/staff/profile/edit/${staffId}`);
    const handleDeactivate = () => {
        if (window.confirm('Bạn có chắc muốn ngừng hoạt động nhân viên này?')) {
            deactivate(staffId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã ngừng hoạt động');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };
    const handleReactivate = () => {
        if (window.confirm('Bạn có chắc muốn kích hoạt lại nhân viên này?')) {
            reactivate(staffId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã kích hoạt lại');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            {userId && active && (
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label={<span style={{ color: '#FF5630' }}>Ngừng HĐ</span>}
                    showInMenu
                    onClick={handleDeactivate}
                />
            )}
            {userId && !active && (
                <GridActionsCellItem icon={<GoLiveIcon />} label="Kích hoạt lại" showInMenu onClick={handleReactivate} />
            )}
        </GridActionsCell>
    );
};

// ─── Columns ──────────────────────────────────────────────────────────────────
const staffColumns: GridColDef<IStaffProfile>[] = [
    {
        field: 'fullName',
        headerName: 'Nhân viên',
        minWidth: 280,
        flex: 1.8,
        renderCell: (params) => {
            const row = params.row as IStaffProfile;
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '12px', width: '100%' }}>
                    <Avatar
                        src={row.avatarUrl ?? row.altImage ?? undefined}
                        alt={row.fullName}
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            bgcolor: '#F4F6F8',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#637381',
                            flexShrink: 0,
                        }}
                        variant="rounded"
                    >
                        {row.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1C252E', lineHeight: 1.4 }}>
                            {row.fullName}
                        </Typography>
                        {row.email && (
                            <Typography noWrap sx={{ fontSize: '0.8125rem', color: '#919EAB', lineHeight: 1.4 }}>
                                {row.email}
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        },
    },
    {
        field: 'phoneNumber',
        headerName: 'SĐT',
        minWidth: 130,
        flex: 0.9,
        valueGetter: (v: string) => v ?? '—',
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem', color: params.value === '—' ? '#919EAB' : '#1C252E' }}>
                {params.value}
            </Typography>
        ),
    },
    {
        field: 'positionName',
        headerName: 'Cấp bậc',
        minWidth: 120,
        flex: 0.8,
        valueGetter: (v: string) => v ?? '—',
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem', color: params.value === '—' ? '#919EAB' : '#1C252E' }}>
                {params.value}
            </Typography>
        ),
    },
    {
        field: 'employmentType',
        headerName: 'Loại hình',
        minWidth: 150,
        flex: 1,
        valueGetter: (v: string) => v ?? null,
        renderCell: (params) => {
            const raw = params.value as string | null;
            if (!raw) return <span style={{ fontSize: '0.875rem', color: '#919EAB' }}>—</span>;
            return (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        padding: '3px 10px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                    }}
                >
                    {EMPLOYMENT_TYPE_LABELS[raw] ?? raw}
                </span>
            );
        },
    },
    {
        field: 'active',
        headerName: 'Trạng thái',
        minWidth: 130,
        flex: 0.9,
        renderCell: (params) => {
            const isActive = Boolean((params.row as IStaffProfile).active);
            return (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '999px',
                            bgcolor: isActive ? '#22C55E' : '#EF4444',
                            boxShadow: isActive ? '0 0 0 3px rgba(34, 197, 94, 0.14)' : '0 0 0 3px rgba(239, 68, 68, 0.12)',
                            flexShrink: 0,
                        }}
                    />
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {isActive ? 'Hoạt động' : 'Ngừng HĐ'}
                    </Typography>
                </Box>
            );
        },
    },
    {
        field: 'userId',
        headerName: 'Tài khoản',
        minWidth: 140,
        flex: 1,
        renderCell: (params) => {
            const row = params.row as IStaffProfile;
            if (!row.userId) {
                return <span style={{ fontSize: '0.8125rem', color: '#919EAB' }}>Chưa cấp</span>;
            }
            const status = row.googleWhitelistStatus;
            if (status === 'ACCEPTED') return <Chip label="Đã xác nhận" preset="indigo" />;
            if (status === 'PENDING')  return <Chip label="Chờ xác nhận" preset="orange" />;
            if (status === 'EXPIRED')  return <Chip label="Hết hạn" preset="red" />;
            return <Chip label="Đã cấp" preset="violet" />;
        },
    },
    {
        field: 'actions',
        headerName: '',
        width: 72,
        flex: 0,
        sortable: false,
        renderCell: (params) => <RenderStaffActionsCell {...params} />,
    },
];

// ─── Main component ───────────────────────────────────────────────────────────
export const StaffProfileList = () => {
    const { data: profiles = [], isLoading } = useStaffProfiles();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [employmentFilter, setEmploymentFilter] = useState<string[]>([]);

    // Filter popover
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const activeFilterCount = statusFilter.length + employmentFilter.length;
    const isFiltered = search.trim() !== '' || activeFilterCount > 0;

    const clearFilters = () => {
        setStatusFilter([]);
        setEmploymentFilter([]);
    };

    const filtered = useMemo(() => {
        let list = profiles as IStaffProfile[];
        if (statusFilter.length > 0) {
            list = list.filter((p) => statusFilter.includes(p.active ? 'active' : 'inactive'));
        }
        if (employmentFilter.length > 0) {
            list = list.filter((p) => p.employmentType && employmentFilter.includes(p.employmentType));
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    p.fullName?.toLowerCase().includes(q) ||
                    p.email?.toLowerCase().includes(q) ||
                    p.phoneNumber?.toLowerCase().includes(q) ||
                    String(p.staffId).includes(q),
            );
        }
        return list;
    }, [profiles, statusFilter, employmentFilter, search]);

    return (
        <Box sx={{ width: '100%' }}>
            <Card
                elevation={0}
                sx={{
                    background: 'white',
                    border: '1px solid rgba(145, 158, 171, 0.2)',
                    borderRadius: '16px',
                }}
            >
                {/* ── Toolbar ── */}
                <Stack
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1.5}
                    sx={{ px: 3, py: 2.5 }}
                >
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Tìm theo tên, email, SĐT, ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            flex: 1,
                            minWidth: 220,
                            maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: '#F4F6F8',
                                height: '40px',
                                '& fieldset': { border: 'none' },
                                '&:hover fieldset': { border: 'none' },
                                '&.Mui-focused fieldset': { border: '1px solid #1C252E' },
                                fontSize: '0.9375rem',
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ flex: 1 }} />

                    {/* Filter button */}
                    <Badge
                        badgeContent={activeFilterCount}
                        color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6875rem', fontWeight: 700 } }}
                    >
                        <Button
                            ref={filterBtnRef}
                            onClick={() => setFilterOpen(true)}
                            startIcon={<FilterListIcon sx={{ fontSize: '1.1rem !important' }} />}
                            sx={{
                                height: '40px',
                                px: 2,
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                color: '#1C252E',
                                border: '1px solid rgba(145, 158, 171, 0.32)',
                                bgcolor: 'white',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#F4F6F8', borderColor: 'rgba(145,158,171,0.52)' },
                            }}
                        >
                            Bộ lọc
                        </Button>
                    </Badge>

                    {/* Export / Import */}
                    <ExportImport />
                </Stack>

                {/* ── Result count + clear ── */}
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 3, pb: 2 }}>
                    <Box
                        sx={{
                            bgcolor: 'rgba(0, 167, 111, 0.1)',
                            px: 1.2,
                            py: 0.5,
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <FilterListIcon sx={{ color: '#00A76F', fontSize: '1.125rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00A76F', fontSize: '0.875rem' }}>
                            Kết quả:{' '}
                            <Box component="span" sx={{ color: '#1C252E' }}>
                                {filtered.length} nhân viên
                            </Box>
                        </Typography>
                    </Box>
                    {isFiltered && (
                        <Button
                            size="small"
                            onClick={() => { clearFilters(); setSearch(''); }}
                            startIcon={<RestartAltIcon sx={{ fontSize: '1rem !important' }} />}
                            sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                borderRadius: '10px',
                                px: 1.5,
                                height: '32px',
                                bgcolor: 'rgba(255, 86, 48, 0.08)',
                                color: '#FF5630',
                                '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.16)' },
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </Stack>

                {/* ── DataGrid ── */}
                <Box sx={{ width: '100%' }}>
                    <DataGrid
                        autoHeight
                        loading={isLoading}
                        rows={filtered}
                        getRowId={(row) => row.staffId}
                        columns={staffColumns}
                        density="comfortable"
                        slots={{
                            columnSortedAscendingIcon: SortAscendingIcon,
                            columnSortedDescendingIcon: SortDescendingIcon,
                            columnUnsortedIcon: UnsortedIcon,
                            noRowsOverlay: () => (
                                <Stack height="100%" alignItems="center" justifyContent="center">
                                    <div className="w-[80px] h-[80px] mb-[12px]">
                                        <img
                                            src="https://img.icons8.com/fluency/200/nothing-found.png"
                                            alt="No data"
                                            className="w-full h-full object-contain filter grayscale opacity-60"
                                        />
                                    </div>
                                    <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'text.secondary' }}>
                                        Không tìm thấy nhân viên nào
                                    </Typography>
                                </Stack>
                            ),
                        }}
                        localeText={DATA_GRID_LOCALE_VN}
                        pagination
                        getRowHeight={() => 'auto'}
                        getEstimatedRowHeight={() => 72}
                        pageSizeOptions={[10, 20, 50, { value: -1, label: 'Tất cả' }]}
                        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
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
                                borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
                                fontSize: '0.875rem',
                            },
                        }}
                    />
                </Box>
            </Card>

            {/* ── Filter Popover ── */}
            <Popover
                open={filterOpen}
                anchorEl={filterBtnRef.current}
                onClose={() => setFilterOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            borderRadius: '16px',
                            minWidth: 280,
                            boxShadow: '0 12px 24px -4px rgba(145,158,171,0.12), 0 0 2px 0 rgba(145,158,171,0.2)',
                            p: 2.5,
                        },
                    },
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1C252E' }}>
                        Bộ lọc
                    </Typography>
                    {activeFilterCount > 0 && (
                        <Button
                            size="small"
                            onClick={clearFilters}
                            startIcon={<RestartAltIcon sx={{ fontSize: '0.9rem !important' }} />}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#FF5630',
                                px: 1,
                                '&:hover': { bgcolor: 'rgba(255,86,48,0.08)' },
                            }}
                        >
                            Xóa tất cả
                        </Button>
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack gap={2}>
                    <Box>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#637381', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Trạng thái
                        </Typography>
                        <SelectMulti
                            label="Chọn trạng thái"
                            options={STATUS_FILTER_OPTIONS}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#637381', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Loại hình làm việc
                        </Typography>
                        <SelectMulti
                            label="Chọn loại hình"
                            options={EMPLOYMENT_TYPE_OPTIONS}
                            value={employmentFilter}
                            onChange={setEmploymentFilter}
                        />
                    </Box>
                </Stack>

                <Button
                    fullWidth
                    onClick={() => setFilterOpen(false)}
                    sx={{
                        mt: 3,
                        height: '40px',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        bgcolor: '#1C252E',
                        color: 'white',
                        '&:hover': { bgcolor: '#2D3A45' },
                    }}
                >
                    Áp dụng
                </Button>
            </Popover>
        </Box>
    );
};

