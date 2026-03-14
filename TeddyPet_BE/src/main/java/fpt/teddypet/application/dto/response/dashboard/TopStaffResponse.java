package fpt.teddypet.application.dto.response.dashboard;

/**
 * Nhân viên tiêu biểu (cho dashboard).
 */
public record TopStaffResponse(
        Long staffId,
        String name,
        String avatarUrl,
        String positionName,
        long completedTasksCount
) {}
