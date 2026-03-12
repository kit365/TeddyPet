import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { ListHeader } from '../../../components/ui/ListHeader';
import { prefixAdmin } from '../../../constants/routes';
import { useStaffProfiles } from '../hooks/useStaffProfile';
import { useStaffSkillsByStaffId, useCreateStaffSkill, useUpdateStaffSkill, useDeleteStaffSkill } from '../hooks/useStaffSkill';
import { useSkills } from '../hooks/useSkill';
import { DataGrid, GridActionsCell, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../../service/configs/styles.config';
import { DATA_GRID_LOCALE_VN } from '../../service/configs/localeText.config';
import type { IStaffSkill, IStaffSkillRequest, ProficiencyLevel } from '../../../api/staffSkill.api';
import { toast } from 'react-toastify';
import { EditIcon, DeleteIcon } from '../../../assets/icons';

const LEVEL_LABELS: Record<string, string> = { BEGINNER: 'Cơ bản', ADVANCED: 'Nâng cao', EXPERT: 'Chuyên gia' };
const PROFICIENCY_OPTIONS: { value: ProficiencyLevel; label: string }[] = [
    { value: 'BEGINNER', label: 'Cơ bản' },
    { value: 'ADVANCED', label: 'Nâng cao' },
    { value: 'EXPERT', label: 'Chuyên gia' },
];

export const StaffSkillListPage = () => {
    const [staffId, setStaffId] = useState<number | ''>('');
    const [openAssign, setOpenAssign] = useState(false);
    const [assignSkillId, setAssignSkillId] = useState<number | ''>('');
    const [assignLevel, setAssignLevel] = useState<ProficiencyLevel>('BEGINNER');
    const [assignCommission, setAssignCommission] = useState<string>('10');

    const [editingRow, setEditingRow] = useState<IStaffSkill | null>(null);
    const [editLevel, setEditLevel] = useState<ProficiencyLevel>('BEGINNER');
    const [editCommission, setEditCommission] = useState<string>('10');

    const { data: profiles = [] } = useStaffProfiles();
    const { data: skills = [] } = useSkills();
    const { data: staffSkills = [], isLoading } = useStaffSkillsByStaffId(staffId || null);
    const { mutate: createStaffSkill, isPending: isCreating } = useCreateStaffSkill();
    const { mutate: updateStaffSkill, isPending: isUpdating } = useUpdateStaffSkill();
    const { mutate: deleteStaffSkill } = useDeleteStaffSkill();

    const handleOpenAssign = () => {
        setAssignSkillId('');
        setAssignLevel('INTERMEDIATE');
        setAssignCommission('10');
        setOpenAssign(true);
    };

    const handleAssignSubmit = () => {
        if (staffId === '' || assignSkillId === '') {
            toast.warning('Vui lòng chọn kỹ năng.');
            return;
        }
        const commission = Number(assignCommission);
        if (Number.isNaN(commission) || commission < 0 || commission > 100) {
            toast.warning('% Hoa hồng phải từ 0 đến 100.');
            return;
        }
        const payload: IStaffSkillRequest = {
            staffId: staffId as number,
            skillId: assignSkillId as number,
            proficiencyLevel: assignLevel,
            commissionRate: commission,
        };
        createStaffSkill(payload, {
            onSuccess: (res: any) => {
                if (res?.success) {
                    toast.success(res.message ?? 'Gán kỹ năng thành công');
                    setOpenAssign(false);
                } else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra';
                toast.error(msg);
            },
        });
    };

    const handleOpenEdit = (row: IStaffSkill) => {
        setEditingRow(row);
        setEditLevel(row.proficiencyLevel);
        setEditCommission(String(row.commissionRate));
    };

    const handleEditSubmit = () => {
        if (!editingRow || staffId === '') return;
        const commission = Number(editCommission);
        if (Number.isNaN(commission) || commission < 0 || commission > 100) {
            toast.warning('% Hoa hồng phải từ 0 đến 100.');
            return;
        }
        const payload: IStaffSkillRequest = {
            staffId: staffId as number,
            skillId: editingRow.skillId,
            proficiencyLevel: editLevel,
            commissionRate: commission,
        };
        updateStaffSkill(
            { id: editingRow.id, data: payload },
            {
                onSuccess: (res: any) => {
                    if (res?.success) {
                        toast.success(res.message ?? 'Cập nhật thành công');
                        setEditingRow(null);
                    } else toast.error(res?.message ?? 'Có lỗi');
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra');
                },
            }
        );
    };

    const handleDelete = (row: IStaffSkill) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kỹ năng "${row.skillName}" khỏi nhân viên này?`)) return;
        deleteStaffSkill(row.id, {
            onSuccess: (res: any) => {
                if (res?.success) toast.success(res.message ?? 'Xóa kỹ năng thành công');
                else toast.error(res?.message ?? 'Có lỗi');
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra');
            },
        });
    };

    const RenderStaffSkillStatusCell = (params: GridRenderCellParams<IStaffSkill>) => {
        const isActive = params.row.active;
        const label = isActive ? 'Hoạt động' : 'Tạm dừng';
        const bg = isActive ? '#00B8D929' : '#EF444429';
        const text = isActive ? '#006C9C' : '#B91C1C';

        return (
            <span
                className="inline-flex items-center justify-center leading-1.5 min-w-[1.5rem] h-[1.5rem] text-[0.75rem] px-[6px] font-[700] rounded-[6px]"
                style={{ backgroundColor: bg, color: text }}
            >
                {label}
            </span>
        );
    };

    const RenderStaffSkillActionsCell = (params: { row: IStaffSkill }) => {
        const { row } = params;

        return (
            <GridActionsCell>
                <GridActionsCellItem
                    icon={<EditIcon fontSize="small" />}
                    label="Sửa"
                    showInMenu
                    onClick={() => handleOpenEdit(row)}
                />
                <GridActionsCellItem
                    icon={<DeleteIcon fontSize="small" />}
                    label="Xóa"
                    showInMenu
                    sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                    onClick={() => handleDelete(row)}
                />
            </GridActionsCell>
        );
    };

    const columns: GridColDef<IStaffSkill>[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'skillCode', headerName: 'Mã KN', width: 120 },
        { field: 'skillName', headerName: 'Kỹ năng', flex: 1, minWidth: 160 },
        { field: 'proficiencyLevel', headerName: 'Trình độ', width: 120, valueGetter: (_, row) => LEVEL_LABELS[row.proficiencyLevel] ?? row.proficiencyLevel },
        { field: 'commissionRate', headerName: '% Hoa hồng', width: 120 },
        { field: 'active', headerName: 'Trạng thái', width: 120, renderCell: RenderStaffSkillStatusCell },
        {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params) => <RenderStaffSkillActionsCell row={params.row} />,
        },
    ];

    return (
        <>
            <ListHeader
                title="Kỹ năng nhân viên"
                breadcrumbItems={[
                    { label: 'Trang chủ', to: '/' },
                    { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                    { label: 'Kỹ năng nhân viên' },
                ]}
            />
            <Box sx={{ px: '40px', mt: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        select
                        label="Chọn nhân viên"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                        sx={{ minWidth: 280 }}
                    >
                        <MenuItem value="">— Chọn nhân viên —</MenuItem>
                        {profiles.map((p) => (
                            <MenuItem key={p.staffId} value={p.staffId}>{p.fullName} (ID: {p.staffId})</MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        onClick={handleOpenAssign}
                        disabled={staffId === ''}
                        sx={{
                            backgroundColor: 'rgb(5 150 105)', // emerald-600
                            minHeight: '1.875rem',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            px: 2.5,
                            borderRadius: '0.5625rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
                            '&:hover': {
                                backgroundColor: 'rgb(4 120 87)', // emerald-700
                                boxShadow: '0 8px 18px rgba(16,185,129,0.35)',
                            },
                            '&.Mui-disabled': {
                                backgroundColor: 'rgba(209,250,229,1)',
                                color: 'rgba(148,163,184,1)',
                                boxShadow: 'none',
                            },
                        }}
                    >
                        Gán kỹ năng
                    </Button>
                </Box>
                <Card elevation={0} sx={dataGridCardStyles}>
                    <div style={dataGridContainerStyles}>
                        <DataGrid
                            rows={staffSkills}
                            getRowId={(row) => row.id}
                            loading={isLoading}
                            columns={columns}
                            localeText={DATA_GRID_LOCALE_VN}
                            pagination
                            pageSizeOptions={[5, 10, 20]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            sx={dataGridStyles}
                        />
                    </div>
                </Card>
            </Box>

            <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Gán kỹ năng cho nhân viên</DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 640,
                            mx: 'auto',
                            borderRadius: 3,
                            bgcolor: '#ffffff',
                            boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
                            border: '1px solid rgba(229,231,235,1)',
                            p: 3,
                        }}
                    >
                        <Stack spacing={2.5}>
                            <TextField
                                select
                                label="Kỹ năng"
                                value={assignSkillId}
                                onChange={(e) => setAssignSkillId(e.target.value ? Number(e.target.value) : '')}
                                fullWidth
                                required
                            >
                                <MenuItem value="">— Chọn kỹ năng —</MenuItem>
                                {skills.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>{s.code} – {s.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Trình độ"
                                value={assignLevel}
                                onChange={(e) => setAssignLevel(e.target.value as ProficiencyLevel)}
                                fullWidth
                            >
                                {PROFICIENCY_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="% Hoa hồng"
                                type="number"
                                value={assignCommission}
                                onChange={(e) => setAssignCommission(e.target.value)}
                                inputProps={{ min: 0, max: 100, step: 0.5 }}
                                fullWidth
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setOpenAssign(false)} variant="outlined">
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleAssignSubmit} disabled={isCreating || assignSkillId === ''}>
                        {isCreating ? 'Đang lưu...' : 'Gán kỹ năng'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!editingRow} onClose={() => setEditingRow(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Cập nhật kỹ năng {editingRow ? `– ${editingRow.skillName}` : ''}</DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 640,
                            mx: 'auto',
                            borderRadius: 3,
                            bgcolor: '#ffffff',
                            boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
                            border: '1px solid rgba(229,231,235,1)',
                            p: 3,
                        }}
                    >
                        <Stack spacing={2.5}>
                            <TextField
                                select
                                label="Trình độ"
                                value={editLevel}
                                onChange={(e) => setEditLevel(e.target.value as ProficiencyLevel)}
                                fullWidth
                            >
                                {PROFICIENCY_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="% Hoa hồng"
                                type="number"
                                value={editCommission}
                                onChange={(e) => setEditCommission(e.target.value)}
                                inputProps={{ min: 0, max: 100, step: 0.5 }}
                                fullWidth
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setEditingRow(null)} variant="outlined">
                        Hủy
                    </Button>
                    <Button variant="contained" onClick={handleEditSubmit} disabled={isUpdating}>
                        {isUpdating ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
