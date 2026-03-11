import { useNavigate } from "react-router-dom";
import { BrandList } from "./sections/BrandList";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";

export const BrandListPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Thương hiệu"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Sản phẩm", to: `/${prefixAdmin}/product/list` },
                    { label: "Thương hiệu" }
                ]}
                addButtonLabel="Thêm thương hiệu"
                addButtonPath={`/${prefixAdmin}/brand/create`}
            />

            <BrandList />
        </div>
    );
};
