package fpt.teddypet.presentation.controller.notification;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import fpt.teddypet.application.port.input.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(limit);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PutMapping("/mark-as-read")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/mark-as-read/{id}")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }
}
