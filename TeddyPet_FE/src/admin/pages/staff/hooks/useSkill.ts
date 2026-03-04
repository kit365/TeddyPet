import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill,
    type ISkillRequest,
} from '../../../api/skill.api';
import { ApiResponse } from '../../../config/type';

export const useSkills = () => {
    return useQuery({
        queryKey: ['skills'],
        queryFn: () => getSkills(),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useSkillById = (id?: string | number | null) => {
    return useQuery({
        queryKey: ['skill', id],
        queryFn: () => getSkillById(id!),
        enabled: !!id,
    });
};

export const useCreateSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ISkillRequest) => createSkill(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
    });
};

export const useUpdateSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ISkillRequest }) => updateSkill(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['skills'] });
            qc.invalidateQueries({ queryKey: ['skill'] });
        },
    });
};

export const useDeleteSkill = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteSkill,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
    });
};
