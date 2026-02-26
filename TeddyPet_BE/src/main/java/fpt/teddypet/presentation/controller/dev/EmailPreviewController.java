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
                model.addAttribute("address", "123 Đường ABC, Quận Cam, TP. Hồ Chí Minh");
                model.addAttribute("notes", "Giao hàng giờ hành chính giúp mình nhé!");
                model.addAttribute("paymentMethod", "Tiền mặt (COD)");
                model.addAttribute("trackOrderUrl", "http://localhost:5173/tracking?code=ORD-TEST-12345");
                model.addAttribute("hotline", "1900 1234");

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
}
