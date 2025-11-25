import { UnitCategory } from '../../enums/UnitEnum';

export interface UnitResponse {
  code: string;
  label: string;
  symbol: string;
  category: UnitCategory;
}
