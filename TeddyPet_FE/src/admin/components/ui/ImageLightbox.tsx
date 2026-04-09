import { Dialog, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Swiper as SwiperCore } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

interface ImageLightboxProps {
    open: boolean;
    onClose: () => void;
    images: string[];
    startIndex?: number;
}

export const ImageLightbox = memo(({ open, onClose, images, startIndex = 0 }: ImageLightboxProps) => {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

    return (
        <Dialog
            maxWidth="md"
            fullWidth
            open={open}
            onClose={onClose}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(8px)',
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                },
            }}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(28, 37, 46, 0.98)',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    p: 2,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                },
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    color: 'white',
                    zIndex: 10,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' },
                }}
            >
                <CloseIcon />
            </IconButton>

            <Box sx={{ width: '100%', height: 'calc(100% - 100px)', display: 'flex', alignItems: 'center', position: 'relative', py: 1 }}>
                <Swiper
                    initialSlide={startIndex}
                    spaceBetween={20}
                    navigation={true}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    modules={[FreeMode, Navigation, Thumbs]}
                    style={{
                        width: '100%',
                        height: '60vh',
                        // @ts-ignore
                        '--swiper-navigation-color': '#fff',
                        '--swiper-navigation-size': '22px',
                    }}
                >
                    {images.map((img, index) => (
                        <SwiperSlide key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={img}
                                alt={`View ${index}`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Box>

            <Box sx={{ width: '100%', height: '80px', mt: 1, px: 2 }}>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    initialSlide={startIndex}
                    spaceBetween={10}
                    slidesPerView={'auto'}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="thumbs-swiper"
                    style={{ height: '100%' }}
                >
                    {images.map((img, index) => (
                        <SwiperSlide 
                            key={index} 
                            style={{ width: '64px', height: '64px', opacity: 0.4, cursor: 'pointer' }}
                            className="swiper-slide-thumb"
                        >
                            <Box
                                component="img"
                                src={img}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    border: '2px solid transparent',
                                    transition: 'border-color 0.2s ease',
                                    '.swiper-slide-thumb-active &': {
                                        borderColor: 'primary.main',
                                        opacity: 1,
                                    },
                                }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Box>

            <style>{`
                .swiper-button-prev, .swiper-button-next {
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(4px);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                .swiper-button-prev:hover, .swiper-button-next:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
                .swiper-button-prev::after, .swiper-button-next::after {
                    font-size: 16px !important;
                }
                .swiper-slide-thumb-active {
                    opacity: 1 !important;
                }
                .thumbs-swiper .swiper-slide {
                    width: 64px !important;
                }
            `}</style>
        </Dialog>
    );
});
