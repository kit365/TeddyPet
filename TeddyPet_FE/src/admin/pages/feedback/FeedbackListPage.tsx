import { ListHeader } from "../../components/ui/ListHeader";
import { FeedbackList } from "./sections/FeedbackList";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const FeedbackListPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col">
            <ListHeader
                title="Quản lý đánh giá"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: "Đánh giá", to: `/${prefixAdmin}/feedback/list` },
                    { label: t("admin.common.list") }
                ]}
            />
            <div className="mt-[32px]">
                <FeedbackList />
            </div>
        </div>
    )
}
