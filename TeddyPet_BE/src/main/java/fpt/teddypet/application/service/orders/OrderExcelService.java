package fpt.teddypet.application.service.orders;

import fpt.teddypet.application.service.products.ExcelStyleHelper;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service Excel cho Đơn hàng.
 * Hỗ trợ Export và Import.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderExcelService {

    private final OrderRepository orderRepository;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    public record ImportResult(int created, int updated, int skipped, List<String> errors) {
    }

    @Transactional(readOnly = true)
    public void exportOrdersToExcel(HttpServletResponse response) throws IOException {
        List<Order> orders = orderRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Đơn hàng");
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);
            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));

            Row headerRow = sheet.createRow(0);
            for (OrderExcelColumn col : OrderExcelColumn.values()) {
                Cell cell = headerRow.createCell(col.getIndex());
                cell.setCellValue(col.getHeader());
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Order order : orders) {
                List<OrderItem> items = order.getOrderItems();
                if (items == null || items.isEmpty()) {
                    Row row = sheet.createRow(rowIdx++);
                    fillOrderRow(row, order, null, true, currencyStyle);
                } else {
                    boolean isFirstItem = true;
                    for (OrderItem item : items) {
                        Row row = sheet.createRow(rowIdx++);
                        fillOrderRow(row, order, item, isFirstItem, currencyStyle);
                        isFirstItem = false;
                    }
                }
            }

            for (OrderExcelColumn col : OrderExcelColumn.values()) {
                sheet.autoSizeColumn(col.getIndex());
            }

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                    "attachment; filename=orders_export_" + java.time.LocalDate.now() + ".xlsx");
            workbook.write(response.getOutputStream());
        }
    }

    private void fillOrderRow(Row row, Order order, OrderItem item, boolean isFirstRow, CellStyle currencyStyle) {
        if (isFirstRow) {
            row.createCell(OrderExcelColumn.ORDER_CODE.getIndex()).setCellValue(safeStr(order.getOrderCode()));
            row.createCell(OrderExcelColumn.ORDER_TYPE.getIndex())
                    .setCellValue(order.getOrderType() != null ? order.getOrderType().name() : "");
            row.createCell(OrderExcelColumn.STATUS.getIndex())
                    .setCellValue(order.getStatus() != null ? order.getStatus().name() : "");

            String customerName = order.getShippingName();
            String customerEmail = order.getGuestEmail();
            if (order.getUser() != null) {
                customerName = order.getUser().getFirstName() + " " + order.getUser().getLastName();
                customerEmail = order.getUser().getEmail();
            }
            row.createCell(OrderExcelColumn.CUSTOMER_NAME.getIndex()).setCellValue(safeStr(customerName));
            row.createCell(OrderExcelColumn.CUSTOMER_EMAIL.getIndex()).setCellValue(safeStr(customerEmail));
            row.createCell(OrderExcelColumn.SHIPPING_PHONE.getIndex()).setCellValue(safeStr(order.getShippingPhone()));
            row.createCell(OrderExcelColumn.SHIPPING_NAME.getIndex()).setCellValue(safeStr(order.getShippingName()));
            row.createCell(OrderExcelColumn.SHIPPING_ADDRESS.getIndex())
                    .setCellValue(safeStr(order.getShippingAddress()));
            row.createCell(OrderExcelColumn.VOUCHER_CODE.getIndex()).setCellValue(safeStr(order.getVoucherCode()));
            row.createCell(OrderExcelColumn.NOTES.getIndex()).setCellValue(safeStr(order.getNotes()));

            setCurrencyCell(row, OrderExcelColumn.SHIPPING_FEE.getIndex(), order.getShippingFee(), currencyStyle);
            setCurrencyCell(row, OrderExcelColumn.DISCOUNT_AMOUNT.getIndex(), order.getDiscountAmount(), currencyStyle);

            if (order.getPayments() != null && !order.getPayments().isEmpty()) {
                Payment p = order.getPayments().get(0);
                row.createCell(OrderExcelColumn.PAYMENT_METHOD.getIndex())
                        .setCellValue(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "");
                row.createCell(OrderExcelColumn.PAYMENT_STATUS.getIndex())
                        .setCellValue(p.getStatus() != null ? p.getStatus().name() : "");
            }

            row.createCell(OrderExcelColumn.CREATED_AT.getIndex())
                    .setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(DT_FMT) : "");
        }

        if (item != null) {
            row.createCell(OrderExcelColumn.PRODUCT_NAME.getIndex()).setCellValue(safeStr(item.getProductName()));
            row.createCell(OrderExcelColumn.VARIANT_NAME.getIndex()).setCellValue(safeStr(item.getVariantName()));
            row.createCell(OrderExcelColumn.QUANTITY.getIndex())
                    .setCellValue(item.getQuantity() != null ? item.getQuantity() : 0);
            setCurrencyCell(row, OrderExcelColumn.UNIT_PRICE.getIndex(), item.getUnitPrice(), currencyStyle);
        }
    }

    @Transactional
    public ImportResult importOrdersFromExcel(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        Map<String, List<Row>> orderGroups = new LinkedHashMap<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String code = getCellStr(row.getCell(OrderExcelColumn.ORDER_CODE.getIndex()));
                if (!StringUtils.hasText(code))
                    continue;
                orderGroups.computeIfAbsent(code, k -> new ArrayList<>()).add(row);
            }

            for (Map.Entry<String, List<Row>> entry : orderGroups.entrySet()) {
                String code = entry.getKey();
                List<Row> rows = entry.getValue();
                try {
                    if (orderRepository.existsByOrderCode(code)) {
                        skipped++;
                        continue;
                    }

                    Row firstRow = rows.get(0);
                    Order order = Order.builder()
                            .orderCode(code)
                            .orderType(parseEnum(OrderTypeEnum.class,
                                    getCellStr(firstRow.getCell(OrderExcelColumn.ORDER_TYPE.getIndex())),
                                    OrderTypeEnum.OFFLINE))
                            .status(parseEnum(OrderStatusEnum.class,
                                    getCellStr(firstRow.getCell(OrderExcelColumn.STATUS.getIndex())),
                                    OrderStatusEnum.COMPLETED))
                            .shippingPhone(getCellStr(firstRow.getCell(OrderExcelColumn.SHIPPING_PHONE.getIndex())))
                            .shippingName(getCellStr(firstRow.getCell(OrderExcelColumn.SHIPPING_NAME.getIndex())))
                            .shippingAddress(getCellStr(firstRow.getCell(OrderExcelColumn.SHIPPING_ADDRESS.getIndex())))
                            .voucherCode(getCellStr(firstRow.getCell(OrderExcelColumn.VOUCHER_CODE.getIndex())))
                            .notes(getCellStr(firstRow.getCell(OrderExcelColumn.NOTES.getIndex())))
                            .shippingFee(getCellDecimal(firstRow.getCell(OrderExcelColumn.SHIPPING_FEE.getIndex())))
                            .discountAmount(
                                    getCellDecimal(firstRow.getCell(OrderExcelColumn.DISCOUNT_AMOUNT.getIndex())))
                            .guestEmail(getCellStr(firstRow.getCell(OrderExcelColumn.CUSTOMER_EMAIL.getIndex())))
                            .orderItems(new ArrayList<>())
                            .payments(new ArrayList<>())
                            .build();

                    // Dates
                    String createdStr = getCellStr(firstRow.getCell(OrderExcelColumn.CREATED_AT.getIndex()));
                    if (StringUtils.hasText(createdStr)) {
                        try {
                            order.setCreatedAt(LocalDateTime.parse(createdStr, DT_FMT));
                        } catch (Exception e) {
                            order.setCreatedAt(LocalDateTime.now());
                        }
                    } else {
                        order.setCreatedAt(LocalDateTime.now());
                    }

                    BigDecimal subtotal = BigDecimal.ZERO;
                    for (Row r : rows) {
                        String sku = getCellStr(r.getCell(OrderExcelColumn.VARIANT_NAME.getIndex()));
                        String prodName = getCellStr(r.getCell(OrderExcelColumn.PRODUCT_NAME.getIndex()));
                        int qty = (int) getCellDouble(r.getCell(OrderExcelColumn.QUANTITY.getIndex()));
                        BigDecimal price = getCellDecimal(r.getCell(OrderExcelColumn.UNIT_PRICE.getIndex()));

                        OrderItem item = OrderItem.builder()
                                .order(order)
                                .productName(prodName)
                                .variantName(sku)
                                .quantity(qty)
                                .unitPrice(price)
                                .totalPrice(price.multiply(BigDecimal.valueOf(qty)))
                                .build();
                        order.getOrderItems().add(item);
                        subtotal = subtotal.add(item.getTotalPrice());
                    }
                    order.setSubtotal(subtotal);
                    order.setFinalAmount(subtotal.add(order.getShippingFee()).subtract(order.getDiscountAmount()));

                    // Payment
                    PaymentMethodEnum pm = parseEnum(PaymentMethodEnum.class,
                            getCellStr(firstRow.getCell(OrderExcelColumn.PAYMENT_METHOD.getIndex())),
                            PaymentMethodEnum.CASH);
                    PaymentStatusEnum ps = parseEnum(PaymentStatusEnum.class,
                            getCellStr(firstRow.getCell(OrderExcelColumn.PAYMENT_STATUS.getIndex())),
                            PaymentStatusEnum.COMPLETED);
                    Payment payment = Payment.builder()
                            .order(order)
                            .paymentMethod(pm)
                            .status(ps)
                            .amount(order.getFinalAmount())
                            .build();
                    order.getPayments().add(payment);

                    orderRepository.save(order);
                    created++;
                } catch (Exception e) {
                    errors.add("Đơn " + code + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi import order: " + e.getMessage(), e);
        }
        return new ImportResult(created, 0, skipped, errors);
    }

    public void downloadTemplate(HttpServletResponse response) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Template Nhập Đơn");
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);
            Row header = sheet.createRow(0);
            for (OrderExcelColumn col : OrderExcelColumn.values()) {
                Cell cell = header.createCell(col.getIndex());
                cell.setCellValue(col.getHeader());
                cell.setCellStyle(headerStyle);
            }
            Row row = sheet.createRow(1);
            row.createCell(OrderExcelColumn.ORDER_CODE.getIndex()).setCellValue("ORD-IMPORT-001");
            row.createCell(OrderExcelColumn.ORDER_TYPE.getIndex()).setCellValue("OFFLINE");
            row.createCell(OrderExcelColumn.STATUS.getIndex()).setCellValue("COMPLETED");
            row.createCell(OrderExcelColumn.CUSTOMER_NAME.getIndex()).setCellValue("Nguyễn Văn A");
            row.createCell(OrderExcelColumn.PRODUCT_NAME.getIndex()).setCellValue("Thức ăn Royal Canin");
            row.createCell(OrderExcelColumn.QUANTITY.getIndex()).setCellValue(2);
            row.createCell(OrderExcelColumn.UNIT_PRICE.getIndex()).setCellValue(150000);
            row.createCell(OrderExcelColumn.PAYMENT_METHOD.getIndex()).setCellValue("CASH");
            row.createCell(OrderExcelColumn.PAYMENT_STATUS.getIndex()).setCellValue("COMPLETED");

            for (OrderExcelColumn col : OrderExcelColumn.values())
                sheet.autoSizeColumn(col.getIndex());

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=orders_template.xlsx");
            workbook.write(response.getOutputStream());
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> clazz, String val, E defaultVal) {
        if (!StringUtils.hasText(val))
            return defaultVal;
        try {
            return Enum.valueOf(clazz, val.toUpperCase());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private String getCellStr(Cell cell) {
        if (cell == null)
            return "";
        try {
            if (cell.getCellType() == CellType.NUMERIC)
                return String.valueOf((long) cell.getNumericCellValue());
            return cell.getStringCellValue().trim();
        } catch (Exception e) {
            return "";
        }
    }

    private double getCellDouble(Cell cell) {
        if (cell == null)
            return 0;
        try {
            if (cell.getCellType() == CellType.NUMERIC)
                return cell.getNumericCellValue();
            return Double.parseDouble(cell.getStringCellValue());
        } catch (Exception e) {
            return 0;
        }
    }

    private BigDecimal getCellDecimal(Cell cell) {
        return BigDecimal.valueOf(getCellDouble(cell));
    }

    private String safeStr(String s) {
        return s != null ? s : "";
    }

    private void setCurrencyCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
            cell.setCellStyle(style);
        } else {
            cell.setCellValue(0);
        }
    }
}
