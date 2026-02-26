package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.PayrollRunRequest;
import fpt.teddypet.application.dto.response.staff.SalaryLogResponse;
import fpt.teddypet.application.port.input.staff.PayrollService;
import fpt.teddypet.application.port.output.staff.ContractRepositoryPort;
import fpt.teddypet.application.port.output.staff.SalaryLogRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.TaskHistoryRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRepositoryPort;
import fpt.teddypet.domain.entity.staff.Contract;
import fpt.teddypet.domain.entity.staff.SalaryLog;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.TaskHistory;
import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.enums.staff.PayrollStatusEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollApplicationService implements PayrollService {

    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final ContractRepositoryPort contractRepositoryPort;
    private final WorkShiftRepositoryPort workShiftRepositoryPort;
    private final TaskHistoryRepositoryPort taskHistoryRepositoryPort;
    private final SalaryLogRepositoryPort salaryLogRepositoryPort;

    @Override
    @Transactional
    public List<SalaryLogResponse> runPayroll(PayrollRunRequest request) {
        int month = request.month();
        int year = request.year();
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(YearMonth.of(year, month).lengthOfMonth());

        Stream<StaffProfile> staffStream;
        if (request.staffId() != null) {
            StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));
            staffStream = Stream.of(staff);
        } else {
            staffStream = staffProfileRepositoryPort.findAllActive().stream();
        }

        return staffStream
                .map(staff -> calculateForStaff(staff, from, to))
                .map(salaryLogRepositoryPort::save)
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<SalaryLogResponse> getByMonthYear(Integer month, Integer year, Long staffId) {
        if (month == null || year == null) {
            throw new IllegalArgumentException("month và year là bắt buộc");
        }
        List<SalaryLog> logs = salaryLogRepositoryPort.findByMonthAndYear(month, year);
        if (staffId != null) {
            logs = logs.stream()
                    .filter(log -> log.getStaff().getId().equals(staffId))
                    .toList();
        }
        return logs.stream().map(this::toResponse).toList();
    }

    private SalaryLog calculateForStaff(StaffProfile staff, LocalDate from, LocalDate to) {
        YearMonth ym = YearMonth.of(from.getYear(), from.getMonth());
        int month = ym.getMonthValue();
        int year = ym.getYear();

        // Lương cơ bản (base salary) tính pro-rata từ Contract
        BigDecimal baseSalaryAmount = calculateBaseSalary(staff.getId(), from, to);

        // Tổng số phút làm việc từ WorkShift
        long totalMinutes = calculateTotalMinutes(staff.getId(), from, to);

        // Tổng hoa hồng từ TaskHistory
        BigDecimal totalCommission = calculateTotalCommission(staff.getId(), from, to);

        BigDecimal totalDeduction = BigDecimal.ZERO;
        BigDecimal finalSalary = baseSalaryAmount
                .add(totalCommission)
                .subtract(totalDeduction)
                .max(BigDecimal.ZERO);

        SalaryLog salaryLog = salaryLogRepositoryPort
                .findByStaffIdAndMonthAndYear(staff.getId(), month, year)
                .orElseGet(() -> SalaryLog.builder()
                        .staff(staff)
                        .month(month)
                        .year(year)
                        .build());

        salaryLog.setBaseSalaryAmount(baseSalaryAmount);
        salaryLog.setTotalMinutes(totalMinutes);
        salaryLog.setTotalCommission(totalCommission);
        salaryLog.setTotalDeduction(totalDeduction);
        salaryLog.setFinalSalary(finalSalary);
        salaryLog.setStatus(PayrollStatusEnum.DRAFT);

        return salaryLog;
    }

    private BigDecimal calculateBaseSalary(Long staffId, LocalDate from, LocalDate to) {
        List<Contract> contracts = contractRepositoryPort.findActiveContractsForStaffInRange(staffId, from, to);
        if (contracts.isEmpty()) {
            return BigDecimal.ZERO;
        }

        YearMonth ym = YearMonth.of(from.getYear(), from.getMonth());
        int daysInMonth = ym.lengthOfMonth();

        BigDecimal total = BigDecimal.ZERO;
        for (Contract contract : contracts) {
            LocalDate effectiveFrom = contract.getStartDate().isAfter(from) ? contract.getStartDate() : from;
            LocalDate effectiveTo;
            if (contract.getEndDate() != null && contract.getEndDate().isBefore(to)) {
                effectiveTo = contract.getEndDate();
            } else {
                effectiveTo = to;
            }

            long daysInSegment = Duration.between(
                    effectiveFrom.atStartOfDay(),
                    effectiveTo.plusDays(1).atStartOfDay()
            ).toDays();

            if (daysInSegment <= 0) {
                continue;
            }

            BigDecimal ratio = BigDecimal.valueOf(daysInSegment)
                    .divide(BigDecimal.valueOf(daysInMonth), 4, RoundingMode.HALF_UP);

            BigDecimal segmentSalary = contract.getBaseSalary()
                    .multiply(ratio)
                    .setScale(2, RoundingMode.HALF_UP);

            total = total.add(segmentSalary);
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private long calculateTotalMinutes(Long staffId, LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return workShiftRepositoryPort.findByStaffIdAndStartTimeBetween(staffId, fromDateTime, toDateTime)
                .stream()
                .filter(shift -> shift.getStaff() != null)
                .mapToLong(shift -> {
                    // Ưu tiên checkIn/checkOut thực tế; nếu không có thì dùng startTime/endTime
                    if (shift.getCheckInTime() != null && shift.getCheckOutTime() != null) {
                        return Duration.between(shift.getCheckInTime(), shift.getCheckOutTime()).toMinutes();
                    }
                    return Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
                })
                .sum();
    }

    private BigDecimal calculateTotalCommission(Long staffId, LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        return taskHistoryRepositoryPort.findByStaffIdAndFinishedAtBetween(staffId, fromDateTime, toDateTime)
                .stream()
                .map(TaskHistory::getEarnedCommission)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private SalaryLogResponse toResponse(SalaryLog log) {
        return new SalaryLogResponse(
                log.getId(),
                log.getStaff().getId(),
                log.getStaff().getFullName(),
                log.getMonth(),
                log.getYear(),
                log.getTotalMinutes(),
                log.getBaseSalaryAmount(),
                log.getTotalCommission(),
                log.getTotalDeduction(),
                log.getFinalSalary(),
                log.getStatus()
        );
    }
}

