package fpt.teddypet.domain.enums;

import lombok.Getter;

@Getter
public enum AttributeDisplayType {
    TEXT("Ô nhập văn bản"),
    SELECT("Dropdown một lựa chọn"),
    CHECKBOX("Checkbox nhiều lựa chọn"),
    RADIO("Radio một lựa chọn"),
    MULTI_SELECT("Dropdown nhiều lựa chọn"),
    COLOR("Chọn màu sắc");

    private final String label;

    AttributeDisplayType(String label) {
        this.label = label;
    }

}
