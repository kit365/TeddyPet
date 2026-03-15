package fpt.teddypet.presentation.controller.newsletter;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.newsletter.NewsletterSubscriptionRequest;
import fpt.teddypet.application.port.input.newsletter.NewsletterSubscriptionService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_NEWSLETTER)
@RequiredArgsConstructor
@Tag(name = "Newsletter", description = "APIs for newsletter subscriptions")
public class NewsletterSubscriptionController {

    private final NewsletterSubscriptionService newsletterSubscriptionService;

    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe to newsletter", description = "Subscribes an email to the newsletter.")
    public ResponseEntity<ApiResponse<Void>> subscribe(@Valid @RequestBody NewsletterSubscriptionRequest request) {
        newsletterSubscriptionService.subscribe(request.email());
        return ResponseEntity.ok(ApiResponse.success("Đăng ký nhận tin thành công!"));
    }

    @PostMapping("/unsubscribe")
    @Operation(summary = "Unsubscribe from newsletter", description = "Unsubscribes an email from the newsletter.")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(@Valid @RequestBody NewsletterSubscriptionRequest request) {
        newsletterSubscriptionService.unsubscribe(request.email());
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đăng ký nhận tin."));
    }
}
