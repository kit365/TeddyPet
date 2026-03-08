package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.StaffFixedScheduleRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffFixedSchedule;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffFixedScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StaffFixedScheduleRepositoryAdapter implements StaffFixedScheduleRepositoryPort {

    private final StaffFixedScheduleRepository staffFixedScheduleRepository;

    @Override
    public List<StaffFixedSchedule> findByPositionIdAndDayOfWeekAndIsAfternoon(Long positionId, int dayOfWeek, boolean isAfternoon) {
        return staffFixedScheduleRepository.findByPosition_IdAndDayOfWeekAndIsAfternoon(positionId, dayOfWeek, isAfternoon);
    }

    @Override
    public List<StaffFixedSchedule> findByStaffId(Long staffId) {
        return staffFixedScheduleRepository.findByStaff_Id(staffId);
    }

    @Override
    public StaffFixedSchedule save(StaffFixedSchedule schedule) {
        return staffFixedScheduleRepository.save(schedule);
    }

    @Override
    public boolean existsByStaffIdAndPositionIdAndDayOfWeekAndIsAfternoon(Long staffId, Long positionId, int dayOfWeek, boolean isAfternoon) {
        return staffFixedScheduleRepository.existsByStaff_IdAndPosition_IdAndDayOfWeekAndIsAfternoon(staffId, positionId, dayOfWeek, isAfternoon);
    }

    @Override
    public void deleteById(Long scheduleId) {
        staffFixedScheduleRepository.deleteById(scheduleId);
    }

    @Override
    public boolean existsById(Long scheduleId) {
        return staffFixedScheduleRepository.existsById(scheduleId);
    }
}
