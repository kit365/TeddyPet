import { BookingPage } from "../../../client/pages/booking/Booking";
import { prefixAdmin } from "../../constants/routes";

export const BookingCreatePage = () => {
  return <BookingPage mode="admin" nextPath={`/${prefixAdmin}/booking/create/detail`} />;
};

