package fpt.teddypet.application.dto.response;
import java.util.UUID;

public record UserOrderInfoResponse(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String avatarUrl,
        String altImage
) {
}
