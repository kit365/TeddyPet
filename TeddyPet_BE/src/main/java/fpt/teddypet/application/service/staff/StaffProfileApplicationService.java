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
import fpt.teddypet.domain.entity.AvatarImage;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import fpt.teddypet.domain.enums.UserStatusEnum;
import fpt.teddypet.domain.enums.RoleEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import fpt.teddypet.infrastructure.persistence.postgres.repository.AvatarImageRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffProfileApplicationService implements StaffProfileService {

    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final StaffPositionRepositoryPort staffPositionRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final AvatarImageRepository avatarImageRepository;
    private final fpt.teddypet.application.port.output.AdminGoogleWhitelistPort adminGoogleWhitelistPort;
    private final fpt.teddypet.application.port.input.AuthService authService;
    private final fpt.teddypet.application.port.output.EmailServicePort emailServicePort;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public StaffProfileResponse createProfile(StaffCreationDTO request) {
        validateUniqueOnCreate(request.email(), request.phoneNumber(), request.citizenId(), request.backupEmail());
        StaffPosition position = request.positionId() != null
                ? staffPositionRepositoryPort.findById(request.positionId()).orElse(null)
                : null;
        String avatarUrl = request.avatarUrl();
        String generatedAltImage = (avatarUrl != null && !avatarUrl.isBlank())
                ? ("Ảnh đại diện " + (request.fullName() != null ? request.fullName() : "nhân viên"))
                : null;
        StaffPosition secondaryPosition = request.secondaryPositionId() != null
                ? staffPositionRepositoryPort.findById(request.secondaryPositionId()).orElse(null)
                : null;
        StaffProfile staff = StaffProfile.builder()
                .user(null)
                .fullName(request.fullName())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .citizenId(request.citizenId())
                .dateOfBirth(request.dateOfBirth())
                .gender(request.gender())
                .avatarUrl(avatarUrl)
                .altImage(request.altImage() != null ? request.altImage() : generatedAltImage)
                .address(request.address())
                .bankAccountNo(request.bankAccountNo())
                .bankName(request.bankName())
                .backupEmail(request.backupEmail())
                .position(position)
                .secondaryPosition(secondaryPosition)
                .employmentType(request.employmentType())
                .build();
        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            createAvatarImageForStaff(request.avatarUrl(), request.fullName());
        }
        StaffProfile saved = staffProfileRepositoryPort.save(staff);
        
        // Flow: Automatic account creation if role is assigned
        if (request.email() != null && !request.email().isBlank() && request.assignedRole() != null) {
            provisionAccountAutomatically(saved, request.assignedRole());
        } else {
            tryLinkExistingUserByEmail(saved);
        }
        
        return toResponse(saved);
    }

    @Transactional
    protected void provisionAccountAutomatically(StaffProfile profile, String roleName) {
        String email = profile.getEmail();
        Role role = roleService.findByName(roleName);
        
        // Security check
        if (RoleEnum.ADMIN.name().equals(role.getName()) || RoleEnum.SUPER_ADMIN.name().equals(role.getName())) {
            User currentUser = authService.getCurrentUser();
            if (!RoleEnum.SUPER_ADMIN.name().equals(currentUser.getRole().getName())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Super Admin mới được phép cấp quyền Admin.");
            }
        }

        User user;
        if (userRepositoryPort.existsByEmail(email)) {
            user = userRepositoryPort.getByEmail(email);
            user.setRole(role);
            // If it was a customer/user, they now have higher privileges and must change password if they haven't set one for admin
            // Or just force it for safety
            user.setMustChangePassword(true);
        } else {
            String[] nameParts = StaffProfileHelper.splitFullName(profile.getFullName());
            user = User.builder()
                    .username(email) // Default username as email
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password
                    .firstName(nameParts[0])
                    .lastName(nameParts[1])
                    .phoneNumber(profile.getPhoneNumber())
                    .dateOfBirth(profile.getDateOfBirth())
                    .gender(profile.getGender())
                    .avatarUrl(profile.getAvatarUrl())
                    .altImage(profile.getAltImage())
                    .status(UserStatusEnum.ACTIVE)
                    .role(role)
                    .mustChangePassword(true)
                    .backupEmail(profile.getBackupEmail())
                    .build();
        }
        
        User savedUser = userRepositoryPort.save(user);
        profile.setUser(savedUser);
        staffProfileRepositoryPort.save(profile);
        
        autoWhitelistForGoogle(email, role.getName());
    }

    /**
     * Tạo bản ghi avatar_images cho avatar của nhân viên (category = "STAFF").
     * Nếu đã có user liên kết với staff, gắn luôn userId để thuận tiện truy vết.
     */
    @Transactional
    protected AvatarImage createAvatarImageForStaff(String avatarUrl, String fullName) {
        return createAvatarImageForStaff(avatarUrl, fullName, null);
    }

    @Transactional
    protected AvatarImage createAvatarImageForStaff(String avatarUrl, String fullName, User user) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }
        AvatarImage avatar = AvatarImage.builder()
                .imageUrl(avatarUrl.trim())
                .altText(fullName != null && !fullName.isBlank() ? "Ảnh đại diện " + fullName : "Staff avatar")
                .category("STAFF")
                .user(user)
                .isPredefined(false)
                .build();
        return avatarImageRepository.save(avatar);
    }

    /**
     * Nếu email trong hồ sơ đã tồn tại trong bảng users với role USER thì tự động
     * liên kết,
     * cập nhật thông tin user theo profile và gán role STAFF. Chỉ xử lý khi profile
     * chưa có user.
     */
    private void tryLinkExistingUserByEmail(StaffProfile profile) {
        if (profile.getUser() != null)
            return;
        String email = profile.getEmail();
        if (email == null || email.isBlank())
            return;
        if (!userRepositoryPort.existsByEmail(email))
            return;

        User existingUser = userRepositoryPort.getByEmail(email);
        if (existingUser.getRole() == null || !RoleEnum.USER.name().equals(existingUser.getRole().getName()))
            return;

        staffProfileRepositoryPort.findByUserId(existingUser.getId()).ifPresent(existingProfile -> {
            if (!existingProfile.getId().equals(profile.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Email " + email + " đã được liên kết với nhân viên khác.");
            }
        });

        Role staffRole = roleService.findByName(RoleEnum.STAFF.name());
        existingUser.setRole(staffRole);
        syncProfileToUser(profile, existingUser);
        userRepositoryPort.save(existingUser);
        
        autoWhitelistForGoogle(existingUser.getEmail(), staffRole.getName());
        
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
        
        // Security check: Only SUPER_ADMIN can assign ADMIN/SUPER_ADMIN role
        if (RoleEnum.ADMIN.name().equals(staffRole.getName()) || RoleEnum.SUPER_ADMIN.name().equals(staffRole.getName())) {
            User currentUser = authService.getCurrentUser();
            if (!RoleEnum.SUPER_ADMIN.name().equals(currentUser.getRole().getName())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Super Admin mới được phép cấp quyền Admin.");
            }
        }

        if (userRepositoryPort.existsByEmail(email)) {
            // Case B: Customer becoming Staff - link existing User (preserve customer data)
            User existingUser = userRepositoryPort.getByEmail(email);
            staffProfileRepositoryPort.findByUserId(existingUser.getId()).ifPresent(existingProfile -> {
                if (!existingProfile.getId().equals(staffId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Email " + email + " đã được liên kết với nhân viên khác.");
                }
            });

            existingUser.setRole(staffRole);

            String targetUsername = (request.username() != null && !request.username().isBlank()) 
                    ? request.username() : email;
            String targetPassword = (request.password() != null && !request.password().isBlank())
                    ? request.password() : UUID.randomUUID().toString();

            if (!targetUsername.equals(existingUser.getUsername()) && userRepositoryPort.existsByUsername(targetUsername)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username đã được sử dụng: " + targetUsername);
            }
            
            existingUser.setUsername(targetUsername);
            if (request.password() != null && !request.password().isBlank()) {
                existingUser.setPassword(passwordEncoder.encode(targetPassword));
            } else if (existingUser.getPassword() == null || existingUser.getPassword().isBlank()) {
                // If existing user has no password (e.g. only Google login), set a random one
                existingUser.setPassword(passwordEncoder.encode(targetPassword));
            }

            // Force mustChangePassword if password was changed or set for the first time
            existingUser.setMustChangePassword(true);
            
            existingUser.setRole(staffRole);
            existingUser.setAvatarUrl(profile.getAvatarUrl());
            existingUser.setAltImage(profile.getAltImage());
            existingUser.setBackupEmail(profile.getBackupEmail());

            User savedUser = userRepositoryPort.save(existingUser);
            profile.setUser(savedUser);
            StaffProfile saved = staffProfileRepositoryPort.save(profile);
            
            autoWhitelistForGoogle(savedUser.getEmail(), staffRole.getName());
            
            return toResponse(saved);
        } else {
            // Case A: New Staff - create new User
            String targetUsername = (request.username() != null && !request.username().isBlank()) 
                    ? request.username() : email;
            String targetPassword = (request.password() != null && !request.password().isBlank())
                    ? request.password() : UUID.randomUUID().toString();

            if (userRepositoryPort.existsByUsername(targetUsername)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username đã được sử dụng: " + targetUsername);
            }

            String[] nameParts = StaffProfileHelper.splitFullName(profile.getFullName());
            User user = User.builder()
                    .username(targetUsername)
                    .email(email)
                    .password(passwordEncoder.encode(targetPassword))
                    .firstName(nameParts[0])
                    .lastName(nameParts[1])
                    .phoneNumber(profile.getPhoneNumber())
                    .dateOfBirth(profile.getDateOfBirth())
                    .gender(profile.getGender())
                    .avatarUrl(profile.getAvatarUrl())
                    .altImage(profile.getAltImage())
                    .status(UserStatusEnum.ACTIVE)
                    .role(staffRole)
                    .mustChangePassword(true)
                    .backupEmail(profile.getBackupEmail())
                    .build();

            User savedUser = userRepositoryPort.save(user);
            profile.setUser(savedUser);
            StaffProfile saved = staffProfileRepositoryPort.save(profile);
            
            autoWhitelistForGoogle(savedUser.getEmail(), staffRole.getName());
            
            return toResponse(saved);
        }
    }
    
    private void autoWhitelistForGoogle(String email, String role) {
        if (email == null || email.isBlank()) return;
        
        String normalizedEmail = email.toLowerCase().trim();
        // Only invite if not already in whitelist or if in a non-accepted state
        if (adminGoogleWhitelistPort.findByEmail(normalizedEmail).isEmpty()) {
            String token = UUID.randomUUID().toString();
            java.time.LocalDateTime expiry = java.time.LocalDateTime.now().plusDays(1);
            User currentUser = null;
            try {
                currentUser = authService.getCurrentUser();
            } catch (Exception e) {
                // Ignore if no current user (e.g. system init)
            }

            fpt.teddypet.domain.entity.AdminGoogleWhitelist whitelist = fpt.teddypet.domain.entity.AdminGoogleWhitelist.builder()
                    .email(normalizedEmail)
                    .role(role)
                    .status("PENDING")
                    .isActive(true)
                    .isDeleted(false)
                    .addedBy(currentUser != null ? currentUser.getEmail() : "SYSTEM_AUTO")
                    .invitationToken(token)
                    .tokenExpiredAt(expiry)
                    .build();
            adminGoogleWhitelistPort.save(whitelist);
            
            // Send invitation email
            String invitationLink = frontendUrl + "/admin/auth/accept-invitation?token=" + token;
            emailServicePort.sendAdminInvitationEmail(normalizedEmail, invitationLink);
        }
    }

    @Override
    @Transactional
    public StaffProfileResponse update(Long staffId, StaffProfileRequest request) {
        StaffProfile staff = getActiveById(staffId);
        validateUniqueOnUpdate(
                staffId,
                request.phoneNumber(),
                request.citizenId(),
                request.backupEmail(),
                staff.getEmail()
        );

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
            String trimmed = request.avatarUrl().isBlank() ? null : request.avatarUrl().trim();
            if (trimmed != null && !trimmed.equals(staff.getAvatarUrl())) {
                // Nếu staff đã được link với user, lưu luôn userId vào avatar_images
                createAvatarImageForStaff(trimmed, staff.getFullName(), staff.getUser());
            }
            staff.setAvatarUrl(trimmed);
            // Auto-generate alt image when avatar present (unless explicit altImage
            // provided).
            if (trimmed != null && request.altImage() == null) {
                staff.setAltImage("Ảnh đại diện " + (staff.getFullName() != null ? staff.getFullName() : "nhân viên"));
            } else if (trimmed == null && request.altImage() == null) {
                staff.setAltImage(null);
            }
        }
        if (request.altImage() != null) {
            staff.setAltImage(request.altImage().isBlank() ? null : request.altImage());
        }
        staff.setAddress(request.address());
        staff.setBankAccountNo(request.bankAccountNo());
        staff.setBankName(request.bankName());
        staff.setBackupEmail(request.backupEmail());
        if (request.positionId() != null) {
            StaffPosition position = staffPositionRepositoryPort.findById(request.positionId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy chức vụ với id: " + request.positionId()));
            staff.setPosition(position);
        } else {
            staff.setPosition(null);
        }
        if (request.secondaryPositionId() != null) {
            StaffPosition secondary = staffPositionRepositoryPort.findById(request.secondaryPositionId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy chức vụ phụ với id: " + request.secondaryPositionId()));
            staff.setSecondaryPosition(secondary);
        } else {
            staff.setSecondaryPosition(null);
        }
        staff.setEmploymentType(request.employmentType());

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
        user.setBackupEmail(profile.getBackupEmail());
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
    public StaffProfileResponse getByUserId(UUID userId) {
        return staffProfileRepositoryPort.findByUserId(userId)
                .filter(s -> !s.isDeleted() && s.isActive())
                .map(this::toResponse)
                .orElse(null); // Return null instead of throwing 404
    }

    @Override
    @Transactional
    public StaffProfileResponse updateRole(Long staffId, String roleName) {
        StaffProfile staff = getActiveById(staffId);
        if (staff.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhân viên chưa có tài khoản để cập nhật quyền.");
        }

        Role role = roleService.findByName(roleName);
        
        // Security check
        if (RoleEnum.ADMIN.name().equals(role.getName()) || RoleEnum.SUPER_ADMIN.name().equals(role.getName())) {
            User currentUser = authService.getCurrentUser();
            if (!RoleEnum.SUPER_ADMIN.name().equals(currentUser.getRole().getName())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Super Admin mới được phép cấp quyền Admin.");
            }
        }

        User user = staff.getUser();
        user.setRole(role);
        userRepositoryPort.save(user);

        // Update whitelist if exists
        adminGoogleWhitelistPort.findByEmail(staff.getEmail().toLowerCase().trim()).ifPresent(w -> {
            w.setRole(roleName);
            adminGoogleWhitelistPort.save(w);
        });

        return toResponse(staff);
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

    private void validateUniqueOnCreate(String email, String phoneNumber, String citizenId, String backupEmail) {
        if (email != null && !email.isBlank() && staffProfileRepositoryPort.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng: " + email);
        }
        if (phoneNumber != null && !phoneNumber.isBlank()
                && staffProfileRepositoryPort.existsByPhoneNumber(phoneNumber)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng: " + phoneNumber);
        }
        if (citizenId != null && !citizenId.isBlank() && staffProfileRepositoryPort.existsByCitizenId(citizenId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD/CMND đã được sử dụng: " + citizenId);
        }

        if (backupEmail != null && !backupEmail.isBlank()) {
            String normalizedBackup = backupEmail.trim().toLowerCase();

            // Không cho trùng với email chính ngay trên hồ sơ nhân viên mới tạo
            if (email != null && !email.isBlank()
                    && normalizedBackup.equals(email.trim().toLowerCase())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng không được trùng với email chính."
                );
            }

            // Không cho trùng email của bất kỳ user hoặc nhân viên nào khác
            if (userRepositoryPort.existsByEmail(backupEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
            if (staffProfileRepositoryPort.existsByEmail(backupEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
            if (staffProfileRepositoryPort.existsByBackupEmail(backupEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
        }
    }

    private void validateUniqueOnUpdate(Long staffId, String phoneNumber, String citizenId, String backupEmail, String currentEmail) {
        if (phoneNumber != null && !phoneNumber.isBlank()
                && staffProfileRepositoryPort.existsByPhoneNumberExcludingId(phoneNumber, staffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng: " + phoneNumber);
        }
        if (citizenId != null && !citizenId.isBlank()
                && staffProfileRepositoryPort.existsByCitizenIdExcludingId(citizenId, staffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD/CMND đã được sử dụng: " + citizenId);
        }

        if (backupEmail != null && !backupEmail.isBlank()) {
            String normalizedBackup = backupEmail.trim().toLowerCase();

            // Không cho trùng với email chính trên hồ sơ nhân viên
            if (currentEmail != null && !currentEmail.isBlank()
                    && normalizedBackup.equals(currentEmail.trim().toLowerCase())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng không được trùng với email chính."
                );
            }

            // Không cho trùng email của bất kỳ user hoặc nhân viên nào khác
            if (userRepositoryPort.existsByEmail(backupEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
            if (staffProfileRepositoryPort.existsByEmail(backupEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
            if (staffProfileRepositoryPort.existsByBackupEmailExcludingId(backupEmail, staffId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email dự phòng đã được sử dụng: " + backupEmail
                );
            }
        }
    }
    private StaffProfileResponse toResponse(StaffProfile staff) {
        User user = staff.getUser();
        StaffPosition position = staff.getPosition();
        String whitelistStatus = null;
        if (staff.getEmail() != null) {
            whitelistStatus = adminGoogleWhitelistPort.findByEmail(staff.getEmail().toLowerCase().trim())
                    .map(w -> w.getStatus())
                    .orElse(null);
        }

        StaffPosition secondaryPosition = staff.getSecondaryPosition();
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
                position != null ? position.getId() : null,
                position != null ? position.getCode() : null,
                position != null ? position.getName() : null,
                secondaryPosition != null ? secondaryPosition.getId() : null,
                secondaryPosition != null ? secondaryPosition.getName() : null,
                staff.getEmploymentType(),
                staff.getBackupEmail(),
                whitelistStatus,
                user != null && user.getRole() != null ? user.getRole().getName() : null,
                staff.isActive());
    }

}
