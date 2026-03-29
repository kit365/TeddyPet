package fpt.teddypet.application.port.input.auth;

import fpt.teddypet.application.dto.response.auth.StaffPasswordReissuePreviewResponse;
import fpt.teddypet.application.dto.response.auth.StaffReissueRequestOutcome;

public interface StaffPasswordReissueService {

    StaffReissueRequestOutcome requestReissue(String usernameOrEmail);

    StaffPasswordReissuePreviewResponse previewForAdmin(String rawToken);

    void confirmReissue(String rawToken);
}
