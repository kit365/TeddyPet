import { Toolbar } from "@mui/material";
import { SelectMulti } from "../../../components/ui/SelectMulti";
import { Search } from "../../../components/ui/Search";
import { STATUS_OPTIONS } from "../configs/constants";
import { toolbarStyles } from "../configs/styles.config";

export const BlogCategoryToolbar = () => {
    return (
        <Toolbar style={toolbarStyles.root}>
            <div className='flex gap-[16px] w-full'>
                <SelectMulti label="Trạng thái" options={STATUS_OPTIONS} />
                <div className="flex items-center gap-[16px] flex-1">
                    <div className="flex-1 min-w-0">
                        <Search maxWidth="100%" />
                    </div>
                </div>
            </div>
        </Toolbar>
    );
};
