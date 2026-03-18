import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { UserList } from "./sections/UserList";

export const UserListPage = () => {
    return (
        <div className="flex flex-col gap-[16px]">
            <ListHeader
                title="Người dùng"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Người dùng", to: `/${prefixAdmin}/user/list` },
                    { label: "Danh sách" }
                ]}
                addButtonLabel="Tạo tài khoản"
                addButtonPath={`/${prefixAdmin}/user/create`}
            />
            <UserList />
        </div>
    )
}
