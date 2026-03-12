import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PRODUCTS_QUERY_KEY } from './useProducts';
import {
    getProductTags, createProductTag, updateProductTag, deleteProductTag,
    getProductAgeRanges, createProductAgeRange, updateProductAgeRange, deleteProductAgeRange, getProductAgeRangeById,
    getCountries, createProduct, getProductById, updateProduct, deleteProduct,
    getPetTypes, getSalesUnits, getProductStatuses, getProductTypes,
    exportProductsExcel, downloadProductsTemplate, importProductsExcel,
    exportTagsExcel, downloadTagsTemplate, importTagsExcel,
    exportAgeRangesExcel, downloadAgeRangesTemplate, importAgeRangesExcel
} from '../../../api/product.api';
import { getBrands } from '../../../api/brand.api';
import { ApiResponse } from '../../../config/type';

// --- COUNTRIES ---
const transformCountries = (data: any) => data.map((country: any) => ({
    code: country.cca2,
    name: country.name.common
})).sort((a: any, b: any) => a.name.localeCompare(b.name));

export const useCountries = () => {
    return useQuery({
        queryKey: ['countries'],
        queryFn: getCountries,
        select: transformCountries
    });
};

// --- TAGS ---
export const useProductTags = () => {
    return useQuery({
        queryKey: ['product-tags'],
        queryFn: getProductTags,
        select: (res: ApiResponse<any>) => res.data ?? [], // Use nullish coalescing to avoid new array ref if possible, although res.data is usually stable
    });
};

export const useCreateProductTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
        },
    });
};

export const useUpdateProductTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateProductTag(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
        },
    });
};

export const useDeleteProductTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
        },
    });
};

export const useDownloadTagsTemplate = () => {
    return useMutation({
        mutationFn: downloadTagsTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'tags_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useExportTagsExcel = () => {
    return useMutation({
        mutationFn: exportTagsExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'tags_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useImportTagsExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importTagsExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['product-tags'] });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors = result?.errors ?? [];

            if (errors && errors.length > 0) {
                const errorStr = errors.map((e: string) => `• ${e}`).join('\n');
                toast.warn(
                    `Hoàn tất nhập dữ liệu:\n  Tạo mới: ${created}\n  Cập nhật: ${updated}\n  Bỏ qua: ${skipped}\n\nLỗi:\n${errorStr}`,
                    { autoClose: 8000 }
                );
            } else {
                toast.success(`Import thành công! Đã tạo ${created}, tự động cập nhật ${updated}, bỏ qua ${skipped} dòng.`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu từ Excel');
        }
    });
};

// --- AGE RANGES ---
export const useProductAgeRanges = () => {
    return useQuery({
        queryKey: ['product-age-ranges'],
        queryFn: getProductAgeRanges,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

export const useProductAgeRangeDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['product-age-range', id],
        queryFn: () => getProductAgeRangeById(id!),
        enabled: !!id,
        select: (res: any) => res.data,
    });
};

export const useCreateProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductAgeRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
        },
    });
};

export const useUpdateProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateProductAgeRange(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
            queryClient.invalidateQueries({ queryKey: ['product-age-range', variables.id] });
        },
    });
};

export const useDeleteProductAgeRange = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductAgeRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
        },
    });
};

export const useDownloadAgeRangesTemplate = () => {
    return useMutation({
        mutationFn: downloadAgeRangesTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ageranges_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useExportAgeRangesExcel = () => {
    return useMutation({
        mutationFn: exportAgeRangesExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ageranges_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useImportAgeRangesExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importAgeRangesExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['product-age-ranges'] });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors = result?.errors ?? [];

            if (errors && errors.length > 0) {
                const errorStr = errors.map((e: string) => `• ${e}`).join('\n');
                toast.warn(
                    `Hoàn tất nhập dữ liệu:\n  Tạo mới: ${created}\n  Cập nhật: ${updated}\n  Bỏ qua: ${skipped}\n\nLỗi:\n${errorStr}`,
                    { autoClose: 8000 }
                );
            } else {
                toast.success(`Import thành công! Đã tạo ${created}, tự động cập nhật ${updated}, bỏ qua ${skipped} dòng.`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu từ Excel');
        }
    });
};

// --- BRANDS ---
export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: getBrands,
        select: (res: ApiResponse<any>) => res.data || [],
    });
};

// --- PRODUCT ---
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useProductDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => getProductById(id!),
        enabled: !!id,
        select: (res: any) => res.data,
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateProduct(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useImportProducts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importProductsExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors: string[] = result?.errors ?? [];

            if (errors.length > 0) {
                // Có lỗi một số dòng
                toast.warn(
                    `Import có cảnh báo: tạo ${created}, cập nhật ${updated}, bỏ qua ${skipped}.\n` +
                    `Lỗi (${errors.length} dòng):\n` + errors.slice(0, 5).join('\n') +
                    (errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : ''),
                    { autoClose: 8000 }
                );
            } else {
                toast.success(`Import thành công! Tạo mới: ${created}, Cập nhật: ${updated}.`);
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Import thất bại. Vui lòng kiểm tra lại file.');
        },
    });
};

export const useExportProducts = () => {
    return useMutation({
        mutationFn: exportProductsExcel,
        onSuccess: (blob: Blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Xuất file Excel thành công!');
        },
        onError: () => {
            toast.error('Lỗi khi xuất file Excel.');
        },
    });
};

export const useDownloadProductsTemplate = () => {
    return useMutation({
        mutationFn: downloadProductsTemplate,
        onSuccess: (blob: Blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Tải template thành công!');
        },
        onError: () => {
            toast.error('Lỗi khi tải template.');
        },
    });
};

export const usePetTypes = () => {
    return useQuery({
        queryKey: ['pet-types'],
        queryFn: getPetTypes,
        select: (res: ApiResponse<string[]>) => res.data || [],
    });
};

export const useProductStatuses = () => {
    return useQuery({
        queryKey: ['product-statuses'],
        queryFn: getProductStatuses,
        select: (res: ApiResponse<string[]>) => res.data || [],
    });
};

export const useProductTypes = () => {
    return useQuery({
        queryKey: ['product-types'],
        queryFn: getProductTypes,
        select: (res: ApiResponse<string[]>) => res.data || [],
    });
};

export const useSalesUnits = () => {
    return useQuery({
        queryKey: ['sales-units'],
        queryFn: getSalesUnits,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};
