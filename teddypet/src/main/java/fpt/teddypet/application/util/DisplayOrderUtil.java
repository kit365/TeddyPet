package fpt.teddypet.application.util;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public final class DisplayOrderUtil {

    private DisplayOrderUtil() {
        // Utility class - prevent instantiation
    }

    /**
     * Tính displayOrder tiếp theo dựa trên danh sách entities hiện có
     * 
     * @param existingEntities Danh sách entities hiện có
     * @param displayOrderGetter Function để lấy displayOrder từ entity
     * @param <T> Type của entity
     * @return DisplayOrder tiếp theo (max + 1), hoặc 0 nếu danh sách rỗng
     */
    public static <T> int getNextDisplayOrder(List<T> existingEntities, Function<T, Integer> displayOrderGetter) {
        if (existingEntities == null || existingEntities.isEmpty()) {
            return 0;
        }
        
        int maxDisplayOrder = existingEntities.stream()
                .map(displayOrderGetter)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(-1);
        
        return maxDisplayOrder + 1;
    }

    /**
     * Tính displayOrder tiếp theo từ giá trị max hiện tại
     * 
     * @param maxDisplayOrder Giá trị displayOrder lớn nhất hiện tại
     * @return DisplayOrder tiếp theo (max + 1), hoặc 0 nếu max < 0
     */
    public static int getNextDisplayOrder(int maxDisplayOrder) {
        return maxDisplayOrder < 0 ? 0 : maxDisplayOrder + 1;
    }
}

