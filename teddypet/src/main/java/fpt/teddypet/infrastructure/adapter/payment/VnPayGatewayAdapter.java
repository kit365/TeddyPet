package fpt.teddypet.infrastructure.adapter.payment;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.dto.request.payments.VnPayCallbackDTO;
import fpt.teddypet.application.dto.request.payments.VnPayPaymentParams;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;

import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.config.VnPayConfig;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class VnPayGatewayAdapter implements PaymentGatewayPort<VnPayCallbackDTO> {

    private final VnPayConfig vnPayConfig;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    public PaymentGatewayEnum getGateway() {
        return PaymentGatewayEnum.VNPAY;
    }

    @Override
    public String buildPaymentUrl(Order order, String ipAddress, String returnUrl) {
        try {
            OrderValidator.validateForPayment(order);

            String orderInfo = "Thanh toan don hang #" + order.getOrderCode() +
                    " - Tong tien: " + order.getFinalAmount() + " VND";

            long amount = order.getFinalAmount()
                    .multiply(BigDecimal.valueOf(PaymentConstants.Numeric.AMOUNT_MULTIPLIER))
                    .longValue();
            String transactionRef = generateTransactionRef();

            Map<String, String> params = buildVnPayParams(orderInfo, amount, transactionRef, ipAddress, returnUrl);

            return buildUrlWithHash(params);
        } catch (Exception e) {
            log.error(PaymentConstants.Messages.LOG_ERROR_BUILDING_URL, e);
            throw new PaymentException(
                    PaymentConstants.Messages.CANNOT_CREATE_PAYMENT_URL.replace("{}", e.getMessage()), e);
        }
    }

    @Override
    public GatewayCallbackResult handleCallback(VnPayCallbackDTO callback, HttpServletRequest request) {
        try {
            // 1. Verify signature
            if (!verifySignature(callback, request)) {
                log.error(PaymentConstants.Messages.LOG_INVALID_SIGNATURE, callback.getTransactionRef());
                throw new PaymentException.InvalidSignatureException(callback.getTransactionRef());
            }
            
            log.info(PaymentConstants.Messages.LOG_CALLBACK_RECEIVED,
                    getGateway(), callback.getTransactionRef(), callback.getTransactionStatus());
            
            // 2. Parse amount
            BigDecimal paidAmount = new BigDecimal(callback.vnp_Amount())
                    .movePointLeft(PaymentConstants.Numeric.AMOUNT_DECIMAL_SCALE);
            
            // 3. Determine success
            boolean success = PaymentConstants.VNPay.SUCCESS_CODE.equals(callback.getTransactionStatus());
            
            // 4. Build result
            return GatewayCallbackResult.builder()
                    .success(success)
                    .transactionId(callback.vnp_TransactionNo())
                    .message(success ? PaymentConstants.Messages.PAYMENT_SUCCESS 
                                    : PaymentConstants.Messages.PAYMENT_FAILED)
                    .amount(paidAmount)
                    .orderCode(null) // Would need to extract from vnp_TxnRef if needed
                    .gatewayResponseCode(callback.getTransactionStatus())
                    .build();
                    
        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error handling VNPay callback", e);
            throw new PaymentException("VNPay callback handling failed", e);
        }
    }
    
    private boolean verifySignature(VnPayCallbackDTO callback, HttpServletRequest request) {
        try {
            String receivedHash = callback.getSecureHash();
            String rawQueryString = request.getQueryString();
            
            if (rawQueryString == null) {
                log.error(PaymentConstants.Messages.LOG_QUERY_STRING_ERROR);
                return false;
            }
            
            Map<String, String> paramsMap = parseQueryStringExcludingHash(rawQueryString);
            String hashData = buildSortedHashData(paramsMap);
            String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData);
            
            boolean isValid = calculatedHash.equalsIgnoreCase(receivedHash);
            
            if (!isValid) {
                log.debug("Expected: {}, Got: {}", calculatedHash, receivedHash);
            }
            
            return isValid;
        } catch (Exception e) {
            log.error("Error verifying VNPay signature", e);
            return false;
        }
    }



    private Map<String, String> parseQueryStringExcludingHash(String rawQueryString) {
        String[] queryParams = rawQueryString.split("&");
        Map<String, String> paramsMap = new HashMap<>();
        
        for (String param : queryParams) {
            if (param == null || param.isEmpty()) {
                continue;
            }
            
            parseQueryParam(param, paramsMap);
        }
        
        return paramsMap;
    }

    private void parseQueryParam(String param, Map<String, String> paramsMap) {
        int equalIndex = param.indexOf("=");
        if (equalIndex <= 0) {
            return;
        }
        
        String key = param.substring(0, equalIndex);
        String value = equalIndex < param.length() - 1 ? param.substring(equalIndex + 1) : "";
        
        if (shouldIncludeInHash(key)) {
            paramsMap.put(key, value);
        }
    }

    private boolean shouldIncludeInHash(String key) {
        return !key.equals(PaymentConstants.VNPay.PARAM_SECURE_HASH) 
                && !key.equals(PaymentConstants.VNPay.PARAM_SECURE_HASH_TYPE);
    }

    private String buildSortedHashData(Map<String, String> paramsMap) {
        List<String> sortedKeys = new ArrayList<>(paramsMap.keySet());
        Collections.sort(sortedKeys);
        
        StringBuilder hashData = new StringBuilder();
        for (String key : sortedKeys) {
            String value = paramsMap.get(key);
            if (value != null) {
                if (!hashData.isEmpty()) {
                    hashData.append("&");
                }
                hashData.append(key).append("=").append(value);
            }
        }
        
        return hashData.toString();
    }

    private Map<String, String> buildVnPayParams(String orderInfo, long amount, String txnRef,
                                                 String ipAddress, String returnUrl) {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(PaymentConstants.VNPay.TIMEZONE));
        SimpleDateFormat formatter = new SimpleDateFormat(PaymentConstants.VNPay.DATE_FORMAT);
        String createDate = formatter.format(calendar.getTime());

        VnPayPaymentParams paymentParams = VnPayPaymentParams.builder()
                        .tmnCode(vnPayConfig.getTmnCode())
                        .amount(amount)
                        .txnRef(txnRef)
                        .orderInfo(orderInfo)
                        .returnUrl(returnUrl != null ? returnUrl : vnPayConfig.getReturnUrl())
                        .ipAddr(ipAddress)
                        .createDate(createDate)
                        .build();

        return paymentParams.toParamsMap();
    }

    private String buildUrlWithHash(Map<String, String> params) {
        List<String> sortedKeys = new ArrayList<>(params.keySet());
        Collections.sort(sortedKeys);

        StringBuilder queryData = new StringBuilder();
        StringBuilder hashData = new StringBuilder();

        for (String key : sortedKeys) {
            String value = params.get(key);
            if (value != null) {
                String encodedValue = URLEncoder.encode(value, StandardCharsets.US_ASCII);
                if (!hashData.isEmpty()) {
                    hashData.append(PaymentConstants.VNPay.URL_SEPARATOR);
                }
                hashData.append(key).append(PaymentConstants.VNPay.URL_EQUALS).append(encodedValue);

                if (!queryData.isEmpty()) {
                    queryData.append(PaymentConstants.VNPay.URL_SEPARATOR);
                }
                queryData.append(key).append(PaymentConstants.VNPay.URL_EQUALS).append(encodedValue);
            }
        }

        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        queryData.append(PaymentConstants.VNPay.URL_SECURE_HASH_PARAM).append(secureHash);

        return vnPayConfig.getPayUrl() + PaymentConstants.VNPay.URL_QUERY_START + queryData;
    }

    private String generateTransactionRef() {
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(PaymentConstants.VNPay.TRANSACTION_REF_LENGTH);
        for (int i = 0; i < PaymentConstants.VNPay.TRANSACTION_REF_LENGTH; i++) {
            sb.append(chars.charAt(SECURE_RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String hmacSHA512(String key, String data) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append("0");
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new PaymentException("Error creating HMAC-SHA512", e);
        }
    }
}
