package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.AccountCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffProfileRequest;
import fpt.teddypet.application.dto.response.staff.StaffProfileResponse;
import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.input.staff.StaffProfileService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffPositionRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.util.StaffProfileHelper;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import fpt.teddypet.domain.enums.UserStatusEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffProfileApplicationService implements StaffProfileService {

    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final StaffPositionRepositoryPort staffPositionRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public StaffProfileResponse createProfile(StaffCreationDTO request) {
        validateUniqueOnCreate(request.email(), request.phoneNumber(), request.citizenId());
        StaffPosition position = request.positionId() != null
                ? staffPositionRepositoryPort.findById(request.positionId()).orElse(null)
                : null;
        StaffProfile staff = StaffProfile.builder()
                .user(null)
                .fullName(request.fullName())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .citizenId(request.citizenId())
                .dateOfBirth(request.dateOfBirth())
                .gender(request.gender())
                .avatarUrl(request.avatarUrl())
                .altImage(request.altImage())
                .address(request.address())
                .bankAccountNo(request.bankAccountNo())
                .bankName(request.bankName())
                .hireDate(request.hireDate() != null ? request.hireDate() : LocalDate.now())
                .position(position)
                .build();
        StaffProfile saved = staffProfileRepositoryPort.save(staff);
        tryLinkExistingUserByEmail(saved);
        return toResponse(saved);
    }

    /**
     * Nếu email trong hồ sơ đã tồn tại trong bảng users với role USER thì tự động liên kết,
     * cập nhật thông tin user theo profile và gán role STAFF. Chỉ xử lý khi profile chưa có user.
     */
    private void tryLinkExistingUserByEmail(StaffProfile profile) {
        if (profile.getUser() != null) return;
        String email = profile.getEmail();
        if (email == null || email.isBlank()) return;
        if (!userRepositoryPort.existsByEmail(email)) return;

        User existingUser = userRepositoryPort.getByEmail(email);
        if (existingUser.getRole() == null || !"USER".equals(existingUser.getRole().getName())) return;

        staffProfileRepositoryPort.findByUserId(existingUser.getId()).ifPresent(existingProfile -> {
            if (!existingProfile.getId().equals(profile.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email " + email + " đã được liên kết với nhân viên khác.");
            }
        });

        Role staffRole = roleService.findByName("STAFF");
        existingUser.setRole(staffRole);
        syncProfileToUser(profile, existingUser);
        userRepositoryPort.save(existingUser);
        profile.setUser(existingUser);
        staffProfileRepositoryPort.save(profile);
    }

    @Override
    @Transactional
    public StaffProfileResponse provisionAccount(Long staffId, AccountCreationDTO request) {
        StaffProfile profile = getActiveById(staffId);
        if (profile.getUser() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhân viên này đã có tài khoản đăng nhập");
        }
        String email = profile.getEmail();
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Hồ sơ nhân viên chưa có email. Vui lòng cập nhật email trước khi cấp tài khoản.");
        }

        Role staffRole = roleService.findByName(request.roleName());

        if (userRepositoryPort.existsByEmail(email)) {
            // Case B: Customer becoming Staff - link existing User (preserve customer data)
            User existingUser = userRepositoryPort.getByEmail(email);
            staffProfileRepositoryPort.findByUserId(existingUser.getId()).ifPresent(existingProfile -> {
                if (!existingProfile.getId().equals(staffId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email " + email + " đã được liên kết với nhân viên khác.");
                }
            });

            existingUser.setRole(staffRole);

            if (request.username() != null && !request.username().isBlank()
                    && !request.username().equals(existingUser.getUsername())) {
                if (userRepositoryPort.existsByUsername(request.username())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username đã được sử dụng: " + request.username());
                }
                existingUser.setUsername(request.username());
            }
            if (request.password() != null && !request.password().isBlank()) {
                existingUser.setPassword(passwordEncoder.encode(request.password()));
            }
            existingUser.setAvatarUrl(profile.getAvatarUrl());
            existingUser.setAltImage(profile.getAltImage());

            User savedUser = userRepositoryPort.save(existingUser);
            profile.setUser(savedUser);
            StaffProfile saved = staffProfileRepositoryPort.save(profile);
            return toResponse(saved);
        } else {
            // Case A: New Staff - create new User
            if (request.username() == null || request.username().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username là bắt buộc khi tạo tài khoản mới");
            }
            if (request.password() == null || request.password().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password là bắt buộc khi tạo tài khoản mới");
            }
            if (userRepositoryPort.existsByUsername(request.username())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username đã được sử dụng: " + request.username());
            }

            String[] nameParts = StaffProfileHelper.splitFullName(profile.getFullName());
            User user = User.builder()
                    .username(request.username())
                    .email(email)
                    .password(passwordEncoder.encode(request.password()))
                    .firstName(nameParts[0])
                    .lastName(nameParts[1])
                    .phoneNumber(profile.getPhoneNumber())
                    .dateOfBirth(profile.getDateOfBirth())
                    .gender(profile.getGender())
                    .avatarUrl(profile.getAvatarUrl())
                    .altImage(profile.getAltImage())
                    .status(UserStatusEnum.ACTIVE)
                    .role(staffRole)
                    .build();

            User savedUser = userRepositoryPort.save(user);
            profile.setUser(savedUser);
            StaffProfile saved = staffProfileRepositoryPort.save(profile);
            return toResponse(saved);
        }
    }

    @Override
    @Transactional
    public StaffProfileResponse update(Long staffId, StaffProfileRequest request) {
        StaffProfile staff = getActiveById(staffId);
        validateUniqueOnUpdate(staffId, request.phoneNumber(), request.citizenId());

        if (request.fullName() != null && !request.fullName().isBlank()) {
            staff.setFullName(request.fullName());
        }
        if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
            staff.setPhoneNumber(request.phoneNumber());
        }
        if (request.email() != null) {
            staff.setEmail(request.email().isBlank() ? null : request.email());
        }
        staff.setCitizenId(request.citizenId());
        staff.setDateOfBirth(request.dateOfBirth());
        if (request.gender() != null) {
            staff.setGender(request.gender());
        }
        if (request.avatarUrl() != null) {
            staff.setAvatarUrl(request.avatarUrl().isBlank() ? null : request.avatarUrl());
        }
        if (request.altImage() != null) {
            staff.setAltImage(request.altImage().isBlank() ? null : request.altImage());
        }
        staff.setAddress(request.address());
        staff.setBankAccountNo(request.bankAccountNo());
        staff.setBankName(request.bankName());
        staff.setHireDate(request.hireDate());
        if (request.positionId() != null) {
            StaffPosition position = staffPositionRepositoryPort.findById(request.positionId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chức vụ với id: " + request.positionId()));
            staff.setPosition(position);
        } else {
            staff.setPosition(null);
        }

        StaffProfile saved = staffProfileRepositoryPort.save(staff);

        // Đồng bộ dữ liệu sang User (bảng users) khi nhân viên đã có tài khoản liên kết
        if (saved.getUser() != null) {
            syncProfileToUser(saved, saved.getUser());
            userRepositoryPort.save(saved.getUser());
        } else {
            tryLinkExistingUserByEmail(saved);
        }

        return toResponse(saved);
    }

    private void syncProfileToUser(StaffProfile profile, User user) {
        String[] nameParts = StaffProfileHelper.splitFullName(profile.getFullName());
        user.setFirstName(nameParts[0]);
        user.setLastName(nameParts[1]);
        user.setPhoneNumber(profile.getPhoneNumber());
        user.setDateOfBirth(profile.getDateOfBirth());
        user.setGender(profile.getGender());
        user.setAvatarUrl(profile.getAvatarUrl());
        user.setAltImage(profile.getAltImage());
    }

    @Override
    @Transactional
    public void deactivate(Long staffId) {
        StaffProfile staff = getActiveById(staffId);
        staff.setActive(false);
        staff.setDeleted(true);
        staffProfileRepositoryPort.save(staff);
    }

    @Override
    @Transactional
    public StaffProfileResponse reactivate(Long staffId) {
        StaffProfile staff = staffProfileRepositoryPort.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + staffId));
        staff.setActive(true);
        staff.setDeleted(false);
        StaffProfile saved = staffProfileRepositoryPort.save(staff);
        return toResponse(saved);
    }

    @Override
    public StaffProfileResponse getById(Long staffId) {
        return toResponse(getActiveById(staffId));
    }

    @Override
    public List<StaffProfileResponse> getAllActive() {
        return staffProfileRepositoryPort.findAllActive()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StaffProfile getActiveById(Long staffId) {
        return staffProfileRepositoryPort.findById(staffId)
                .filter(s -> !s.isDeleted() && s.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + staffId));
    }

    private void validateUniqueOnCreate(String email, String phoneNumber, String citizenId) {
        if (email != null && !email.isBlank() && staffProfileRepositoryPort.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng: " + email);
        }
        if (phoneNumber != null && !phoneNumber.isBlank() && staffProfileRepositoryPort.existsByPhoneNumber(phoneNumber)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng: " + phoneNumber);
        }
        if (citizenId != null && !citizenId.isBlank() && staffProfileRepositoryPort.existsByCitizenId(citizenId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD/CMND đã được sử dụng: " + citizenId);
        }
    }

    private void validateUniqueOnUpdate(Long staffId, String phoneNumber, String citizenId) {
        if (phoneNumber != null && !phoneNumber.isBlank()
                && staffProfileRepositoryPort.existsByPhoneNumberExcludingId(phoneNumber, staffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng: " + phoneNumber);
        }
        if (citizenId != null && !citizenId.isBlank()
                && staffProfileRepositoryPort.existsByCitizenIdExcludingId(citizenId, staffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD/CMND đã được sử dụng: " + citizenId);
        }
    }

    private StaffProfileResponse toResponse(StaffProfile staff) {
        User user = staff.getUser();
        StaffPosition position = staff.getPosition();
        return new StaffProfileResponse(
                staff.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getUsername() : null,
                staff.getFullName(),
                staff.getEmail(),
                staff.getPhoneNumber(),
                staff.getCitizenId(),
                staff.getDateOfBirth(),
                staff.getGender(),
                staff.getAvatarUrl(),
                staff.getAltImage(),
                staff.getAddress(),
                staff.getBankAccountNo(),
                staff.getBankName(),
                staff.getHireDate(),
                position != null ? position.getId() : null,
                position != null ? position.getCode() : null,
                position != null ? position.getName() : null,
                staff.isActive()
        );
    }

}

