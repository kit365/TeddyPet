package fpt.teddypet.presentation.controller.dev;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository;

@Controller
@RequestMapping("/dev/email")
public class EmailPreviewController {

        private final AppSettingRepository appSettingRepository;

        public EmailPreviewController(
                        AppSettingRepository appSettingRepository) {
                this.appSettingRepository = appSettingRepository;
        }

        @GetMapping("/order-confirmation")
        public String previewOrderConfirmation(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("webUrl", "http://localhost:5173");
                model.addAttribute("orderCode", "ORD-TEST-12345");
                model.addAttribute("orderDate", "10/02/2026");
                model.addAttribute("paymentStatus", "Chờ thanh toán");
                model.addAttribute("fullName", "Khách Hàng Test");
                model.addAttribute("emailHeadline", "Xác nhận đơn hàng thành công!");
                model.addAttribute("subHeadline",
                                "Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị. Cảm ơn bạn đã tin dùng TeddyPet!");

                List<Map<String, Object>> items = new ArrayList<>();
                items.add(Map.of(
                                "productName", "Thức ăn hạt cho chó Poodle",
                                "variantName", "Túi 2kg",
                                "quantity", 2,
                                "unitPrice", new BigDecimal("250000"),
                                "imageUrl", "https://i.imgur.com/E88q7jV.jpeg"));
                items.add(Map.of(
                                "productName", "Đồ chơi xương gặm",
                                "variantName", "Màu Xanh",
                                "quantity", 1,
                                "unitPrice", new BigDecimal("85000"),
                                "imageUrl", "https://i.imgur.com/Tf2mHz2.jpeg"));

                model.addAttribute("items", items);
                model.addAttribute("itemCount", 3);
                model.addAttribute("subtotal", new BigDecimal("585000"));
                model.addAttribute("shippingFee", new BigDecimal("30000"));
                model.addAttribute("shippingMethod", "Giao hàng nhanh");
                model.addAttribute("discount", new BigDecimal("50000"));
                model.addAttribute("total", new BigDecimal("565000"));

                model.addAttribute("phoneNumber", "0987 654 321");
                model.addAttribute("address", "99/45, Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, Ho Chi Minh City, Vietnam");
                model.addAttribute("notes", "Giao hàng giờ hành chính giúp mình nhé!");
                model.addAttribute("paymentMethod", "Tiền mặt (COD)");
                model.addAttribute("trackOrderUrl", "http://localhost:5173/tracking?code=ORD-TEST-12345");
                model.addAttribute("hotline", "096 768 13 28");

                String facebookUrl = appSettingRepository.findBySettingKey("SOCIAL_FACEBOOK")
                                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                                .orElse(fpt.teddypet.application.constants.common.GeneralConstants.FACEBOOK_URL);

                String instagramUrl = appSettingRepository.findBySettingKey("SOCIAL_INSTAGRAM")
                                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                                .orElse(fpt.teddypet.application.constants.common.GeneralConstants.INSTAGRAM_URL);

                model.addAttribute("facebookUrl", facebookUrl);
                model.addAttribute("instagramUrl", instagramUrl);
                model.addAttribute("customerName", "Kiệt Ngô");
                model.addAttribute("customerEmail", "kietngo@example.com");
                model.addAttribute("shippingEmail", "kietrec@example.com");
                model.addAttribute("orderStatusText", "Đã xử lý");

                return "email/orders/confirmation";
        }

        @GetMapping("/forgot-password")
        public String previewForgotPassword(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("resetLink", "http://localhost:5173/reset-password?token=test-token");
                return "email/auth/forgot-password";
        }

        @GetMapping("/verify-account")
        public String previewVerifyAccount(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("verifyLink", "http://localhost:5173/verify?token=test-token");
                return "email/auth/verify-account";
        }

        @GetMapping("/security-otp")
        public String previewSecurityOtp(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("otp", "123456");
                return "email/auth/security-otp";
        }

        @GetMapping("/admin-invitation")
        public String previewAdminInvitation(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("invitationLink", "http://localhost:5173/accept-invitation?token=test-token");
                return "email/auth/admin-invitation";
        }

        @GetMapping("/guest-order-otp")
        public String previewGuestOrderOtp(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("otp", "654321");
                return "email/otp/guest-order";
        }

        @GetMapping("/booking-pending-deposit")
        public String previewBookingPendingDeposit(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("bookingCode", "BK-TEST-123");
                model.addAttribute("paymentUrl", "http://localhost:5173/payment/BK-TEST-123");
                return "email/bookings/pending-deposit";
        }

        @GetMapping("/booking-deposit-success")
        public String previewBookingDepositSuccess(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("bookingCode", "BK-TEST-123");
                model.addAttribute("detailUrl", "http://localhost:5173/bookings/BK-TEST-123");
                return "email/bookings/deposit-success";
        }

        @GetMapping("/booking-cancelled")
        public String previewBookingCancelled(Model model) {
                model.addAttribute("appName", "TeddyPet");
                model.addAttribute("bookingCode", "BK-TEST-123");
                model.addAttribute("detailUrl", "http://localhost:5173/bookings/BK-TEST-123");
                return "email/bookings/booking-cancelled";
        }
}
