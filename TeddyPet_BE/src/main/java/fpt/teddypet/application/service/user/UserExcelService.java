package fpt.teddypet.application.service.user;

import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.service.products.ExcelStyleHelper;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.UserStatusEnum;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Excel export/import cho danh sách khách hàng (users).
 * - Không dùng ID từ file để cập nhật (tránh đè nhầm): chỉ khớp theo Email.
 * - Mật khẩu không xuất; khi tạo mới: đặt mật khẩu tạm + mustChangePassword = true (bắt đổi khi đăng nhập).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserExcelService {

    private static final int MAX_MESSAGE_LEN = 255;

    private final UserRepositoryPort userRepositoryPort;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    public record ImportResult(int created, int updated, int skipped, List<String> errors) {}

    /** Same shape as SimpleEntityExcelService.EntityPreviewRow: name = email for display. */
    public record UserPreviewRow(int rowNumber, String name, String action, String message) {}

    private static final String[] EXPORT_HEADERS = {
            "[CHỈ XEM] ID",
            "Email *",
            "Username",
            "Họ",
            "Tên",
            "Số điện thoại",
            "Trạng thái",
            "Vai trò"
    };

    public void exportUsers(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=users_export.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Khách hàng");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            writeHeader(sheet, header, EXPORT_HEADERS);

            int row = 1;
            for (User u : userRepositoryPort.findAll()) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(u.getId() != null ? u.getId().toString() : "");
                r.createCell(1).setCellValue(safeStr(u.getEmail()));
                r.createCell(2).setCellValue(safeStr(u.getUsername()));
                r.createCell(3).setCellValue(safeStr(u.getLastName()));
                r.createCell(4).setCellValue(safeStr(u.getFirstName()));
                r.createCell(5).setCellValue(safeStr(u.getPhoneNumber()));
                r.createCell(6).setCellValue(u.getStatus() != null ? u.getStatus().name() : "");
                r.createCell(7).setCellValue(u.getRole() != null ? u.getRole().getName() : "");
            }
            autoSizeAll(sheet, EXPORT_HEADERS.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xuất danh sách người dùng.", e);
        }
    }

    public void downloadTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=users_template.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Khách hàng");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            writeHeader(sheet, header, EXPORT_HEADERS);
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("(chỉ tham chiếu, không dùng để cập nhật)");
            sample.createCell(1).setCellValue("khach@example.com");
            sample.createCell(2).setCellValue("khach1");
            sample.createCell(3).setCellValue("Nguyễn");
            sample.createCell(4).setCellValue("Văn A");
            sample.createCell(5).setCellValue("0901234567");
            sample.createCell(6).setCellValue("ACTIVE");
            sample.createCell(7).setCellValue("USER");
            addComment(sheet, 0, 1, "Khớp theo Email: email có trong hệ thống = cập nhật; chưa có = tạo mới. Tài khoản mới sẽ phải đặt lại mật khẩu khi đăng nhập lần đầu.");
            autoSizeAll(sheet, EXPORT_HEADERS.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template người dùng.", e);
        }
    }

    public List<UserPreviewRow> previewImport(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File trống.");
        List<UserPreviewRow> previews = new ArrayList<>();
        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (isRowEmpty(row)) continue;
                String email = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(email)) {
                    previews.add(new UserPreviewRow(i + 1, "", "ERROR", truncate("Email không được để trống.")));
                    continue;
                }
                Optional<User> existing = userRepositoryPort.findByEmail(email.trim());
                if (existing.isPresent()) {
                    previews.add(new UserPreviewRow(i + 1, email, "UPDATE_EXISTING", truncate("Cập nhật: " + existing.get().getUsername())));
                } else {
                    previews.add(new UserPreviewRow(i + 1, email, "CREATE_NEW", truncate("Tạo mới — yêu cầu đặt mật khẩu khi đăng nhập lần đầu.")));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file.", e);
        }
        return previews;
    }

    /**
     * Import theo Email: không dùng ID từ file để tránh đè nhầm.
     * - Email đã tồn tại → cập nhật thông tin (username, họ tên, SĐT, trạng thái); không đổi mật khẩu.
     * - Email chưa có → tạo mới với mật khẩu tạm + mustChangePassword = true.
     */
    public ImportResult importUsers(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        Role defaultRole = roleService.getDefaultRole();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String email = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(email)) {
                    skipped++;
                    continue;
                }
                email = email.trim();

                String username = getCellStr(row.getCell(2));
                String lastName = getCellStr(row.getCell(3));
                String firstName = getCellStr(row.getCell(4));
                String phone = getCellStr(row.getCell(5));
                String statusStr = getCellStr(row.getCell(6));

                try {
                    Optional<User> opt = userRepositoryPort.findByEmail(email);
                    if (opt.isPresent()) {
                        User u = opt.get();
                        if (StringUtils.hasText(username)) u.setUsername(username);
                        if (StringUtils.hasText(lastName)) u.setLastName(lastName);
                        if (StringUtils.hasText(firstName)) u.setFirstName(firstName);
                        if (StringUtils.hasText(phone)) u.setPhoneNumber(phone);
                        if (StringUtils.hasText(statusStr)) {
                            try {
                                u.setStatus(UserStatusEnum.valueOf(statusStr.trim()));
                            } catch (IllegalArgumentException ignored) {}
                        }
                        userRepositoryPort.save(u);
                        updated++;
                    } else {
                        String finalUsername = StringUtils.hasText(username) ? username : deriveUsernameFromEmail(email);
                        if (userRepositoryPort.existsByUsername(finalUsername)) {
                            finalUsername = finalUsername + "_" + UUID.randomUUID().toString().substring(0, 8);
                        }
                        String tempPassword = UUID.randomUUID().toString();
                        User user = User.builder()
                                .username(finalUsername)
                                .email(email)
                                .password(passwordEncoder.encode(tempPassword))
                                .firstName(StringUtils.hasText(firstName) ? firstName : null)
                                .lastName(StringUtils.hasText(lastName) ? lastName : null)
                                .phoneNumber(StringUtils.hasText(phone) ? phone : null)
                                .status(parseStatus(statusStr))
                                .role(defaultRole)
                                .mustChangePassword(true)
                                .build();
                        userRepositoryPort.save(user);
                        created++;
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    errors.add("Dòng " + (i + 1) + " [" + email + "]: " + truncate(msg));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file.", e);
        }
        log.info("User import: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    private static UserStatusEnum parseStatus(String s) {
        if (!StringUtils.hasText(s)) return UserStatusEnum.ACTIVE;
        try {
            return UserStatusEnum.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return UserStatusEnum.ACTIVE;
        }
    }

    private static String deriveUsernameFromEmail(String email) {
        if (email == null || !email.contains("@")) return "user_" + UUID.randomUUID().toString().substring(0, 8);
        return email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9]", "_");
    }

    private static String truncate(String s) {
        if (s == null || s.length() <= MAX_MESSAGE_LEN) return s;
        return s.substring(0, MAX_MESSAGE_LEN);
    }

    private static void addComment(Sheet sheet, int col, int row, String text) {
        try {
            CreationHelper factory = sheet.getWorkbook().getCreationHelper();
            ClientAnchor anchor = factory.createClientAnchor();
            anchor.setCol1(col);
            anchor.setCol2(col + 2);
            anchor.setRow1(row);
            anchor.setRow2(row + 2);
            Drawing<?> drawing = sheet.createDrawingPatriarch();
            Comment comment = drawing.createCellComment(anchor);
            comment.setString(factory.createRichTextString(truncate(text)));
            sheet.getRow(row).getCell(col).setCellComment(comment);
        } catch (Exception ignored) {}
    }

    private static void writeHeader(Sheet sheet, CellStyle style, String[] headers) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private static boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && StringUtils.hasText(cell.toString())) {
                return false;
            }
        }
        return true;
    }

    private static void autoSizeAll(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++) sheet.autoSizeColumn(i);
    }

    private static String safeStr(String s) {
        return s != null ? s : "";
    }

    private static String getCellStr(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }
}
