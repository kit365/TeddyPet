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
        <section className="mb-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 px-5 py-4 shadow-sm md:px-6 md:py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
                <div className="relative rounded-full bg-white p-[2px] shadow-sm border border-emerald-100">
                    <div className="h-11 w-11 overflow-hidden rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
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
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Nhân viên trực</p>
                    <p className="text-base font-bold text-slate-900 leading-tight">{user.fullName}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-tighter">
                        {roleLabel} • {user.employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${status.badgeClass}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                    <span>{status.label}</span>
                </div>

                <div className="flex gap-2">
                    {!user.todayCheckedIn ? (
                        <button
                            type="button"
                            onClick={onCheckIn}
                            disabled={isCheckingIn}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                        >
                            Điểm danh
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-100/50 px-4 py-1.5 text-xs font-bold text-emerald-700"
                            >
                                Đã điểm danh
                            </button>
                            <button
                                type="button"
                                onClick={onCheckOut}
                                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-white hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                            >
                                Ra ca
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

