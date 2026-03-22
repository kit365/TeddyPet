package fpt.teddypet.domain.enums.banks;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public enum VietnamBankEnum {
    // Popular Vietnam banks (code aligns with common usage)
    VCB("VCB", "Vietcombank"),
    BIDV("BIDV", "BIDV"),
    CTG("CTG", "VietinBank"),
    ACB("ACB", "ACB"),
    TCB("TCB", "Techcombank"),
    MBB("MBB", "MB Bank"),
    VPB("VPB", "VPBank"),
    TPB("TPB", "TPBank"),
    SHB("SHB", "SHB"),
    STB("STB", "Sacombank"),
    VIB("VIB", "VIB"),
    HDB("HDB", "HDBank"),
    EIB("EIB", "Eximbank"),
    OCB("OCB", "OCB"),
    MSB("MSB", "MSB"),
    SCB("SCB", "SCB"),
    SGB("SGB", "Saigonbank"),
    BVB("BVB", "BaoViet Bank"),
    KLB("KLB", "KienlongBank"),
    ABB("ABB", "ABBank"),
    SEAB("SEAB", "SeABank"),
    PGB("PGB", "PG Bank"),
    NCB("NCB", "NCB"),
    IVB("IVB", "Indovina Bank"),
    VRB("VRB", "VRB"),
    UOB("UOB", "UOB Vietnam"),
    HSBC("HSBC", "HSBC Vietnam"),
    SCVN("SCVN", "Standard Chartered Vietnam");

    private final String bankCode;
    private final String bankName;

    VietnamBankEnum(String bankCode, String bankName) {
        this.bankCode = bankCode;
        this.bankName = bankName;
    }

    public String getBankCode() {
        return bankCode;
    }

    public String getBankName() {
        return bankName;
    }

    public static List<VietnamBankEnum> valuesList() {
        return Arrays.asList(values());
    }

    /**
     * Mã BIN Napas / VietQR (api.vietqr.io) → enum. FE trang TK ngân hàng gửi {@code shortName}/BIN, không phải VCB/BIDV...
     */
    private static final Map<String, VietnamBankEnum> BY_BIN = new HashMap<>();

    static {
        // BIN 6 số phổ biến (Napas / VietQR)
        BY_BIN.put("970436", VCB);
        BY_BIN.put("970418", BIDV);
        BY_BIN.put("970415", CTG);
        BY_BIN.put("970407", TCB);
        BY_BIN.put("970422", MBB);
        BY_BIN.put("970416", ACB);
        BY_BIN.put("970432", VPB);
        BY_BIN.put("970423", TPB);
        BY_BIN.put("970403", STB);
        BY_BIN.put("970437", HDB);
        BY_BIN.put("970431", EIB);
        BY_BIN.put("970441", VIB);
        BY_BIN.put("970443", SHB);
        BY_BIN.put("970448", OCB);
        BY_BIN.put("970426", MSB);
        BY_BIN.put("970429", SCB);
        BY_BIN.put("970400", SGB);
        BY_BIN.put("970438", BVB);
        BY_BIN.put("970452", KLB);
        BY_BIN.put("970425", ABB);
        BY_BIN.put("970440", SEAB);
        BY_BIN.put("970430", PGB);
        BY_BIN.put("970419", NCB);
        BY_BIN.put("970434", IVB);
        BY_BIN.put("970421", VRB);
        BY_BIN.put("970458", UOB);
        BY_BIN.put("970442", HSBC);
        BY_BIN.put("970410", SCVN);
    }

    private static String normalizeKey(String raw) {
        if (raw == null) {
            return "";
        }
        String n = Normalizer.normalize(raw.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return n.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
    }

    public static Optional<VietnamBankEnum> fromCode(String code) {
        if (code == null) {
            return Optional.empty();
        }
        String c = code.trim();
        if (c.isEmpty()) {
            return Optional.empty();
        }
        // 1) Mã nội bộ: VCB, BIDV, ...
        Optional<VietnamBankEnum> byShort = valuesList().stream()
                .filter(b -> b.bankCode.equalsIgnoreCase(c))
                .findFirst();
        if (byShort.isPresent()) {
            return byShort;
        }
        // 2) BIN VietQR / Napas (chỉ số, thường 6 ký tự)
        String digits = c.replaceAll("\\D", "");
        if (digits.length() >= 6) {
            VietnamBankEnum byBin = BY_BIN.get(digits.substring(0, 6));
            if (byBin != null) {
                return Optional.of(byBin);
            }
        }
        // 3) Khớp tên hiển thị / shortName từ VietQR (vd: "Vietcombank", "MB Bank")
        String key = normalizeKey(c);
        if (!key.isEmpty()) {
            for (VietnamBankEnum b : values()) {
                if (normalizeKey(b.bankCode).equals(key)) {
                    return Optional.of(b);
                }
                if (normalizeKey(b.bankName).equals(key)) {
                    return Optional.of(b);
                }
            }
        }
        return Optional.empty();
    }
}

