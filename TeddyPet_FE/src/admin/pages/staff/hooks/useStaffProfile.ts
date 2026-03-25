import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStaffProfiles,
    getStaffProfileById,
    createStaffOnboarding,
    provisionAccount,
    updateStaffProfile,
    deactivateStaff,
    reactivateStaff,
    updateStaffRole,
    type IStaffOnboardingRequest,
    type IStaffProfileUpdateRequest,
    type IAccountProvisionRequest,
} from '../../../api/staffProfile.api';
import { resendGoogleInvitation } from '../../../api/google-whitelist.api';
import { ApiResponse } from '../../../config/type';

export const useStaffProfiles = () => {
    return useQuery({
        queryKey: ['staff-profiles'],
        queryFn: () => getStaffProfiles(),
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useStaffProfileById = (id?: string | number | null) => {
    const idNum =
        typeof id === 'string' ? (id.trim() === '' ? null : Number(id)) : (id ?? null);
    const enabled = idNum != null && !Number.isNaN(idNum);
    return useQuery({
        queryKey: ['staff-profile', idNum],
        queryFn: () => getStaffProfileById(idNum!),
        enabled,
    });
};

export const useCreateStaffOnboarding = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IStaffOnboardingRequest) => createStaffOnboarding(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-profiles'] }),
    });
};

export const useProvisionAccount = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ staffId, data }: { staffId: number; data: IAccountProvisionRequest }) =>
            provisionAccount(staffId, data),
        onSuccess: (_, { staffId }) => {
            qc.invalidateQueries({ queryKey: ['staff-profiles'] });
            qc.invalidateQueries({ queryKey: ['staff-profile', staffId] });
        },
    });
};

export const useUpdateStaffProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ staffId, data }: { staffId: number; data: IStaffProfileUpdateRequest }) =>
            updateStaffProfile(staffId, data),
        onSuccess: (_, { staffId }) => {
            qc.invalidateQueries({ queryKey: ['staff-profiles'] });
            qc.invalidateQueries({ queryKey: ['staff-profile', staffId] });
        },
    });
};

export const useDeactivateStaff = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deactivateStaff,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-profiles'] }),
    });
};

export const useReactivateStaff = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: reactivateStaff,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-profiles'] }),
    });
};

export const useResendGoogleInvitation = () => {
    return useMutation({
        mutationFn: (email: string) => resendGoogleInvitation(email),
    });
};

export const useUpdateStaffRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ staffId, roleName }: { staffId: number; roleName: string }) =>
            updateStaffRole(staffId, roleName),
        onSuccess: (_, { staffId }) => {
            qc.invalidateQueries({ queryKey: ['staff-profiles'] });
            qc.invalidateQueries({ queryKey: ['staff-profile', staffId] });
        },
    });
};
