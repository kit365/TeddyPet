import { FooterSub } from "../../components/layouts/FooterSub";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicBlogs } from "../../../api/blog.api";
import dayjs from "dayjs";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Bài viết", to: "/blogs" },
];

export const BlogListPage = () => {
    const { data: blogsRes, isLoading } = useQuery({
        queryKey: ['public-blogs'],
        queryFn: getPublicBlogs
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client-primary"></div>
            </div>
        );
    }

    const blogsData = blogsRes?.data;
    let blogs: any[] = [];

    if (Array.isArray(blogsData)) {
        blogs = blogsData;
    } else if (blogsData && typeof blogsData === 'object' && 'content' in blogsData && Array.isArray(blogsData.content)) {
        blogs = blogsData.content;
    }

    return (
        <>
            <ProductBanner pageTitle="Bài viết" breadcrumbs={breadcrumbs} url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-blog-listing.jpg" />
            <section className="relative px-[30px] bg-white">
                <div className="app-container grid grid-cols-3 gap-[30px] relative">
                    {blogs.map((blog: any) => (
                        <div key={blog.id} className="bg-[#e67e2026] rounded-[20px] overflow-hidden product-item transition-all duration-300 ease-linear hover:bg-client-primary group">
                            <div className="p-[20px]">
                                <Link to={`/blog/detail/${blog.slug}`} className="block relative rounded-[20px] overflow-hidden aspect-[1520/800]">
                                    <img
                                        className="primary-image z-[10]-item w-full h-full object-cover rounded-[20px] transition-opacity duration-700 opacity-100 cursor-pointer"
                                        src={blog.featuredImage || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/Aristocraticpet.jpg"}
                                        alt={blog.title}
                                    />
                                    <div className="date-blog absolute z-[20] top-[5%] left-[2%] bg-client-primary transition-default py-[10px] px-[16px] text-[1.125rem] leading-[1.2] text-white w-[65px] font-secondary text-center group-hover:bg-[#F7F3EB] group-hover:text-client-secondary">
                                        {dayjs(blog.createdAt).locale('en').format('DD MMM')}
                                    </div>
                                </Link>
                            </div>

                            <div className="grid grid-cols-[1fr_auto] gap-[10px]">
                                <div className="pl-[25px]">
                                    <Link
                                        to={`/blog/detail/${blog.slug}`}
                                        className="inline-block text-client-secondary text-[1.375rem] font-secondary leading-[1.4] transition-default ease-in-out group-hover:text-white hover:opacity-90 mb-[10px]"
                                    >
                                        {blog.title}
                                    </Link>
                                    <p className="line-clamp-2 text-client-text group-hover:text-white transition-default ease-in-out">{blog.expert || blog.excerpt || blog.description}</p>
                                </div>

                                {/* Button */}
                                <div className="mt-[15px]">
                                    <div className="mt-[53px]">
                                        <div className="w-[4.375rem] h-[4.375rem] pt-[10px] pl-[10px] relative rounded-tl-[30px] bg-white cart-button">
                                            <Link to={`/blog/detail/${blog.slug}`} className="w-[3.75rem] h-[3.75rem] rounded-full bg-client-primary text-white flex items-center justify-center duration-[375ms] ease-[cubic-bezier(0.7,0,0.3,1)] group-hover:bg-client-secondary">
                                                <button className="button-watch-more-section-2 w-[50%] cursor-pointer aspect-square flex items-center justify-center  rounded-full">
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <ul className="flex items-center mt-[65px] 2xl:mt-[40px] justify-center gap-[11px] pb-[150px] 2xl:pb-[120px]">
                    <li className="flex items-center cursor-pointer justify-center bg-client-secondary text-white rounded-full w-[2.8125rem] h-[2.8125rem]">1</li>
                    <li className="flex items-center cursor-pointer justify-center bg-client-primary hover:bg-client-secondary transition-default text-white rounded-full w-[2.8125rem] h-[2.8125rem]">2</li>
                    <div className="w-[2.8125rem] h-[2.8125rem] rounded-full bg-client-primary hover:bg-client-secondary cursor-pointer transition-default flex items-center justify-center next-button"></div>
                </ul>
            </section>
            <FooterSub />
        </>
    )
}
