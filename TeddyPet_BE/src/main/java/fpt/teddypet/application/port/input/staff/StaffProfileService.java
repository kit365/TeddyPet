package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.AccountCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffProfileRequest;
import fpt.teddypet.application.dto.response.staff.StaffProfileResponse;

import java.util.List;
import java.util.UUID;

public interface StaffProfileService {

    /** Flow A: Tạo hồ sơ nhân viên chỉ (không tài khoản). user_id = null. */
    StaffProfileResponse createProfile(StaffCreationDTO request);

    /** Flow B: Cấp tài khoản cho nhân viên đã có hồ sơ. Smart linking: tạo User mới hoặc link User đã tồn tại (customer becoming staff). */
    StaffProfileResponse provisionAccount(Long staffId, AccountCreationDTO request);

    StaffProfileResponse update(Long staffId, StaffProfileRequest request);

    void deactivate(Long staffId);

    StaffProfileResponse reactivate(Long staffId);

    StaffProfileResponse getById(Long staffId);

    /** Lấy hồ sơ nhân viên theo userId (đăng nhập) – dùng cho trang Đăng ký ca (work_type, positionId). */
    StaffProfileResponse getByUserId(UUID userId);

    List<StaffProfileResponse> getAllActive();

    StaffProfileResponse updateRole(Long staffId, String roleName);
}

