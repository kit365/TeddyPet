import { useQuery } from "@tanstack/react-query";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
    getNoShowPublicByServiceId,
    type NoShowPublicClientResponse,
} from "../../../../api/noShowPublic.api";

function buildNoShowLines(cfg: NoShowPublicClientResponse): string[] {
    const lines: string[] = [];
    lines.push(
        "Quý khách vui lòng đến đúng giờ hẹn để không ảnh hưởng lịch phục vụ và các quy định của shop."
    );
    if (cfg.gracePeriodMinutes != null && cfg.gracePeriodMinutes > 0) {
        lines.push(
            `• Sau giờ hẹn, quý khách có thêm ${cfg.gracePeriodMinutes} phút (thời gian chờ) trước khi ca được coi là không đến (no-show).`
        );
    }
    if (cfg.allowLateCheckin && cfg.lateCheckinMinutes != null && cfg.lateCheckinMinutes > 0) {
        lines.push(
            `• Shop cho phép check-in muộn tối đa ${cfg.lateCheckinMinutes} phút sau giờ hẹn (vẫn được coi là đến).`
        );
    }
    const pen = Number(cfg.penaltyAmount ?? 0);
    if (pen > 0) {
        lines.push(
            `• Trường hợp no-show có thể phát sinh phạt bổ sung ${pen.toLocaleString("vi-VN")}đ (theo quy định của shop).`
        );
    }
    return lines;
}

type Props = {
    /** Đã chọn ngày gửi (YYYY-MM-DD) */
    globalDateFrom: string;
    /** Dịch vụ chính đã chọn */
    serviceId?: number | null;
};

/**
 * Hiển thị quy định no-show khi khách đã chọn ngày gửi + dịch vụ (nếu dịch vụ có gán cấu hình).
 */
export function BookingNoShowNotice({ globalDateFrom, serviceId }: Props) {
    const sid = serviceId ?? undefined;
    const show = Boolean(globalDateFrom?.trim() && sid && sid > 0);

    const { data, isLoading } = useQuery({
        queryKey: ["no-show-public", sid],
        queryFn: () => getNoShowPublicByServiceId(sid!),
        enabled: show,
        staleTime: 60_000,
    });

    if (!show) return null;
    if (isLoading) return null;

    const cfg = data?.data ?? null;
    if (!cfg) return null;

    const title = cfg.name?.trim() ? `Lưu ý no-show — ${cfg.name}` : "Lưu ý về đúng giờ (no-show)";
    const lines = buildNoShowLines(cfg);

    return (
        <div
            className="mt-3 rounded-[12px] border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-[0.8438rem] leading-relaxed text-[#5c4a2a]"
            role="status"
        >
            <div className="flex gap-2">
                <InfoOutlinedIcon sx={{ fontSize: 22, color: "#b45309", flexShrink: 0, mt: "2px" }} />
                <div className="min-w-0 space-y-2">
                    <p className="font-[700] text-[#92400e]">{title}</p>
                    {lines.map((line, i) => (
                        <p key={i} className={line.startsWith("•") ? "text-[#78350f]" : "text-[#78350f]"}>
                            {line}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}
