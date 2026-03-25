import { Link } from "react-router-dom";
import { SocialIconCircle } from "../ui/SocialIconsCircle";
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';
import { useState, useEffect } from "react";
import { getAllSettings } from "../../../admin/api/setting.api";
import { APP_SETTING_KEYS } from "../../../admin/constants/settings";
import { subscribeNewsletter } from "../../../api/newsletter.api";
import { toast } from "react-toastify";


export const MainFooter = () => {
    const [shopAddress, setShopAddress] = useState<string>('99/45, Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, Ho Chi Minh City, Vietnam');
    const [shopPhone, setShopPhone] = useState<string>('096 768 13 28');
    const [shopEmail, setShopEmail] = useState<string>('teddypetfpt@gmail.com');
    const [shopWebsite, setShopWebsite] = useState<string>('teddypet.fpt.edu.vn');
    const [facebookUrl, setFacebookUrl] = useState<string>('#');
    const [instagramUrl, setInstagramUrl] = useState<string>('#');

    useEffect(() => {
        const fetchShopSettings = async () => {
            try {
                const response = await getAllSettings();
                if (response.success && response.data) {
                    const settings = response.data;
                    const address = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue;
                    const phone = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_PHONE)?.settingValue;
                    const email = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_EMAIL)?.settingValue;
                    const website = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_WEBSITE)?.settingValue;
                    const facebook = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_FACEBOOK)?.settingValue;
                    const instagram = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_INSTAGRAM)?.settingValue;

                    if (address) setShopAddress(address);
                    if (phone) setShopPhone(phone);
                    if (email) setShopEmail(email);
                    if (website) setShopWebsite(website);
                    if (facebook) setFacebookUrl(facebook);
                    if (instagram) setInstagramUrl(instagram);
                }
            } catch (error) {
                console.error("Error fetching shop settings for footer:", error);
            }
        };

        fetchShopSettings();
    }, []);


    return (
        <>
            <footer className="bg-[#FFF0F0]">
                <div className="relative px-[30px] pt-[120px]">
                    <div className="app-container">
                        <div className="px-[30px] gap-[20px] flex items-end w-full">
                            <div className="w-[22%] px-[30px] relative">
                                <img width={400} height={270} src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-cats-walking-300x203.png" className="object-cover w-full h-auto mb-[-80px]" alt="" />
                            </div>
                            <div className="w-[54%] flex flex-col gap-[30px]">
                                <SocialIconCircle className="justify-center" facebookUrl={facebookUrl} instagramUrl={instagramUrl} />
                            </div>
                            <div className="w-[22%] px-[30px] relative">
                                <img width={400} height={270} src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-dogs-walking-300x203.png" className="object-cover w-full h-auto mb-[-80px]" alt="" />
                            </div>
                        </div>
                    </div>
                    <div className="app-container 2xl:max-w-[1520px]">
                        <div className="pt-[50px] pb-[70px]">
                            <img width={1920} height={100} className="w-full h-auto object-cover" src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/footer-1-img.png" />
                        </div>
                    </div>
                    <div className="app-container 2xl:max-w-[1520px]">
                        <div className="px-[50px] 2xl:px-[80px] pb-[100px] 2xl:pb-[80px] flex gap-[80px]">
                            <div className="w-[25%]">
                                <h3 className="text-client-secondary mb-[20px] font-secondary text-[1.5rem] capitalize">Nhận hỗ trợ</h3>
                                <ul className="flex flex-col gap-[20px]">
                                    <li className="flex">
                                        <HomeIcon className="text-client-text" style={{ fontSize: "1.375rem" }} />
                                        <span className="pl-[8px] text-client-text text-[1.0625rem] cursor-pointer">
                                            {shopAddress}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <PhoneIcon className="text-client-text" style={{ fontSize: "1.375rem" }} />
                                        <span className="pl-[8px] text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                            {shopPhone}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <EmailIcon className="text-client-text" style={{ fontSize: "1.375rem" }} />
                                        <span className="pl-[8px] text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                            {shopEmail}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <LanguageIcon className="text-client-text" style={{ fontSize: "1.375rem" }} />
                                        <span className="pl-[8px] text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                            <Link to={shopWebsite.startsWith('http') ? shopWebsite : `https://${shopWebsite}`}>{shopWebsite}</Link>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="w-[18%]">
                                <h3 className="text-client-secondary mb-[20px] font-secondary text-[1.5rem] capitalize">Trợ giúp</h3>
                                <ul className="flex flex-col gap-[20px]">
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Theo Dõi Đơn Hàng</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Câu Hỏi Thường Gặp</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Tài Khoản Của Tôi</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Đơn Hàng Của Bạn</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Bảng Giá / Dịch Vụ</Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="w-[18%]">
                                <h3 className="text-client-secondary mb-[20px] font-secondary text-[1.5rem] capitalize">Về Chúng Tôi</h3>
                                <ul className="flex flex-col gap-[20px]">
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Tin Tức</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Dịch Vụ</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Câu Chuyện Chúng Tôi</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Liên Hệ</Link>
                                    </li>
                                    <li className="text-client-text text-[1.0625rem] hover:text-client-primary transition-default cursor-pointer">
                                        <Link to="#">Địa Chỉ Cửa Hàng</Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="w-[39%]">
                                <h3 className="text-client-secondary mb-[20px] font-secondary text-[1.5rem] capitalize">Nhận thông tin mới nhất</h3>
                                <div className="flex flex-col gap-[35px]">
                                    <p className="text-client-text text-[1.0625rem] pr-[5%]">Cập nhật tin tức sản phẩm, bí quyết chăm sóc và làm đẹp độc quyền dành cho thú cưng.</p>
                                    <Link to="/newsletter" className="inline-block w-fit py-[14px] px-[32px] rounded-[35px] bg-client-secondary hover:bg-client-primary text-white text-[0.875rem] font-secondary transition-default">
                                        Đăng ký nhận tin ngay
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}