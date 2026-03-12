type TitleProps = {
    title: string;
    sx?: React.CSSProperties;
};

export const Title = ({ title, sx }: TitleProps) => {
    return (
        <h6 className="font-[700] mb-[16px]" style={{ fontSize: '1.4375rem', ...sx }}>
            {title}
        </h6>
    );
};