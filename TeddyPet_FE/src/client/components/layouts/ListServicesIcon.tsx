const data = [
    {
        url: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-01.png",
        title: "Chăm sóc mèo",
    },
    {
        url: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-04.png",
        title: "Vật dụng thú cưng",
    },
    {
        url: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-08.png",
        title: "Chăm sóc chó",
    },
    {
        url: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/service-png-img-alt-09.png",
        title: "Vận chuyển an toàn",
    },
]

export const ListServicesIcon = () => {
    return (
        <div className="flex items-center">
            {data.map((item, idx) => (
                <div
                    key={idx}
                    className="w-[245px] mr-[20px]"
                >
                    <div className="flex items-center justify-center mb-[15px]">
                        <img
                            src={item.url}
                            alt={item.title}
                        />
                    </div>
                    <div className="text-client-secondary text-[0.9375rem] text-center">
                        {item.title}
                    </div>
                </div>
            ))}
        </div>
    )
}