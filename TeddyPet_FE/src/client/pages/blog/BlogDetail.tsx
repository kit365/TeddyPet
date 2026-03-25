import { Link, useParams } from "react-router-dom";
import { ListServicesIcon } from "../../components/layouts/ListServicesIcon";
import { ProductBanner } from "../product/sections/ProductBanner"
import { SocialIcon } from "../../components/ui/SocialIcon";
import { FooterSub } from "../../components/layouts/FooterSub";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicBlogBySlug, getPublicBlogs } from "../../../api/blog.api";
import { getBlogComments, createBlogComment } from "../../../api/blogComment.api";
import SearchIcon from "@mui/icons-material/Search";
import { ProductAsideTitle } from "../product/sections/ProductAsideTitle";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import 'dayjs/locale/vi';

const filterTags = [
    {
        title: "Xương gà",
        url: "/san-pham-the/xuong-ga",
    },
    {
        title: "Xương chó",
        url: "/san-pham-the/xuong-cho",
    },
    {
        title: "Nệm ấm",
        url: "/san-pham-the/nem-am",
    },
    {
        title: "Thẻ tên",
        url: "/san-pham-the/the-ten",
    },
    {
        title: "Dinh dưỡng chim",
        url: "/san-pham-the/dinh-duong-chim",
    },
    {
        title: "Đồ chơi tạ",
        url: "/san-pham-the/do-choi-ta",
    },
    {
        title: "Thức ăn",
        url: "/san-pham-the/thuc-an",
    },
    {
        title: "Lồng Hamster",
        url: "/san-pham-the/long-hamster",
    },
    {
        title: "Thức ăn mèo con",
        url: "/san-pham-the/thuc-an-meo-con",
    },
    {
        title: "Phụ kiện",
        url: "/san-pham-the/phu-kien",
    },
    {
        title: "Đồ dùng cần thiết",
        url: "/san-pham-the/do-dung-can-thiet",
    },
    {
        title: "Chó con",
        url: "/san-pham-the/cho-con",
    },
    {
        title: "Đồ nhai cho chó con",
        url: "/san-pham-the/do-nhai-cho-cho-con",
    },
    {
        title: "Thức ăn vặt",
        url: "/san-pham-the/thuc-an-vat",
    },
];

