package fpt.teddypet.application.dto.response;

import java.util.List;

public record EnumResponse(
        String enumName,
        List<String> values
) {
}

