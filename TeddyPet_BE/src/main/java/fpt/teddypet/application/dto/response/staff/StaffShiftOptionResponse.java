package fpt.teddypet.application.dto.response.staff;

import java.util.List;

public record StaffShiftOptionResponse(
        Long staffId,
        String fullName,
        String positionName,
        List<String> positionNames
) {}
