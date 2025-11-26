package fpt.teddypet.application.util;

import java.util.Arrays;
import java.util.List;

public final class EnumUtil {

    private EnumUtil() {
    }

    /**
     * Trả về danh sách tất cả giá trị của enum
     */
    public static <E extends Enum<E>> List<String> getAllEnumValues(Class<E> enumClass) {
        return Arrays.stream(enumClass.getEnumConstants())
                .map(Enum::name)
                .toList();
    }

    /**
     * Trả về danh sách tất cả giá trị của enum dưới dạng enum objects
     */
    public static <E extends Enum<E>> List<E> getAllEnums(Class<E> enumClass) {
        return Arrays.asList(enumClass.getEnumConstants());
    }
}

