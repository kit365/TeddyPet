package fpt.teddypet.application.dto.response.feedback;

import java.util.List;
import java.util.UUID;

public record FeedbackTokenResponse(
        UUID token,
        String customerName,
        String customerEmail,
        List<FeedbackItemResponse> items) {
}
