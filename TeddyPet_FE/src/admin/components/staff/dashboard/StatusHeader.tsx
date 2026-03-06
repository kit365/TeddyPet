import type { EmployeeUser } from "../../../types/employeeDashboard";

interface Props {
    user: EmployeeUser;
    onCheckIn: () => void;
    onCheckOut: () => void;
    isCheckingIn?: boolean;
}

const STATUS_CONFIG: Record<
    EmployeeUser["globalStatus"],
    { label: string; badgeClass: string; dotClass: string }
> = {
    READY: {
        label: "Sẵn sàng",
        badgeClass: "bg-emerald-50 text-emerald-700",
        dotClass: "bg-emerald-500",
    },
    BUSY: {
        label: "Đang làm việc",
        badgeClass: "bg-orange-50 text-orange-700",
        dotClass: "bg-orange-500",
    },
    OFF: {
        label: "Nghỉ",
        badgeClass: "bg-slate-100 text-slate-600",
        dotClass: "bg-slate-400",
    },
};

export const StatusHeader = ({ user, onCheckIn, onCheckOut, isCheckingIn }: Props) => {
    const status = STATUS_CONFIG[user.globalStatus];
    const roleLabel =
        user.positionName && user.positionName.trim().length > 0
            ? user.positionName
            : user.role === "CARE"
            ? "Nhân viên chăm sóc"
            : "Nhân viên Spa";

    return (
        <section className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 shadow-sm md:px-7 md:py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
                <div className="relative rounded-full bg-white/60 p-[3px] shadow-sm">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-emerald-500 text-white flex items-center justify-center text-base font-semibold">
                        {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.avatarUrl}
                                alt={user.fullName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            user.fullName.charAt(0)
                        )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-50 ${status.dotClass}`} />
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500">Xin chào,</p>
                    <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {roleLabel} •{" "}
                        {user.employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${status.badgeClass}`}
                >
                    <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                    <span>Trạng thái: {status.label}</span>
                </div>

                <div className="flex gap-2">
                    {!user.todayCheckedIn ? (
                        <button
                            type="button"
                            onClick={onCheckIn}
                            disabled={isCheckingIn}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                        >
                            Check-in
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                            >
                                Đã check-in
                            </button>
                            <button
                                type="button"
                                onClick={onCheckOut}
                                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/70"
                            >
                                Check-out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

