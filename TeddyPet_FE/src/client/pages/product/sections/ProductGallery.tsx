import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Thumbs } from 'swiper/modules';
import { Swiper as SwiperCore } from 'swiper';

const productImages = [
    { url: 'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg', alt: "" },
    { url: 'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg', alt: "" },
    { url: 'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10b-1000x1048.jpg', alt: "" },
    { url: 'https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/product-img-11cb-1000x1048.jpg', alt: "" },
];

export const ProductGallery = () => {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

    return (
        <div className="flex w-full gap-[20px] 2xl:gap-[12px] sticky top-0 h-[603px] 2xl:h-[522.75px]">
            <div className={`w-[135.5px] 2xl:w-[115.125px] h-full`}>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    direction="vertical"
                    modules={[FreeMode, Thumbs]}
                    spaceBetween={20}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    className="thumbs-slider-vertical w-full h-full"
                >
                    {productImages.map((image, index) => (
                        <SwiperSlide
                            key={index}
                            className="swiper-thumbnail-item border border-[#D7D7D7] cursor-pointer rounded-[10px] overflow-hidden p-[3px]"
                        >
                            <img
                                src={image.url}
                                alt={`Thumbnail ${image.alt}`}
                                className="w-full h-full object-cover rounded-[10px]"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            <div className={`w-[571px] h-[600px] 2xl:w-[499px] 2xl:h-[522.75px]`}>
                <Swiper
                    thumbs={{ swiper: thumbsSwiper }}
                    modules={[FreeMode, Thumbs]}
                    spaceBetween={10}
                    navigation={true}
                    className="main-slider-horizontal rounded-[10px] h-full border border-[#D7D7D7]"
                >
                    {productImages.map((image, index) => (
                        <SwiperSlide key={index} className="h-full">
                            <img
                                src={image.url}
                                alt={image.alt}
                                className="w-full h-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};