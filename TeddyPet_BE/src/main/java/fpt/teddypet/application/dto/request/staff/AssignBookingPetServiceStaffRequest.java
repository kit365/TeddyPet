package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AssignBookingPetServiceStaffRequest(@NotEmpty List<Long> staffIds) {}
