package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Một mục định mức: vai trò (chức vụ) + số lượng tối đa cho ca.
 */
public record ShiftRoleConfigItemRequest(
        @NotNull Long positionId,
        @Min(1) int maxSlots
) {
}
