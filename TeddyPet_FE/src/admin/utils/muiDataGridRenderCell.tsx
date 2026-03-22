import type { ReactElement, ReactNode } from "react";
import type { GridRenderCellParams } from "@mui/x-data-grid";

/**
 * MUI X DataGrid gọi `renderCell` dạng `column.renderCell(params)` (hàm thuần), không phải
 * `<Column />`. Các ô dùng hook (useContext/useNavigate/useTranslation/...) phải trả về
 * element để React mount đúng một function component.
 */
export function mountGridCell(
  Cell: (params: GridRenderCellParams) => ReactNode
): (params: GridRenderCellParams) => ReactElement {
  return (params) => <Cell {...params} />;
}
