package fpt.teddypet.application.dto.common;

import java.util.List;

public record EnumResponse(
        String enumName,
        List<String> values
) {
}

