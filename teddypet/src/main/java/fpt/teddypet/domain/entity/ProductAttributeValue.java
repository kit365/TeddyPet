package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.valueobject.Measurement;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_attribute_values")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductAttributeValue extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "value_id")
    private Long valueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id", nullable = false)
    @ToString.Exclude //Ngăn lỗi StackOverflow khi logging
    private ProductAttribute attribute;

    // Chuỗi hiển thị cuối cùng (Snapshot) - Ví dụ: "10kg", "Đỏ", "Size S"
    // Dùng để search và hiển thị nhanh cho FE
    @Column(name = "value", nullable = false, length = 255)
    private String value;

    // Mã hiển thị cho Màu sắc (nếu có) ---
    @Column(name = "display_code", length = 50)
    private String displayCode; // Ví dụ: #FF0000

    //  (Số + Đơn vị) ---
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "amount", column = @Column(name = "amount", precision = 10, scale = 2)),
            @AttributeOverride(name = "unit", column = @Column(name = "unit", length = 20))
    })
    @Builder.Default
    private Measurement measurement = null;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;


    @ManyToMany(mappedBy = "attributeValues", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();


    public void updateMeasurement(Measurement newMeasurement) {
        this.measurement = newMeasurement;
        if (newMeasurement != null) {
            this.value = newMeasurement.toDisplayString();
        }
    }

    /**
     * Cập nhật giá trị ĐỊNH TÍNH (Màu sắc, Text, Size)
     * Tự động xóa measurement đi để tránh rác dữ liệu
     */
    public void updateValue(String newValue, String newDisplayCode) {
        this.value = newValue;
        this.displayCode = newDisplayCode;
        // Khi chuyển sang dạng text/color, phải xóa thông số định lượng đi
        this.measurement = null;
    }
}