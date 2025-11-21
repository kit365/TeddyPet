package fpt.teddypet.application.util;
import fpt.teddypet.application.dto.response.UnitResponse;
import fpt.teddypet.domain.enums.UnitEnum;

import java.util.Arrays;
import java.util.List;

public class UnitEnumUtil {


    private UnitEnumUtil() {
        throw new UnsupportedOperationException("Utility class");
    }


    public static UnitResponse mapToResponse(UnitEnum unit) {
        return new UnitResponse(unit.name(), unit.getLabel(), unit.getSymbol(), unit.getCategory());
    }

    public static List<UnitResponse> getUnitsByCategory(UnitEnum.UnitCategory category) {
        return Arrays.stream(UnitEnum.values())
                .filter(u -> category == null || u.getCategory() == category)
                .map(UnitEnumUtil::mapToResponse)
                .toList();
    }
}
