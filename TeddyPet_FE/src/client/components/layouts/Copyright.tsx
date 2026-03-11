import { Link } from "react-router-dom"

export const Copyright = () => {
    return (
        <section
            className="relative px-[30px]"
            style={{
                backgroundImage: "url('https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/h1-slider-bg-img.jpg')"
            }}
        >
            <div className="app-container flex justify-between py-[10px]">
                <p className="text-white">
                    © 2025
                    <Link to="/" className="hover:text-client-secondary transition-[color] duration-300 ease-linear"> teddypet </Link>
                    | Design by
                    <Link to="/" className="hover:text-client-secondary transition-[color] duration-300 ease-linear"> TeddyPet Team </Link>
                </p>
                <span className="text-white">
                    <Link to="/" className="hover:text-client-secondary transition-[color] duration-300 ease-linear">Privacy & Cookies</Link>
                    &nbsp; |&nbsp;
                    <Link to="/" className="hover:text-client-secondary transition-[color] duration-300 ease-linear">Terms of services</Link>
                </span>
            </div>
        </section>
    )
}