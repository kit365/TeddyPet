package fpt.teddypet.application.dto.response.staff;

/**
 * Định mức số lượng theo vai trò cho một ca.
 */
public record ShiftRoleConfigResponse(
        Long positionId,
        String positionName,
        int maxSlots
) {
}
