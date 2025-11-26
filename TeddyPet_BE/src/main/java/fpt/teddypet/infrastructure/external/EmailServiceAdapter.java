//package fpt.teddypet.infrastructure.external;
//
//import fpt.teddypet.application.port.output.EmailServicePort;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.mail.SimpleMailMessage;
//import org.springframework.mail.javamail.JavaMailSender;
//import org.springframework.mail.javamail.MimeMessageHelper;
//import org.springframework.stereotype.Component;
//
//import jakarta.mail.internet.MimeMessage;
//
///**
// * Email service implementation using Spring Mail
// * Implements EmailServicePort to send emails via SMTP
// */
//@Component
//public class EmailServiceAdapter implements EmailServicePort {
//
//    private static final Logger logger = LoggerFactory.getLogger(EmailServiceAdapter.class);
//
//    private final JavaMailSender mailSender;
//
//    public EmailServiceAdapter(JavaMailSender mailSender) {
//        this.mailSender = mailSender;
//    }
//
//    @Override
//    public void sendEmail(String to, String subject, String body) {
//        try {
//            SimpleMailMessage message = new SimpleMailMessage();
//            message.setTo(to);
//            message.setSubject(subject);
//            message.setText(body);
//            mailSender.send(message);
//            logger.info("Email sent successfully to: {}", to);
//        } catch (Exception e) {
//            logger.error("Failed to send email to: {}", to, e);
//            throw new RuntimeException("Failed to send email", e);
//        }
//    }
//
//    @Override
//    public void sendHtmlEmail(String to, String subject, String htmlBody) {
//        try {
//            MimeMessage message = mailSender.createMimeMessage();
//            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
//            helper.setTo(to);
//            helper.setSubject(subject);
//            helper.setText(htmlBody, true);
//            mailSender.send(message);
//            logger.info("HTML email sent successfully to: {}", to);
//        } catch (Exception e) {
//            logger.error("Failed to send HTML email to: {}", to, e);
//            throw new RuntimeException("Failed to send HTML email", e);
//        }
//    }
//
//    @Override
//    public void sendBookingConfirmation(String to, Object bookingDetails) {
//        // TODO: Create booking confirmation email template
//        String subject = "Booking Confirmation";
//        String body = "Your booking has been confirmed. Details: " + bookingDetails.toString();
//        sendEmail(to, subject, body);
//    }
//
//    @Override
//    public void sendOrderConfirmation(String to, Object orderDetails) {
//        // TODO: Create order confirmation email template
//        String subject = "Order Confirmation";
//        String body = "Your order has been confirmed. Details: " + orderDetails.toString();
//        sendEmail(to, subject, body);
//    }
//}
//
