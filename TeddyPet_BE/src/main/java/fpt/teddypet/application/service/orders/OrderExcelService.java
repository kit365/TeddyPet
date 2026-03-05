package fpt.teddypet.application.service.orders;

import fpt.teddypet.application.service.products.ExcelStyleHelper;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service xuất file Excel cho Orders.
 * File export có thể dùng làm backup - chứa đầy đủ dữ liệu đơn hàng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderExcelService {

    private final OrderRepository orderRepository;
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @Transactional(readOnly = true)
    public void exportOrdersToExcel(HttpServletResponse response) throws IOException {
        List<Order> orders = orderRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Đơn hàng");

            // Header style
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);
            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));

            // Create headers
            String[] headers = {
                    "Mã đơn hàng", "Loại đơn", "Trạng thái",
                    "Khách hàng", "Email", "SĐT giao hàng", "Tên người nhận",
                    "Địa chỉ giao hàng", "Mã giảm giá", "Ghi chú",
                    // Items
                    "Tên sản phẩm", "Tên biến thể", "Số lượng", "Đơn giá", "Thành tiền",
                    // Totals (only on first row of each order)
                    "Tạm tính", "Phí vận chuyển", "Giảm giá", "Tổng thanh toán",
                    // Dates
                    "Ngày tạo", "Ngày giao", "Ngày hoàn thành",
                    // Return/Cancel
                    "Lý do hủy", "Ngày hủy", "Người hủy",
                    "Lý do trả hàng", "Ngày yêu cầu trả", "Ghi chú admin trả hàng",
                    // Payment
                    "Phương thức thanh toán", "Trạng thái thanh toán"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Order order : orders) {
                List<OrderItem> items = order.getOrderItems();
                List<Payment> payments = order.getPayments();

                if (items == null || items.isEmpty()) {
                    Row row = sheet.createRow(rowIdx++);
                    fillOrderRow(row, order, null, true, currencyStyle);
                    fillPaymentInfo(row, payments);
                } else {
                    boolean isFirstItem = true;
                    for (OrderItem item : items) {
                        Row row = sheet.createRow(rowIdx++);
                        fillOrderRow(row, order, item, isFirstItem, currencyStyle);
                        if (isFirstItem) {
                            fillPaymentInfo(row, payments);
                            isFirstItem = false;
                        }
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 3000) {
                    sheet.setColumnWidth(i, 3000);
                }
            }

            // Write to response
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                    "attachment; filename=orders_export_" + java.time.LocalDate.now() + ".xlsx");
            workbook.write(response.getOutputStream());
        }
    }

    private void fillOrderRow(Row row, Order order, OrderItem item,
            boolean isFirstRow, CellStyle currencyStyle) {
        int col = 0;

        // Order info (only on first row)
        if (isFirstRow) {
            row.createCell(col++).setCellValue(safeStr(order.getOrderCode()));
            row.createCell(col++).setCellValue(order.getOrderType() != null ? order.getOrderType().name() : "");
            row.createCell(col++).setCellValue(order.getStatus() != null ? order.getStatus().name() : "");
            // Customer info
            String customerName = "";
            String customerEmail = "";
            if (order.getUser() != null) {
                String fn = order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "";
                String ln = order.getUser().getLastName() != null ? order.getUser().getLastName() : "";
                customerName = (fn + " " + ln).trim();
                customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "";
            }
            if (order.getGuestEmail() != null && !order.getGuestEmail().isEmpty()) {
                customerEmail = order.getGuestEmail();
                if (customerName.isEmpty())
                    customerName = "Khách vãng lai";
            }
            row.createCell(col++).setCellValue(customerName);
            row.createCell(col++).setCellValue(customerEmail);
            row.createCell(col++).setCellValue(safeStr(order.getShippingPhone()));
            row.createCell(col++).setCellValue(safeStr(order.getShippingName()));
            row.createCell(col++).setCellValue(safeStr(order.getShippingAddress()));
            row.createCell(col++).setCellValue(safeStr(order.getVoucherCode()));
            row.createCell(col++).setCellValue(safeStr(order.getNotes()));
        } else {
            col = 10; // Skip to item columns
        }

        // Item info from snapshot fields
        if (item != null) {
            row.createCell(col++).setCellValue(safeStr(item.getProductName()));
            row.createCell(col++).setCellValue(safeStr(item.getVariantName()));
            row.createCell(col++).setCellValue(item.getQuantity() != null ? item.getQuantity() : 0);
            setCurrencyCell(row, col++, item.getUnitPrice(), currencyStyle);
            setCurrencyCell(row, col++, item.getTotalPrice(), currencyStyle);
        } else {
            col += 5;
        }

        // Totals (only on first row)
        if (isFirstRow) {
            setCurrencyCell(row, col++, order.getSubtotal(), currencyStyle);
            setCurrencyCell(row, col++, order.getShippingFee(), currencyStyle);
            setCurrencyCell(row, col++, order.getDiscountAmount(), currencyStyle);
            setCurrencyCell(row, col++, order.getFinalAmount(), currencyStyle);

            // Dates
            row.createCell(col++).setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(DT_FMT) : "");
            row.createCell(col++)
                    .setCellValue(order.getDeliveredAt() != null ? order.getDeliveredAt().format(DT_FMT) : "");
            row.createCell(col++)
                    .setCellValue(order.getCompletedAt() != null ? order.getCompletedAt().format(DT_FMT) : "");

            // Cancel info
            row.createCell(col++).setCellValue(safeStr(order.getCancelReason()));
            row.createCell(col++)
                    .setCellValue(order.getCancelledAt() != null ? order.getCancelledAt().format(DT_FMT) : "");
            row.createCell(col++).setCellValue(safeStr(order.getCancelledBy()));

            // Return info
            row.createCell(col++).setCellValue(safeStr(order.getReturnReason()));
            row.createCell(col++).setCellValue(
                    order.getReturnRequestedAt() != null ? order.getReturnRequestedAt().format(DT_FMT) : "");
            row.createCell(col).setCellValue(safeStr(order.getAdminReturnNote()));
        }
    }

    private void fillPaymentInfo(Row row, List<Payment> payments) {
        if (payments == null || payments.isEmpty())
            return;
        Payment payment = payments.get(0);
        int col = 28;
        row.createCell(col++).setCellValue(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "");
        row.createCell(col).setCellValue(payment.getStatus() != null ? payment.getStatus().name() : "");
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

    private String safeStr(String val) {
        return val != null ? val : "";
    }
}
