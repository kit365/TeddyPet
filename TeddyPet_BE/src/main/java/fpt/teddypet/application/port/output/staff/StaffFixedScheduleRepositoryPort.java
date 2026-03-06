package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.StaffFixedSchedule;

import java.util.List;

public interface StaffFixedScheduleRepositoryPort {

    List<StaffFixedSchedule> findByPositionIdAndDayOfWeekAndIsAfternoon(Long positionId, int dayOfWeek, boolean isAfternoon);

    List<StaffFixedSchedule> findByStaffId(Long staffId);

    StaffFixedSchedule save(StaffFixedSchedule schedule);

    boolean existsByStaffIdAndPositionIdAndDayOfWeekAndIsAfternoon(Long staffId, Long positionId, int dayOfWeek, boolean isAfternoon);

    void deleteById(Long scheduleId);

    boolean existsById(Long scheduleId);
}
