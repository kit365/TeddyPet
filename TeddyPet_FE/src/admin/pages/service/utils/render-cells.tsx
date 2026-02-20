import { Avatar, Box, Link, ListItemText } from '@mui/material';
import {
    GridActionsCell,
    GridActionsCellItem,
    GridRenderCellParams,
} from '@mui/x-data-grid';
import { DeleteIcon, EditIcon, EyeIcon } from '../../../assets/icons';
import { COLORS } from '../configs/constants';
import { useDeleteService } from '../hooks/useService';
import { useDeleteServiceCombo } from '../hooks/useServiceCombo';
import { useNavigate } from 'react-router-dom';
import { prefixAdmin } from '../../../constants/routes';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { IService, IServiceCombo, IServiceCategory } from '../configs/types';
import { useDeleteServiceCategory } from '../hooks/useServiceCategory';

dayjs.locale('vi');

export const RenderServiceTitleCell = (params: GridRenderCellParams<IService>) => {
    const { serviceName, imageURL, serviceId } = params.row;
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', py: '16px', gap: '16px', width: '100%' }}>
            <Avatar
                alt={serviceName}
                src={imageURL}
                variant="rounded"
                sx={{ width: 64, height: 64, borderRadius: '12px', backgroundColor: '#F4F6F8' }}
            />
            <ListItemText
                primary={
                    <Link
                        href={`/${prefixAdmin}/service/edit/${serviceId}`}
                        className="product-title"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${prefixAdmin}/service/edit/${serviceId}`);
                        }}
                        underline="hover"
                        sx={{ color: COLORS.primary, fontWeight: 600, fontSize: '1.3rem' }}
                    >
                        {serviceName}
                    </Link>
                }
                slotProps={{ primary: { component: 'span', variant: 'body1', noWrap: true } }}
                sx={{ m: 0 }}
            />
        </Box>
    );
};

export const RenderComboTitleCell = (params: GridRenderCellParams<IServiceCombo>) => {
    const { comboName, imgURL, comboId } = params.row;
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', py: '16px', gap: '16px', width: '100%' }}>
            <Avatar
                alt={comboName}
                src={imgURL}
                variant="rounded"
                sx={{ width: 64, height: 64, borderRadius: '12px', backgroundColor: '#F4F6F8' }}
            />
            <ListItemText
                primary={
                    <Link
                        href={`/${prefixAdmin}/service-combo/edit/${comboId}`}
                        className="product-title"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${prefixAdmin}/service-combo/edit/${comboId}`);
                        }}
                        underline="hover"
                        sx={{ color: COLORS.primary, fontWeight: 600, fontSize: '1.3rem' }}
                    >
                        {comboName}
                    </Link>
                }
                slotProps={{ primary: { component: 'span', variant: 'body1', noWrap: true } }}
                sx={{ m: 0 }}
            />
        </Box>
    );
};

export const RenderCreatedAtCell = ({ value }: { value: Date | string | null }) => {
    if (!value) return null;
    const dateObj = dayjs(value);
    if (!dateObj.isValid()) return null;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1.4rem', color: COLORS.primary }}>{dateObj.format('DD MMM, YYYY')}</span>
            <Box component="span" sx={{ fontSize: '1.2rem', color: COLORS.secondary }}>
                {dateObj.format('hh:mm A')}
            </Box>
        </Box>
    );
};

export const RenderStatusCell = (params: GridRenderCellParams<{ isActive: boolean }>) => {
    const isActive = params.row.isActive;
    const label = isActive ? 'Hoạt động' : 'Tạm dừng';
    const bg = isActive ? '#00B8D929' : '#EF444429';
    const text = isActive ? '#006C9C' : '#B91C1C';
    return (
        <span
            className="inline-flex items-center justify-center leading-1.5 min-w-[2.4rem] h-[2.4rem] text-[1.2rem] px-[6px] font-[700] rounded-[6px]"
            style={{ backgroundColor: bg, color: text }}
        >
            {label}
        </span>
    );
};

export const RenderServiceActionsCell = (params: GridRenderCellParams<IService>) => {
    const navigate = useNavigate();
    const { mutate: deleteService } = useDeleteService();
    const serviceId = params.row.serviceId;

    const handleEdit = () => navigate(`/${prefixAdmin}/service/edit/${serviceId}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
            deleteService(serviceId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Xóa dịch vụ thành công');
                    else toast.error((res as any)?.message ?? 'Có lỗi xảy ra');
                },
            });
        }
    };

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem
                icon={<EyeIcon />}
                label="Chi tiết"
                showInMenu
                onClick={() => navigate(`/${prefixAdmin}/service/edit/${serviceId}`)}
            />
            <GridActionsCellItem icon={<EditIcon />} label="Chỉnh sửa" showInMenu onClick={handleEdit} />
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Xóa"
                showInMenu
                sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                onClick={handleDelete}
            />
        </GridActionsCell>
    );
};

export const RenderCategoryActionsCell = (params: GridRenderCellParams<IServiceCategory>) => {
    const navigate = useNavigate();
    const { mutate: deleteCat } = useDeleteServiceCategory();
    const categoryId = params.row.categoryId;

    const handleEdit = () => navigate(`/${prefixAdmin}/service-category/edit/${categoryId}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
            deleteCat(categoryId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Đã xóa danh mục');
                    else toast.error((res as any)?.message ?? 'Có lỗi');
                },
            });
        }
    };

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem icon={<EyeIcon />} label="Chi tiết" showInMenu onClick={handleEdit} />
            <GridActionsCellItem icon={<EditIcon />} label="Sửa" showInMenu onClick={handleEdit} />
            <GridActionsCellItem icon={<DeleteIcon />} label="Xóa" showInMenu sx={{ '& .MuiTypography-root': { color: '#FF5630' } }} onClick={handleDelete} />
        </GridActionsCell>
    );
};

export const RenderComboActionsCell = (params: GridRenderCellParams<IServiceCombo>) => {
    const navigate = useNavigate();
    const { mutate: deleteCombo } = useDeleteServiceCombo();
    const comboId = params.row.comboId;

    const handleEdit = () => navigate(`/${prefixAdmin}/service-combo/edit/${comboId}`);
    const handleDelete = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này?')) {
            deleteCombo(comboId, {
                onSuccess: (res: { success?: boolean; message?: string }) => {
                    if (res?.success) toast.success('Xóa gói dịch vụ thành công');
                    else toast.error((res as any)?.message ?? 'Có lỗi xảy ra');
                },
            });
        }
    };

    return (
        <GridActionsCell {...params}>
            <GridActionsCellItem
                icon={<EyeIcon />}
                label="Chi tiết"
                showInMenu
                onClick={() => navigate(`/${prefixAdmin}/service-combo/edit/${comboId}`)}
            />
            <GridActionsCellItem icon={<EditIcon />} label="Chỉnh sửa" showInMenu onClick={handleEdit} />
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Xóa"
                showInMenu
                sx={{ '& .MuiTypography-root': { color: '#FF5630' } }}
                onClick={handleDelete}
            />
        </GridActionsCell>
    );
};