export const BlogDetailPage = () => {
    const { slug } = useParams();

    const { data: detailRes, isLoading } = useQuery({
        queryKey: ['blog', slug],
        queryFn: () => getPublicBlogBySlug(slug!),
        enabled: !!slug,
    });

    const { data: blogsRes } = useQuery({
        queryKey: ['public-blogs'],
        queryFn: getPublicBlogs
    });

    const blog = detailRes?.data;
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    
    const [commentData, setCommentData] = useState({
        content: "",
        guestName: "",
        guestEmail: ""
    });

    const { data: commentsRes } = useQuery({
        queryKey: ['blog-comments', blog?.id],
        queryFn: () => getBlogComments(blog!.id),
        enabled: !!blog?.id
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => createBlogComment(data),
        onSuccess: () => {
            toast.success("Đã gửi bình luận thành công!");
            setCommentData({ content: "", guestName: "", guestEmail: "" });
            queryClient.invalidateQueries({ queryKey: ['blog-comments', blog?.id] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Gửi bình luận thất bại.");
        }
    });

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentData.content.trim()) {
            toast.warn("Vui lòng nhập nội dung bình luận.");
            return;
        }
        if (!user && (!commentData.guestName.trim() || !commentData.guestEmail.trim())) {
            toast.warn("Vui lòng nhập tên và email của bạn.");
            return;
        }

        createMutation.mutate({
            blogPostId: blog!.id,
            content: commentData.content,
            guestName: user ? undefined : commentData.guestName,
            guestEmail: user ? undefined : commentData.guestEmail
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client-primary"></div>
            </div>
        );
    }

    // Process recent blogs
    let recentBlogs: any[] = [];
    const blogsData = blogsRes?.data;
    if (Array.isArray(blogsData)) {
        recentBlogs = blogsData;
    } else if (blogsData && typeof blogsData === 'object' && 'content' in blogsData && Array.isArray(blogsData.content)) {
        recentBlogs = blogsData.content;
    }

    // Filter out current blog
    if (blog) {
        recentBlogs = recentBlogs.filter(b => b.id !== blog.id);
    }

    if (!blog) {
        return (
            <div className="text-center py-20 text-[1.25rem]">
                Không tìm thấy bài viết
            </div>
        );
    }

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Bài viết", to: "/blogs" },
        { label: blog?.title, to: `/blog/detail/${blog?.slug}` },
    ];


    const content = blog.description || blog.content || "";
    const introText = blog.expert || blog.excerpt || "";

    return (
        <>
            <ProductBanner
                pageTitle="Bài viết"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />
            <section className="relative px-[30px] bg-white">
                <div className="app-container flex relative">
                    <section className="w-[1040px] mr-[80px]">
                        <article className="mb-[150px] relative w-full">
                            {/* Images + Date */}
                            <img
                                width={1040}
                                height={547}
                                className="w-full h-[547px] object-cover rounded-[20px] object-top"
                                src={blog.featuredImage}
                                alt={blog.title}
                            />
                            <div className="absolute top-0">
                                <div className="relative entry-date-format mb-[20px] w-[70px] pr-[10px] pb-[10px] bg-white text-white text-[1.375rem] rounded-br-[20px] text-center font-[600] leading-[1.1]">
                                    <div className="post-entry-date">18 Jun</div>
                                </div>
                            </div>

                            {/* Title + Mô tả ngắn */}
                            <div className="my-[60px]">
                                <h3 className="leading-[1.2] mb-[25px] font-secondary text-client-secondary text-[2.1875rem] font-bold">
                                    {blog.title}
                                </h3>
                                {introText && (
                                    <p className="text-[1.125rem] text-client-text leading-[1.6] italic border-l-4 border-client-primary pl-6 py-2 bg-gray-50 rounded-r-lg">
                                        {introText}
                                    </p>
                                )}
                            </div>

                            {/* Icons cho vui */}
                            <ListServicesIcon />

                            {/* Content (Tiptap enhanced styling) */}
                            <div className="mt-[50px] blog-detail-content text-[1.0625rem] leading-[1.8] text-client-text">
                                <div dangerouslySetInnerHTML={{ __html: content }} />
                            </div>

                            {/* Tags + Share Socials */}
                            <div className="flex items-center justify-between gap-x-[30px] mt-[80px] py-[30px] border-y border-[#eee]">
                                <div className="flex-1 flex items-center text-client-secondary">
                                    <h4 className="font-secondary text-[1.5rem] mr-[20px] font-bold">Thẻ bài viết:</h4>
                                    <div className="flex items-center gap-[10px] flex-wrap">
                                        {blog.tags && blog.tags.length > 0 ? (
                                            blog.tags.map((tag: any) => (
                                                <Link
                                                    key={tag.tagId}
                                                    to={`/tags/${tag.tagId}`}
                                                    className="px-[20px] py-[8px] bg-[#f9f9f9] border border-[#eee] rounded-[40px] leading-[1.1] hover:bg-client-primary hover:text-white transition-all duration-300 text-[0.875rem] font-medium"
                                                >
                                                    #{tag.name}
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-[0.875rem] text-gray-400 italic">No tags</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center justify-end">
                                    <h4 className="font-secondary text-[1.5rem] mr-[20px] font-bold">Chia sẻ:</h4>
                                    <div><SocialIcon /></div>
                                </div>
                            </div>

                            {/* Blogs Related */}
                            <div className="mt-[60px] flex items-center gap-[40px]">
                                <div className="flex-1 p-[20px] border border-[#eee] rounded-[20px] bg-[#fffbf4] gap-[20px] flex items-center group cursor-pointer hover:border-client-primary transition-all duration-300">
                                    <div className="w-[90px] h-[90px] rounded-[15px] overflow-hidden shrink-0">
                                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/Pamperings.jpg" alt="" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[0.8125rem] mb-[5px] text-client-primary font-bold uppercase tracking-wider">Trước</p>
                                        <h3 className="text-[1.0625rem] font-bold font-secondary leading-[1.3] text-client-secondary line-clamp-2">The Kind Hopper: A Raising For Rabbits</h3>
                                    </div>
                                </div>
                                <div className="flex-1 p-[20px] border border-[#eee] rounded-[20px] bg-[#fffbf4] gap-[20px] flex items-center group cursor-pointer hover:border-client-primary transition-all duration-300">
                                    <div className="w-[90px] h-[90px] rounded-[15px] overflow-hidden shrink-0">
                                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/Pamperings.jpg" alt="" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[0.8125rem] mb-[5px] text-client-primary font-bold uppercase tracking-wider">Sau</p>
                                        <h3 className="text-[1.0625rem] font-bold font-secondary leading-[1.3] text-client-secondary line-clamp-2">The Kind Hopper: A Raising For Rabbits</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="mt-[100px]">
                                <h3 className="mb-[35px] font-secondary text-[1.875rem] font-bold">
                                    Bình luận ({commentsRes?.data?.length || 0})
                                </h3>
                                <ul className="mb-[24px]">
                                    {commentsRes?.data && commentsRes.data.length > 0 ? (
                                        commentsRes.data.map((comment) => (
                                            <li key={comment.id} className="relative flex gap-[20px] pb-[35px] mb-[30px] border-b border-[#d7d7d7]">
                                                <img 
                                                    className="p-[2px] border border-[#d7d7d7] w-[60px] h-[60px] object-cover rounded-[10px]" 
                                                    src={`https://ui-avatars.com/api/?name=${comment.userName || comment.guestName || 'G'}&background=random`} 
                                                    alt="" 
                                                />
                                                <div className="flex-1">
                                                    <div className="text-[1.125rem] text-client-secondary font-[700] mb-[8px]">
                                                        {comment.userName || comment.guestName || "Người dùng"}
                                                    </div>
                                                    <p className="text-client-text text-[0.8125rem] hover:text-client-primary transition-default mb-[20px]">
                                                        {dayjs(comment.createdAt).locale('vi').format('DD [Tháng] MM [lúc] HH:mm')}
                                                    </p>
                                                    <p className="text-client-text text-[1rem]">
                                                        {comment.content}
                                                    </p>
                                                    
                                                    {/* Replies */}
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-6 ml-10 space-y-6">
                                                            {comment.replies.map(reply => (
                                                                <div key={reply.id} className="flex gap-4">
                                                                    <img 
                                                                        className="p-[1px] border border-[#eee] w-[40px] h-[40px] object-cover rounded-[8px]" 
                                                                        src={`https://ui-avatars.com/api/?name=${reply.userName || reply.guestName || 'G'}&background=random`} 
                                                                        alt="" 
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="text-[1rem] text-client-secondary font-[700] mb-1">
                                                                            {reply.userName || reply.guestName || "Người dùng"}
                                                                        </div>
                                                                        <p className="text-client-text text-[0.75rem] mb-2">
                                                                            {dayjs(reply.createdAt).locale('vi').format('DD/MM/YYYY')}
                                                                        </p>
                                                                        <p className="text-client-text text-[0.9375rem]">
                                                                            {reply.content}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="absolute right-0 text-white text-[0.875rem] cursor-pointer hover:text-client-secondary transition-default bg-client-primary py-[8px] px-[15px] rounded-[35px]">Phản hồi</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic mb-[30px]">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                    )}
                                </ul>
                                <div className="p-[45px] bg-[#fdfdfd] border-2 border-[#f8f8f8] rounded-[35px] shadow-sm">
                                    <h3 className="mb-[15px] font-secondary text-[1.625rem] font-bold">Để lại lời nhắn</h3>
                                    <p className="text-client-text font-[500] mb-[35px] opacity-70">
                                        Địa chỉ email của bạn sẽ không được công khai. Các trường bắt buộc được đánh dấu *
                                    </p>
                                    <form onSubmit={handleSubmitComment} className="flex flex-col gap-[25px]">
                                        <textarea 
                                            placeholder="Nội dung bình luận *" 
                                            className="resize-none rounded-[20px] text-[1rem] py-[20px] px-[30px] border border-[#eee] h-[150px] w-full outline-none focus:border-client-primary transition-all bg-white" 
                                            value={commentData.content}
                                            onChange={(e) => setCommentData({...commentData, content: e.target.value})}
                                            required
                                        />
                                        {!user && (
                                            <div className="flex gap-[25px]">
                                                <input 
                                                    placeholder="Họ và tên *" 
                                                    className="flex-1 py-[18px] px-[30px] border border-[#eee] rounded-[50px] outline-none focus:border-client-primary transition-all bg-white text-[0.9375rem]" 
                                                    type="text" 
                                                    value={commentData.guestName}
                                                    onChange={(e) => setCommentData({...commentData, guestName: e.target.value})}
                                                    required
                                                />
                                                <input 
                                                    placeholder="Email của bạn *" 
                                                    className="flex-1 py-[18px] px-[30px] border border-[#eee] rounded-[50px] outline-none focus:border-client-primary transition-all bg-white text-[0.9375rem]" 
                                                    type="email" 
                                                    value={commentData.guestEmail}
                                                    onChange={(e) => setCommentData({...commentData, guestEmail: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center checkbox cursor-pointer">
                                            <input type="checkbox" id="check" hidden />
                                            <label htmlFor="check" className="pl-[12px] font-[500] text-client-text text-[0.875rem] cursor-pointer hover:text-client-primary transition-all">Lưu thông tin cho lần bình luận tiếp theo.</label>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={createMutation.isPending}
                                            className="mt-[10px] w-max cursor-pointer bg-client-primary hover:bg-client-secondary transition-all text-white font-secondary px-[45px] py-[20px] rounded-[60px] text-[1.0625rem] font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {createMutation.isPending ? "Đang gửi..." : "Gửi bình luận ngay"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </article>
                    </section>

                    <aside className="w-[400px] mb-[120px] sticky bottom-0 self-end">
                        {/* Tìm kiếm */}
                        <form className="relative mb-[40px]" action="">
                            <input
                                type="text"
                                placeholder="Nhập từ khóa..."
                                className="w-full outline-none text-client-text border border-[#d7d7d7] px-[32px] py-[16px] bg-white rounded-[40px]"
                            />
                            <button
                                type="submit"
                                className="absolute top-0 right-0 p-[10px] rotate-90 rounded-full text-client-primary bg-transparent hover:text-client-secondary transition-default cursor-pointer w-[3.5625rem] h-[3.5625rem] flex items-center justify-center"
                            >
                                <SearchIcon sx={{ fontSize: "2.1875rem" }} />
                            </button>
                        </form>

                        {/* Bài viết mới nhất */}
                        <div className="mb-[40px]">
                            <ProductAsideTitle title="Bài viết mới nhất" />
                            <ul className="mt-[20px]">
                                {recentBlogs?.slice(0, 3).map((item: any) => (
                                    <li key={item.id} className="mb-[15px] p-[20px] bg-[#fff0f066] rounded-[10px] flex items-center">
                                        <img
                                            width={90}
                                            height={90}
                                            className="w-[90px] h-[90px] object-cover rounded-[10px]"
                                            src={item.featuredImage || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/Classy-hoomns.jpg"}
                                            alt={item.title}
                                        />
                                        <div className="ml-[24px] flex-1">
                                            <p className="uppercase mb-[6px] text-[0.875rem] text-client-text">
                                                {/* Requires dayjs import if not present, checking imports... */}
                                                {/* user's file has no dayjs import? checking previous File... */}
                                                {/* BlogDetail.tsx didn't have dayjs. I'll add it. */}
                                                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </p>
                                            <Link to={`/blog/detail/${item.slug}`} className="text-[1.125rem] font-secondary line-clamp-2 leading-[1.2] text-client-secondary hover:text-client-primary transition-default">
                                                {item.title}
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {(!recentBlogs || recentBlogs.length === 0) && (
                                    <li className="text-[0.875rem] text-gray-500 italic">Không có bài viết mới</li>
                                )}
                            </ul>
                        </div>

                        {/* Lọc theo thẻ */}
                        <div className="mb-[40px]">
                            <ProductAsideTitle title="Lọc theo thẻ" />
                            <div className="gap-[15px] mt-[20px] p-[20px] bg-[#fff0f066] rounded-[20px] flex flex-wrap">
                                {filterTags.map(item => (
                                    <Link to={item.url} className="text-client-secondary bg-white hover:text-white hover:bg-client-secondary transition-default py-[8px] px-[16px] text-[0.875rem] border border-[#10293726] rounded-[35px]">
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Hình ảnh */}
                        <div className="mb-[40px]">
                            <ProductAsideTitle title="Hình ảnh" />
                            <div className="grid grid-cols-3 gap-[15px] rounded-[20px] mt-[20px] p-[20px] bg-[#fff0f066]">
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <div key={num} className="overflow-hidden rounded-[20px]">
                                        <img
                                            className="w-full aspect-square object-cover cursor-pointer hover:scale-110 transition-all duration-500"
                                            src={`https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/h1-gallery-img-0${num}-150x150.jpg`}
                                            alt={`Gallery image ${num}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shop now */}
                        <Link to={'/shop'}>
                            <img className="rounded-[20px] object-cover" src="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/sidebar-banner-619x1024.jpg" alt="" />
                        </Link>
                    </aside>
                </div>
                <FooterSub />
            </section>
        </>
    )
}
