import { useNavigate } from "react-router-dom";
import { ProductList } from "./sections/ProductList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const ProductListPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title={t("admin.product.title.list")}
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: "/" },
                    { label: t("admin.product.title.list") }
                ]}
                addButtonLabel={t("admin.product.title.create")}
                addButtonPath={`/${prefixAdmin}/product/create`}
            />

            <ProductList />
        </div>
    );
};