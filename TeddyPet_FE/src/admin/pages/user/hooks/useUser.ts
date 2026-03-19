import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    exportUsersExcel,
    downloadUsersTemplate,
    importUsersExcel,
    previewUsersImportExcel,
} from '../../../api/user.api';
import { ApiResponse } from '../../../config/type';
import { toast } from 'react-toastify';

export const useUsers = (role?: string) => {
    return useQuery({
        queryKey: ['admin-users', role],
        queryFn: () => getUsers(role),
        select: (res: ApiResponse<any>) => {
            if (!res) return [];
            if (Array.isArray(res.data)) return res.data;
            if (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).content))
                return (res.data as any).content;
            return [];
        },
        retry: false,
    });
};

export const useDownloadUsersTemplate = () => {
    return useMutation({
        mutationFn: downloadUsersTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        },
    });
};

export const useExportUsersExcel = () => {
    return useMutation({
        mutationFn: exportUsersExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        },
    });
};

export const useImportUsersExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importUsersExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors = result?.errors ?? [];
            if (errors?.length > 0) {
                const errorStr = errors.map((e: string) => `• ${e}`).join('\n');
                toast.warn(
                    `Hoàn tất nhập dữ liệu:\n  Tạo mới: ${created}\n  Cập nhật: ${updated}\n  Bỏ qua: ${skipped}\n\nLỗi:\n${errorStr}`,
                    { autoClose: 8000 }
                );
            } else {
                toast.success(`Import thành công! Đã tạo ${created}, cập nhật ${updated}, bỏ qua ${skipped} dòng. Tài khoản mới cần đặt lại mật khẩu khi đăng nhập lần đầu.`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Có lỗi khi nhập Excel.');
        },
    });
};

export const usePreviewUsersImportExcel = () => {
    return useMutation({
        mutationFn: previewUsersImportExcel,
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Không thể kiểm tra file Excel.');
        },
    });
};
