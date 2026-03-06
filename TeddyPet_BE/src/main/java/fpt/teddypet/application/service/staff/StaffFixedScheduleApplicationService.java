package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.StaffFixedScheduleRequest;
import fpt.teddypet.application.dto.response.staff.StaffFixedScheduleResponse;
import fpt.teddypet.application.port.input.staff.StaffFixedScheduleService;
import fpt.teddypet.application.port.output.staff.StaffFixedScheduleRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffPositionRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffFixedSchedule;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffFixedScheduleApplicationService implements StaffFixedScheduleService {

    private final StaffFixedScheduleRepositoryPort scheduleRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final StaffPositionRepositoryPort staffPositionRepositoryPort;

    @Override
    @Transactional
    public StaffFixedScheduleResponse create(StaffFixedScheduleRequest request) {
        StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên id: " + request.staffId()));
        StaffPosition position = staffPositionRepositoryPort.findById(request.positionId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chức vụ id: " + request.positionId()));

        if (scheduleRepositoryPort.existsByStaffIdAndPositionIdAndDayOfWeekAndIsAfternoon(
                request.staffId(), request.positionId(), request.dayOfWeek(), request.isAfternoon())) {
            throw new IllegalArgumentException("Dữ liệu đã tồn tại.");
        }

        StaffFixedSchedule schedule = StaffFixedSchedule.builder()
                .staff(staff)
                .position(position)
                .dayOfWeek(request.dayOfWeek())
                .isAfternoon(request.isAfternoon())
                .build();
        StaffFixedSchedule saved = scheduleRepositoryPort.save(schedule);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long scheduleId) {
        if (!scheduleRepositoryPort.existsById(scheduleId)) {
            throw new EntityNotFoundException("Không tìm thấy lịch cố định id: " + scheduleId);
        }
        scheduleRepositoryPort.deleteById(scheduleId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffFixedScheduleResponse> getByStaffId(Long staffId) {
        return scheduleRepositoryPort.findByStaffId(staffId).stream()
                .map(this::toResponse)
                .toList();
    }

    private StaffFixedScheduleResponse toResponse(StaffFixedSchedule s) {
        return new StaffFixedScheduleResponse(
                s.getId(),
                s.getStaff().getId(),
                s.getStaff().getFullName(),
                s.getPosition().getId(),
                s.getPosition().getName(),
                s.getDayOfWeek(),
                s.getIsAfternoon()
        );
    }
}
