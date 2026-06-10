import type { ComponentType } from "react";
import {
  LinearAgendaSlide,
  LinearArchitectureOverviewSlide,
  LinearBeforeAfterSlide,
  LinearClosingSlide,
  LinearComparisonTableSlide,
  LinearDataFlowSlide,
  LinearIconGridSlide,
  LinearProcessFlowSlide,
  LinearSpecTableSlide,
  LinearTitleSlide,
  type LinearSlideProps,
} from "../../../templates/linear-dark/layouts/react";

export type VivimoonSlide = {
  type: string;
  Component: ComponentType<LinearSlideProps>;
  props: LinearSlideProps;
};

export const vivimoonWebsiteSlides: VivimoonSlide[] = [
  {
    type: "01-mo-dau",
    Component: LinearTitleSlide,
    props: {
      animation: "masked-reveal",
      kicker: "VIVIMOON Website",
      title: "Định hướng Tech Stack & Phương án triển khai",
      body: "WordPress + WooCommerce + Bricks Builder cho nền tảng bán hàng D2C.",
      titleMeta: [
        { label: "Đơn vị thực hiện", value: "TELOS Agency" },
        { label: "Hạng mục", value: "Website development" },
        { label: "Trọng tâm", value: "Kênh bán hàng D2C" },
        { label: "Stack đề xuất", value: "WordPress + WooCommerce + Bricks" },
      ],
    },
  },
  {
    type: "02-noi-dung",
    Component: LinearAgendaSlide,
    props: {
      kicker: "Nội dung",
      title: "Agenda",
      body: "Đi từ mục tiêu kinh doanh đến yêu cầu website, kiến trúc và đề xuất triển khai.",
      items: ["Mục tiêu kinh doanh", "Yêu cầu website", "Mapping giải pháp", "Tech stack & kiến trúc", "Data flow, mở rộng, bảo mật", "Tóm tắt đề xuất"],
    },
  },
  {
    type: "03-muc-tieu-kinh-doanh",
    Component: LinearProcessFlowSlide,
    props: {
      animation: "line-draw",
      kicker: "Mục tiêu kinh doanh",
      title: "Từ sở hữu kênh D2C đến tăng trưởng bền vững",
      items: ["Tăng doanh thu D2C", "Trải nghiệm khách hàng tốt hơn", "Conversion tốt hơn", "Retention tốt hơn"],
      icons: ["target", "users", "chart", "rocket"],
    },
  },
  {
    type: "04-yeu-cau-website",
    Component: LinearSpecTableSlide,
    props: {
      kicker: "Yêu cầu",
      title: "Yêu cầu kinh doanh -> năng lực website",
      tableColumns: ["Yêu cầu kinh doanh", "Yêu cầu website"],
      tableRows: [
        ["Chọn lens nhanh hơn", "Bộ lọc sản phẩm + PDP rõ ràng"],
        ["Tăng conversion", "Checkout đơn giản, mobile-first"],
        ["Tăng độ tin tưởng", "Review, UGC, video"],
        ["Thu thập dữ liệu", "Account + lịch sử mua hàng"],
        ["Tối ưu quảng cáo", "Tracking GA4, Meta, TikTok"],
        ["Dễ vận hành", "CMS thân thiện + quản lý sản phẩm"],
      ],
    },
  },
  {
    type: "05-mapping-giai-phap",
    Component: LinearProcessFlowSlide,
    props: {
      animation: "line-draw",
      kicker: "Mapping giải pháp",
      title: "Nhu cầu business được chuyển thành lựa chọn kỹ thuật",
      items: ["Yêu cầu kinh doanh", "Yêu cầu chức năng", "Giải pháp kỹ thuật", "Tech stack"],
      icons: ["target", "branch", "plugs", "stack"],
    },
  },
  {
    type: "06-tech-stack",
    Component: LinearArchitectureOverviewSlide,
    props: {
      kicker: "Tech stack đề xuất",
      title: "Phân lớp theo trải nghiệm, thương mại, nội dung và marketing",
      items: ["Bricks Builder", "WooCommerce", "WordPress CMS", "CDN / Cache / Security", "GA4 / Meta / TikTok / CRM"],
      icons: ["globe", "stack", "plugs", "shield", "chart"],
    },
  },
  {
    type: "07-kien-truc",
    Component: LinearArchitectureOverviewSlide,
    props: {
      kicker: "Kiến trúc",
      title: "Core platform có điểm mở rộng rõ ràng",
      items: ["User", "CDN / WAF", "Website core", "Payment / Shipping / CRM", "Loyalty / AI / AR"],
      icons: ["users", "cloud", "cpu", "plugs", "rocket"],
    },
  },
  {
    type: "08-data-flow",
    Component: LinearDataFlowSlide,
    props: {
      animation: "line-draw",
      kicker: "Data flow",
      title: "Traffic chuyển thành đơn hàng và tín hiệu retention",
      flowSteps: [
        { from: "Traffic", to: "Website", label: "Ghi nhận nguồn truy cập" },
        { from: "Website", to: "Tracking", label: "GA4 / Meta / TikTok" },
        { from: "Event", to: "Giỏ hàng / Checkout", label: "Ghi nhận intent" },
        { from: "Checkout", to: "Đơn WooCommerce", label: "Tạo giao dịch" },
        { from: "Dữ liệu đơn hàng", to: "CRM / Retention", label: "Phục vụ remarketing" },
      ],
      icons: ["globe", "chart", "target", "stack", "sync"],
    },
  },
  {
    type: "09-mo-rong",
    Component: LinearBeforeAfterSlide,
    props: {
      kicker: "Khả năng mở rộng",
      title: "Sẵn sàng cho traffic thường ngày và campaign spike",
      leftTitle: "Kịch bản thông thường",
      rightTitle: "Kịch bản campaign",
      leftItems: ["Traffic ổn định", "Người dùng xem sản phẩm", "Hạ tầng tiêu chuẩn"],
      rightItems: ["CDN + full page cache", "Object cache + tối ưu database", "Nâng tài nguyên + monitoring realtime"],
    },
  },
  {
    type: "10-van-hanh",
    Component: LinearIconGridSlide,
    props: {
      kicker: "Vận hành",
      title: "Hiệu năng, bảo mật, quản trị vận hành",
      body: "Stack chỉ bền vững khi hiệu năng, bảo mật và quy trình vận hành được định nghĩa từ đầu.",
      items: ["Tối ưu ảnh + lazy loading", "Chiến lược cache + tối ưu script", "Cloudflare WAF + SSL + 2FA", "Backup hằng ngày + phân quyền", "Staging + quy trình deploy", "Quản trị plugin + monitoring"],
      icons: ["lightning", "chart", "shield", "lock", "branch", "cloud"],
    },
  },
  {
    type: "11-tom-tat",
    Component: LinearComparisonTableSlide,
    props: {
      kicker: "Tóm tắt đề xuất",
      title: "Yêu cầu kinh doanh -> giải pháp kỹ thuật",
      recommendedColumn: 1,
      tableColumns: ["Yêu cầu", "Giải pháp đề xuất"],
      tableRows: [
        ["Tăng doanh thu D2C", "Commerce flow bằng WooCommerce"],
        ["Tăng conversion", "Mobile-first UX + checkout"],
        ["Giảm phụ thuộc marketplace", "Sở hữu website"],
        ["Dữ liệu khách hàng", "Tracking + customer account"],
        ["Tối ưu quảng cáo", "GA4 + Meta + TikTok"],
        ["Ổn định hệ thống", "CDN + cache + security"],
      ],
    },
  },
  {
    type: "12-ket-thuc",
    Component: LinearClosingSlide,
    props: {
      animation: "spotlight",
      kicker: "Kết luận",
      title: "Đề xuất triển khai với WordPress + WooCommerce + Bricks.",
      body: "Phù hợp nhu cầu hiện tại, triển khai nhanh, dễ vận hành và vẫn có không gian mở rộng theo phase tiếp theo.",
      items: ["Chốt phạm vi Phase 1", "Chốt danh sách tích hợp bắt buộc", "Xây launch plan"],
    },
  },
];
