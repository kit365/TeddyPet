package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.AdminGoogleWhitelist;

import java.util.List;
import java.util.Optional;

public interface AdminGoogleWhitelistPort {
    Optional<AdminGoogleWhitelist> findByEmail(String email);
    Optional<AdminGoogleWhitelist> findByToken(String token);
    List<AdminGoogleWhitelist> findAll();
    AdminGoogleWhitelist save(AdminGoogleWhitelist whitelist);
    void delete(String email);
}
