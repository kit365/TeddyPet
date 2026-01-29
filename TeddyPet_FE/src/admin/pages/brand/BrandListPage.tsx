import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { BrandList } from "./sections/BrandList";

export const BrandListPage = () => {
    return (
        <>
            <ListHeader
                title="Thương hiệu"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Thương hiệu", to: `/${prefixAdmin}/brand/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Thêm thương hiệu"
                addButtonPath={`/${prefixAdmin}/brand/create`}
            />

            <BrandList />
        </>
    )
}
