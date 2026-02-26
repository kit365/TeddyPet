import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getContractsByStaffId,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
    type IContractRequest,
} from '../../../api/contract.api';
import { ApiResponse } from '../../../config/type';

export const useContractsByStaffId = (staffId?: number | null) => {
    return useQuery({
        queryKey: ['contracts', staffId],
        queryFn: () => getContractsByStaffId(staffId!),
        enabled: !!staffId,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useContractById = (contractId?: number | null) => {
    return useQuery({
        queryKey: ['contract', contractId],
        queryFn: () => getContractById(contractId!),
        enabled: !!contractId,
    });
};

export const useCreateContract = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IContractRequest) => createContract(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['contracts', variables.staffId] });
        },
    });
};

export const useUpdateContract = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ contractId, data }: { contractId: number; data: IContractRequest }) =>
            updateContract(contractId, data),
        onSuccess: (_, { data }) => {
            qc.invalidateQueries({ queryKey: ['contracts', data.staffId] });
            qc.invalidateQueries({ queryKey: ['contract'] });
        },
    });
};

export const useDeleteContract = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteContract,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    });
};
