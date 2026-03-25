package fpt.teddypet.application.dto.request.feedback;

import jakarta.validation.constraints.NotBlank;

public record FeedbackReplyRequest(
        @NotBlank(message = "Nội dung phản hồi không được để trống") String replyComment) {
}
