package fpt.teddypet.domain.entity.staff;

import fpt.teddypet.domain.entity.BaseEntity;
import fpt.teddypet.domain.enums.staff.PayrollStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "salary_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class SalaryLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private StaffProfile staff;

    @Column(name = "month", nullable = false)
    private int month;

    @Column(name = "year", nullable = false)
    private int year;

    /**
     * Tổng số phút làm việc trong tháng (từ WorkShift.checkIn/checkOut).
     */
    @Column(name = "total_minutes", nullable = false)
    private long totalMinutes;

    @Column(name = "total_deduction", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDeduction;

    @Column(name = "total_commission", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCommission;

    @Column(name = "base_salary_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalaryAmount;

    @Column(name = "final_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PayrollStatusEnum status;
}

