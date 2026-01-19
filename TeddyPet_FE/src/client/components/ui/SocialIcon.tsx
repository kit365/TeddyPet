import { Link } from "react-router-dom";
import { Facebook, Instagram } from "iconoir-react";

const socialItems = [
    { icon: Instagram, to: "/" },
    { icon: Facebook, to: "/" }
];

export const SocialIcon = () => {
    return (
        <ul className="flex gap-[10px]">
            {socialItems.map(({ icon: Icon, to }, index) => (
                <li
                    key={index}
                    className="w-[36px] h-[36px] bg-client-secondary text-white p-[10px] 
                     rounded-[10px] flex items-center justify-center cursor-pointer 
                     hover:text-client-secondary hover:bg-white transition-default"
                >
                    <Link to={to}>
                        <Icon strokeWidth={2} className="w-[1.6rem] h-[1.6rem]" />
                    </Link>
                </li>
            ))}
        </ul>
    );
};
