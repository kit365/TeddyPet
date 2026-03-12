interface Section3ItemData {
    text: string;
    icon: React.ElementType;
}

export const Section3Item = ({ text, icon: Icon }: Section3ItemData) => {
    return (
        <div className="p-[10px]">
            <div className="bg-white rounded-[40px] rounded-br-[8px] py-[20px] pl-[24px] pr-[60px] flex relative section-3-item">
                <div
                    className="text-client-secondary pl-[15px] relative 
           before:content-[''] before:absolute before:top-[10px] 
           before:left-0 before:w-[0.3125rem] before:h-[0.3125rem] 
           before:bg-client-secondary line-clamp-1"
                >
                    {text}
                </div>
                <div className="bg-[#FFF3E2] p-[8px] rounded-[50px] translate-x-[4px] -translate-y-[4px] absolute right-0 top-0">
                    <div className="w-[2.8125rem] h-[2.8125rem] bg-client-primary flex items-center justify-center rounded-full">
                        <Icon sx={{ color: "white", width: "1.625rem", height: "1.625rem" }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
