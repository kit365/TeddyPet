package fpt.teddypet.presentation.controller.notification;

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
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(notificationService.getMyNotifications(limit));
    }

    @PutMapping("/mark-as-read")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }
}
