package fpt.teddypet.application.dto.response.staff;

import java.util.List;

public record WorkShiftAssignOptionsResponse(
        int requiredStaffCount,
        Long shiftId,
        boolean shortage,
        List<StaffShiftOptionResponse> participatingStaff
) {}
