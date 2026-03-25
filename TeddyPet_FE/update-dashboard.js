const fs = require('fs');
const file = 'src/admin/pages/dashboard/SystemPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace SystemStats definition
const systemStatsRegex = /const SystemStats.*?\}\);\n\};/s;
const newSystemStats = `const SystemStats = ({ stats, chartData, ratingSummary }: { stats?: DashboardStatsResponse; chartData?: RevenueChartItem[]; ratingSummary?: RatingSummaryResponse }) => {
    const defaultChartData = [25, 66, 41, 89, 63, 25, 44, 12];
    const customerChartData = (chartData && chartData.length > 0) ? chartData.map((d: any) => d.orders) : defaultChartData;

    const cards = [
        // Row 1
        <SummaryWidget
            key="customer"
            title="Khách hàng"
            total={stats?.totalCustomers?.toLocaleString() ?? "0"}
            percent={8.5}
            color="#00a76f"
            chartData={customerChartData}
            to={\`/\${prefixAdmin}/user/list\`}
        />,
        <SummaryWidget
            key="completed-orders"
            title="Đơn hàng HT"
            total={stats?.completedOrders?.toLocaleString() ?? "0"}
            percent={5.4}
            color="#00b8d9"
            chartData={[15, 32, 45, 32, 56, 32, 44, 55]}
            to={\`/\${prefixAdmin}/order/list\`}
        />,
        <SummaryWidget
            key="sold-products"
            title="Sản phẩm đã bán"
            total={stats?.totalProducts?.toLocaleString() ?? "0"}
            percent={2.6}
            color="#00a76f"
            chartData={defaultChartData}
            to="/admin/product/list"
        />,

        // Row 2
        <SummaryWidget
            key="avg-rating"
            title="Đánh giá TB"
            total={stats?.avgRating != null ? stats.avgRating.toFixed(1) : "0.0"}
            percent={0.2}
            color="#ffab00"
            chartData={[4.5, 4.2, 4.8, 4.5, 4.3, 4.7, 4.5, 4.6]}
            to={\`/\${prefixAdmin}/feedback/list\`}
        />,
        <ProgressCard
            key="rating"
            title="Độ hài lòng (Rating)"
            total={ratingSummary != null ? \`\${Number(ratingSummary.averageScore).toFixed(1)} / 5.0\` : '— / 5.0'}
            percent={ratingSummary != null ? Math.round((ratingSummary.averageScore / 5) * 100) : 0}
            color="#007867"
            bgIcon={
                <svg width="120" height="120" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41l-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"/>
                </svg>
            }
        />,
        <ProgressCard
            key="reviews"
            title="Tương tác người dùng"
            total={ratingSummary != null ? \`\${ratingSummary.totalCount.toLocaleString()} reviews\` : '0 reviews'}
            percent={ratingSummary != null && ratingSummary.totalCount > 0 ? Math.min(100, Math.round(ratingSummary.totalCount / 50)) : 0}
            color="var(--palette-info-dark)"
            bgIcon={
                <svg width="120" height="120" viewBox="0 0 24 24">
                    <path fill="currentColor" fillRule="evenodd" d="M3.172 5.172C2 6.343 2 8.229 2 12s0 5.657 1.172 6.828S6.229 20 10 20h4c3.771 0 5.657 0 6.828-1.172S22 15.771 22 12s0-5.657-1.172-6.828S17.771 4 14 4h-4C6.229 4 4.343 4 3.172 5.172M18.576 7.52a.75.75 0 0 1-.096 1.056l-2.196 1.83c-.887.74-1.605 1.338-2.24 1.746c-.66.425-1.303.693-2.044.693s-1.384-.269-2.045-.693c-.634-.408-1.352-1.007-2.239-1.745L5.52 8.577a.75.75 0 0 1 .96-1.153l2.16 1.799c.933.777 1.58 1.315 2.128 1.667c.529.34.888.455 1.233.455s.704-.114 1.233-.455c.547-.352 1.195-.89 2.128-1.667l2.159-1.8a.75.75 0 0 1 1.056.097" clipRule="evenodd" />
                </svg>
            }
        />,

        // Row 3
        <SummaryWidget
            key="completed-bookings"
            title="Lịch đặt HT"
            total={stats?.completedBookings?.toLocaleString() ?? "0"}
            percent={12.5}
            color="#8e33ff"
            chartData={[10, 22, 18, 25, 30, 24, 28, 35]}
            to={\`/\${prefixAdmin}/booking/list\`}
        />,
        <SummaryWidget
            key="total-orders"
            title="Tổng đơn hàng"
            total={stats?.totalOrders?.toLocaleString() ?? "0"}
            percent={0.6}
            color="#00b8d9"
            chartData={defaultChartData}
            to={\`/\${prefixAdmin}/order/list\`}
        />,
        <SummaryWidget
            key="booking-customers"
            title="Khách đặt lịch (trừ hủy)"
            total={(stats?.bookingCustomersExcludingCancelled ?? 0).toLocaleString()}
            color="#118d57"
            chartData={[12, 18, 14, 22, 19, 24, 20, 26]}
            to={\`/\${prefixAdmin}/booking/list\`}
        />,

        // Row 4
        <SummaryWidget
            key="booking-fully-paid"
            title="Đặt lịch thanh toán đủ"
            total={(stats?.bookingFullyPaidCount ?? 0).toLocaleString()}
            color="#078dee"
            chartData={[8, 12, 10, 15, 14, 18, 16, 20]}
            to={\`/\${prefixAdmin}/booking/list\`}
        />,
        <SummaryWidget
            key="booking-deposits"
            title="Cọc đã thanh toán"
            total={(stats?.bookingDepositsPaidCount ?? 0).toLocaleString()}
            color="#b76e00"
            chartData={[5, 8, 7, 11, 9, 12, 10, 13]}
            to={\`/\${prefixAdmin}/booking/list\`}
        />,
        <SummaryWidget
            key="booking-refunds"
            title="Tiền cọc đã hoàn"
            total={formatVnd(stats?.bookingDepositsRefundedTotal ?? 0)}
            color="#637381"
            chartData={[3, 5, 4, 6, 5, 7, 6, 8]}
            to={\`/\${prefixAdmin}/booking/list\`}
        />,
    ];

    return (
        <Grid
            sx={{
                width: '100%',
                flexBasis: '100%',
                maxWidth: '100%',
                minWidth: 0,
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: 'var(--Grid-rowSpacing) var(--Grid-columnSpacing)',
                boxSizing: 'border-box',
            }}
        >
            {cards.map((card) => (
                <Grid
                    key={card.key}
                    sx={{
                        flexGrow: 0,
                        flexBasis: 'auto',
                        width: 'calc(100% * 4 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 4) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                        minWidth: 0,
                    }}
                >
                    {card}
                </Grid>
            ))}
        </Grid>
    );
};`;
content = content.replace(systemStatsRegex, newSystemStats);

// 2. Add ratingSummary to SystemStats props call
content = content.replace('<SystemStats stats={stats} chartData={chartData} />', '<SystemStats stats={stats} chartData={chartData} ratingSummary={ratingSummary} />');

// 3. Replace Bottom Section to remove the Stack block and resize TopCustomers/TopStaff
const oldBottomSectionRegex = /\{\/\* Bottom Section \*\/\}.*?<TodayRevenueModal/s;
const newBottomSection = `{/* Bottom Section */}
            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <TopCustomers data={topCustomers} />
            </Grid>

            <Grid
                sx={{
                    flexGrow: 0,
                    flexBasis: 'auto',
                    width: 'calc(100% * 6 / var(--Grid-parent-columns) - (var(--Grid-parent-columns) - 6) * (var(--Grid-parent-columnSpacing) / var(--Grid-parent-columns)))',
                }}
            >
                <TopStaff data={topStaff} />
            </Grid>
            <TodayRevenueModal`;
content = content.replace(oldBottomSectionRegex, newBottomSection);

fs.writeFileSync(file, content);
console.log("Done");
