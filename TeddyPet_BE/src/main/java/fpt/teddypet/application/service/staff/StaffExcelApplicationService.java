package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.StaffCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffProfileRequest;
import fpt.teddypet.application.port.input.staff.StaffExcelService;
import fpt.teddypet.application.port.input.staff.StaffProfileService;
import fpt.teddypet.application.service.products.ExcelStyleHelper;
import fpt.teddypet.application.service.products.SimpleEntityExcelService.ImportResult;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffPositionRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffProfileRepository;
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
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffExcelApplicationService implements StaffExcelService {

    private final StaffProfileRepository staffProfileRepository;
    private final StaffPositionRepository staffPositionRepository;
    private final StaffProfileService staffProfileService;

    @Override
    public void exportStaffToExcel(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=staff_profiles.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Nhân Sự");
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (StaffExcelColumn column : StaffExcelColumn.values()) {
                Cell cell = headerRow.createCell(column.getIndex());
                cell.setCellValue(column.getHeader());
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(column.getIndex(), column.getWidth() * 256);
            }

            int rowIdx = 1;
            List<StaffProfile> profiles = staffProfileRepository.findAll();
            for (StaffProfile profile : profiles) {
                Row row = sheet.createRow(rowIdx++);
                writeStaffToRow(profile, row);
            }

            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            log.error("Error exporting staff to Excel", e);
            throw new RuntimeException("Không thể xuất file excel nhân sự");
        }
    }

    @Override
    public void downloadStaffTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=staff_template.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Nhân Sự");
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (StaffExcelColumn column : StaffExcelColumn.values()) {
                Cell cell = headerRow.createCell(column.getIndex());
                cell.setCellValue(column.getHeader());
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(column.getIndex(), column.getWidth() * 256);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(StaffExcelColumn.ID.getIndex()).setCellValue("");
            sampleRow.createCell(StaffExcelColumn.FULL_NAME.getIndex()).setCellValue("Nguyễn Văn A");
            sampleRow.createCell(StaffExcelColumn.EMAIL.getIndex()).setCellValue("nva@teddypet.vn");
            sampleRow.createCell(StaffExcelColumn.PHONE.getIndex()).setCellValue("0901234567");
            sampleRow.createCell(StaffExcelColumn.CITIZEN_ID.getIndex()).setCellValue("079099012345");
            sampleRow.createCell(StaffExcelColumn.DOB.getIndex()).setCellValue("1995-10-25");
            sampleRow.createCell(StaffExcelColumn.GENDER.getIndex()).setCellValue("MALE");
            sampleRow.createCell(StaffExcelColumn.ADDRESS.getIndex()).setCellValue("123 District 1, HCMC");
            sampleRow.createCell(StaffExcelColumn.BANK_ACCOUNT.getIndex()).setCellValue("123456789");
            sampleRow.createCell(StaffExcelColumn.BANK_NAME.getIndex()).setCellValue("TPBank");
            sampleRow.createCell(StaffExcelColumn.EMPLOYMENT_TYPE.getIndex()).setCellValue("FULL_TIME");
            sampleRow.createCell(StaffExcelColumn.POSITION.getIndex()).setCellValue("Nhân viên grooming");
            sampleRow.createCell(StaffExcelColumn.ROLE.getIndex()).setCellValue("STAFF");

            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            log.error("Error creating staff template", e);
            throw new RuntimeException("Không thể tạo template nhân sự");
        }
    }

    @Override
    @Transactional
    public ImportResult importStaffFromExcel(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File trống");

        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        Map<String, Long> activePositionIdByName = new HashMap<>();
        staffPositionRepository.findAllActive().forEach(p -> activePositionIdByName.put(p.getName().trim().toLowerCase(), p.getId()));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String fullName = getCellStr(row.getCell(StaffExcelColumn.FULL_NAME.getIndex()));
                if (!StringUtils.hasText(fullName)) {
                    skipped++;
                    continue;
                }

                Long id = getCellLong(row.getCell(StaffExcelColumn.ID.getIndex()));
                String email = getCellStr(row.getCell(StaffExcelColumn.EMAIL.getIndex()));
                String phone = getCellStr(row.getCell(StaffExcelColumn.PHONE.getIndex()));
                String citId = getCellStr(row.getCell(StaffExcelColumn.CITIZEN_ID.getIndex()));
                String dobStr = getCellStr(row.getCell(StaffExcelColumn.DOB.getIndex()));
                String genStr = getCellStr(row.getCell(StaffExcelColumn.GENDER.getIndex()));
                String address = getCellStr(row.getCell(StaffExcelColumn.ADDRESS.getIndex()));
                String bankAcc = getCellStr(row.getCell(StaffExcelColumn.BANK_ACCOUNT.getIndex()));
                String bankName = getCellStr(row.getCell(StaffExcelColumn.BANK_NAME.getIndex()));
                String empTypeStr = getCellStr(row.getCell(StaffExcelColumn.EMPLOYMENT_TYPE.getIndex()));
                String posNameStr = getCellStr(row.getCell(StaffExcelColumn.POSITION.getIndex()));
                String roleStr = getCellStr(row.getCell(StaffExcelColumn.ROLE.getIndex()));

                try {
                    LocalDate dob = null;
                    if (StringUtils.hasText(dobStr)) {
                        dob = parseDate(dobStr);
                    }

                    GenderEnum gender = StringUtils.hasText(genStr) ? GenderEnum.valueOf(genStr.trim().toUpperCase()) : null;
                    EmploymentTypeEnum empType = StringUtils.hasText(empTypeStr) ? EmploymentTypeEnum.valueOf(empTypeStr.trim().toUpperCase()) : null;
                    Long positionId = null;
                    if (StringUtils.hasText(posNameStr)) {
                        positionId = activePositionIdByName.get(posNameStr.trim().toLowerCase());
                    }

                    if (id != null) {
                        // UPDATE
                        StaffProfileRequest request = new StaffProfileRequest(
                                fullName,
                                StringUtils.hasText(email) ? email : null,
                                StringUtils.hasText(phone) ? phone : null,
                                StringUtils.hasText(citId) ? citId : null,
                                dob,
                                gender,
                                null, null, // avatars
                                address,
                                bankAcc,
                                bankName,
                                positionId,
                                null, // secondary pos
                                empType,
                                null // backupEmail
                        );
                        staffProfileService.update(id, request);
                        updated++;
                    } else {
                        // CREATE
                        StaffCreationDTO request = new StaffCreationDTO(
                                fullName,
                                StringUtils.hasText(email) ? email : null,
                                StringUtils.hasText(phone) ? phone : null,
                                StringUtils.hasText(citId) ? citId : null,
                                dob,
                                gender,
                                null, null, // avatars
                                address,
                                bankAcc,
                                bankName,
                                positionId,
                                null, // secondary pos
                                empType,
                                StringUtils.hasText(roleStr) ? roleStr.toUpperCase() : "STAFF",
                                null // backupEmail
                        );
                        staffProfileService.createProfile(request);
                        created++;
                    }

                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + " [" + fullName + "]: " + e.getMessage());
                }
            }

        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file excel nhân sự", e);
        }

        log.info("Staff import result: created={}, updated={}, skipped={}, errors={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    private void writeStaffToRow(StaffProfile p, Row r) {
        r.createCell(StaffExcelColumn.ID.getIndex()).setCellValue(p.getId() != null ? String.valueOf(p.getId()) : "");
        r.createCell(StaffExcelColumn.FULL_NAME.getIndex()).setCellValue(safe(p.getFullName()));
        r.createCell(StaffExcelColumn.EMAIL.getIndex()).setCellValue(safe(p.getEmail()));
        r.createCell(StaffExcelColumn.PHONE.getIndex()).setCellValue(safe(p.getPhoneNumber()));
        r.createCell(StaffExcelColumn.CITIZEN_ID.getIndex()).setCellValue(safe(p.getCitizenId()));
        r.createCell(StaffExcelColumn.DOB.getIndex()).setCellValue(p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : "");
        r.createCell(StaffExcelColumn.GENDER.getIndex()).setCellValue(p.getGender() != null ? p.getGender().name() : "");
        r.createCell(StaffExcelColumn.ADDRESS.getIndex()).setCellValue(safe(p.getAddress()));
        r.createCell(StaffExcelColumn.BANK_ACCOUNT.getIndex()).setCellValue(safe(p.getBankAccountNo()));
        r.createCell(StaffExcelColumn.BANK_NAME.getIndex()).setCellValue(safe(p.getBankName()));
        r.createCell(StaffExcelColumn.EMPLOYMENT_TYPE.getIndex()).setCellValue(p.getEmploymentType() != null ? p.getEmploymentType().name() : "");
        r.createCell(StaffExcelColumn.POSITION.getIndex()).setCellValue(p.getPosition() != null ? p.getPosition().getName() : "");
        
        String role = "";
        if (p.getUser() != null && p.getUser().getRole() != null) {
            String roleName = p.getUser().getRole().getName();
            role = (roleName != null && roleName.toUpperCase().contains("ADMIN")) ? "ADMIN" : "STAFF";
        }
        r.createCell(StaffExcelColumn.ROLE.getIndex()).setCellValue(role);
    }

    private String safe(String str) {
        return str == null ? "" : str;
    }

    private String getCellStr(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                yield String.valueOf((long) cell.getNumericCellValue());
            }
            default -> "";
        };
    }

    private Long getCellLong(Cell cell) {
        if (cell == null) return null;
        String val = getCellStr(cell);
        if (!StringUtils.hasText(val) || val.startsWith("(")) return null;
        try {
            return Long.parseLong(val);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate parseDate(String str) {
        try {
            return LocalDate.parse(str.trim());
        } catch (DateTimeParseException e) {
            // fallback
            return null;
        }
    }
}
