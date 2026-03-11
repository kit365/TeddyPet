package fpt.teddypet.domain.enums.banks;

import java.util.Arrays;
import java.util.List;
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

    public static Optional<VietnamBankEnum> fromCode(String code) {
        if (code == null) return Optional.empty();
        String c = code.trim();
        if (c.isEmpty()) return Optional.empty();
        return valuesList().stream().filter(b -> b.bankCode.equalsIgnoreCase(c)).findFirst();
    }
}

