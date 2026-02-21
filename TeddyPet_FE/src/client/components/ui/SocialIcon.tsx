import { Link } from "react-router-dom";
import { Facebook, Instagram } from "iconoir-react";

export const SocialIcon = ({ facebookUrl = "#", instagramUrl = "#" }: { facebookUrl?: string, instagramUrl?: string }) => {
    const socialItems = [
        { icon: Instagram, to: instagramUrl },
        { icon: Facebook, to: facebookUrl }
    ];

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
