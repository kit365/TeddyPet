import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStaffSkillsByStaffId,
    createStaffSkill,
    updateStaffSkill,
    deleteStaffSkill,
    type IStaffSkillRequest,
} from '../../../api/staffSkill.api';
import { ApiResponse } from '../../../config/type';

export const useStaffSkillsByStaffId = (staffId?: number | null) => {
    return useQuery({
        queryKey: ['staff-skills', staffId],
        queryFn: () => getStaffSkillsByStaffId(staffId!),
        enabled: !!staffId,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useCreateStaffSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IStaffSkillRequest) => createStaffSkill(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['staff-skills', variables.staffId] });
        },
    });
};

export const useUpdateStaffSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IStaffSkillRequest }) => updateStaffSkill(id, data),
        onSuccess: (_, { data }) => {
            qc.invalidateQueries({ queryKey: ['staff-skills', data.staffId] });
        },
    });
};

export const useDeleteStaffSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteStaffSkill,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-skills'] }),
    });
};
