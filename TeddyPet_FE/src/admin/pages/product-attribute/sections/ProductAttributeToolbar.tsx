import { Toolbar } from "@mui/material";
import { Search } from "../../../components/ui/Search";
import { toolbarStyles } from "../configs/styles.config";

export const ProductAttributeToolbar = () => {
    return (
        <Toolbar style={toolbarStyles.root}>
            <div className='flex gap-[16px] w-full'>
                <div className="flex items-center gap-[16px] flex-1">
                    <div className="flex-1 min-w-0">
                        <Search maxWidth="100%" />
                    </div>
                </div>
            </div>
        </Toolbar>
    );
};
