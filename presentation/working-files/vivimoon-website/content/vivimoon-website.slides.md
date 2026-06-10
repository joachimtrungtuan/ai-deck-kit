---
title: "VIVIMOON Website"
slug: "vivimoon-website"
audience: "Ban lãnh đạo, marketing, ecommerce và team triển khai của Vivimoon"
goal: "Thống nhất định hướng WordPress + WooCommerce + Bricks Builder cho website bán hàng D2C."
template_set: "linear-dark"
template_version: "1.0.0"
slide_type_catalog: "v2"
output_mode: "react-and-static-html"
status: "draft"
---

## Slide 01: VIVIMOON Website

```yaml
id: "slide-01"
type: "title"
status: "draft"
intent: "Mở đầu bằng đề xuất tech stack và phạm vi triển khai."
animation: "masked-reveal"
icons: ["globe", "stack"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- VIVIMOON Website
- Định hướng Tech Stack & Phương án triển khai
- WordPress + WooCommerce + Bricks Builder
- TELOS Agency
- Hạng mục: Website development

### Visual Direction

Slide mở đầu tối, gọn, nhấn vào dự án và đề xuất triển khai.

### Speaker Notes

Định vị đây là hướng triển khai website bán hàng D2C, không chỉ là redesign giao diện.

### Design Notes

Giữ tiêu đề lớn, dòng stack rõ, metadata chỉ dùng thông tin dự án.

### Review Questions

- Không có.

## Slide 02: Agenda

```yaml
id: "slide-02"
type: "agenda"
status: "draft"
intent: "Bổ sung slide agenda để người nghe nắm cấu trúc."
animation: "gentle-rise"
icons: ["target", "stack", "shield", "rocket"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Mục tiêu kinh doanh
- Yêu cầu website
- Mapping giải pháp
- Tech stack & kiến trúc
- Data flow, mở rộng, bảo mật
- Tóm tắt đề xuất

### Visual Direction

Agenda dạng danh sách, phong cách proposal kỹ thuật.

### Speaker Notes

Nhấn mạnh mỗi lựa chọn kỹ thuật đều quay về conversion, retention, khả năng vận hành và quyền sở hữu dữ liệu.

### Design Notes

Giữ mỗi dòng ngắn; chi tiết để các slide sau trình bày.

### Review Questions

- Không có.

## Slide 03: Mục tiêu kinh doanh

```yaml
id: "slide-03"
type: "process-flow"
status: "draft"
intent: "Liên kết sở hữu kênh D2C với conversion, retention và tăng trưởng."
animation: "line-draw"
icons: ["target", "users", "chart", "rocket"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Tăng doanh thu D2C
- Trải nghiệm khách hàng tốt hơn
- Conversion tốt hơn
- Retention tốt hơn
- Tăng trưởng bền vững

### Visual Direction

Goal map tuyến tính từ doanh thu D2C đến tăng trưởng bền vững.

### Speaker Notes

Mục tiêu kinh doanh: xây dựng website thành kênh bán hàng D2C chính, giảm phụ thuộc Shopee/TikTok Shop, tăng conversion từ traffic quảng cáo, tăng mua lại, chủ động sở hữu dữ liệu khách hàng và hành vi mua sắm. Mục tiêu vận hành: dễ quản lý sản phẩm, nội dung, chiến dịch; dễ mở rộng theo giai đoạn; không tạo áp lực chi phí kỹ thuật quá lớn.

### Design Notes

Dùng process flow làm visual chính, không biến thành slide bullet dày.

### Review Questions

- Không có.

## Slide 04: Yêu cầu kinh doanh -> năng lực website

```yaml
id: "slide-04"
type: "spec-table"
status: "draft"
intent: "Chuyển yêu cầu kinh doanh thành năng lực website cụ thể."
animation: "staggered-list"
icons: ["target", "globe", "database"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

| Yêu cầu kinh doanh | Yêu cầu website |
| --- | --- |
| Chọn lens nhanh hơn | Bộ lọc sản phẩm + PDP rõ ràng |
| Tăng conversion | Checkout đơn giản, mobile-first |
| Tăng độ tin tưởng | Review, UGC, video |
| Thu thập dữ liệu | Account + lịch sử mua hàng |
| Tối ưu quảng cáo | Tracking GA4, Meta, TikTok |
| Dễ vận hành | CMS thân thiện + quản lý sản phẩm |

### Visual Direction

Bảng 2 cột: yêu cầu kinh doanh và năng lực website.

### Speaker Notes

Các yêu cầu còn lại: hỗ trợ remarketing bằng customer database và event tracking; kiến trúc mở cho CRM, loyalty, AI, AR ở các phase sau.

### Design Notes

Giữ bảng 6 dòng để đảm bảo dễ đọc trong template.

### Review Questions

- Không có.

## Slide 05: Mapping giải pháp

```yaml
id: "slide-05"
type: "process-flow"
status: "draft"
intent: "Cho thấy cầu nối từ business requirement đến tech stack."
animation: "line-draw"
icons: ["target", "branch", "plugs", "stack"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Yêu cầu kinh doanh
- Yêu cầu chức năng
- Giải pháp kỹ thuật
- Tech stack

### Visual Direction

Flow 4 bước thể hiện logic chuyển đổi yêu cầu.

### Speaker Notes

Ví dụ: tăng conversion -> mobile-first UX và checkout tối ưu; giảm mua sai -> filter, variant logic, account profile; tăng trust -> review, UGC, video; tối ưu quảng cáo -> event tracking; retention -> customer account, email automation; ổn định -> cache, CDN, security layer.

### Design Notes

Giữ flow đơn giản để presenter giải thích bằng lời.

### Review Questions

- Không có.

## Slide 06: Tech stack đề xuất

```yaml
id: "slide-06"
type: "architecture-overview"
status: "draft"
intent: "Trình bày stack theo các lớp năng lực."
animation: "line-draw"
icons: ["globe", "stack", "plugs", "shield", "chart"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Bricks Builder
- WooCommerce
- WordPress CMS
- CDN / Cache / Security
- GA4 / Meta / TikTok / CRM

### Visual Direction

Sơ đồ layer từ experience, commerce, CMS, infrastructure đến analytics.

### Speaker Notes

WooCommerce quản lý sản phẩm, biến thể, đơn hàng, checkout, coupon và promotion. WordPress là CMS cho content marketing, landing page, campaign page và SEO. Bricks Builder linh hoạt cho UI/UX, hiệu năng tốt hơn nhiều page builder phổ biến, dễ kiểm soát component và maintain. Ecosystem gồm payment gateway, shipping integration, analytics, CRM integration và marketing automation.

### Design Notes

Dùng 5 node chính; không liệt kê quá nhiều plugin hoặc nhà cung cấp trên slide.

### Review Questions

- Không có.

## Slide 07: Kiến trúc triển khai

```yaml
id: "slide-07"
type: "architecture-overview"
status: "draft"
intent: "Cho thấy kiến trúc end-to-end và các điểm mở rộng tương lai."
animation: "line-draw"
icons: ["users", "cloud", "cpu", "plugs", "rocket"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- User
- CDN / WAF
- Website core
- Payment / Shipping / CRM
- Loyalty / AI / AR

### Visual Direction

Đường đi hệ thống từ user qua CDN/WAF đến core website và integration layer.

### Speaker Notes

Core platform: WordPress, WooCommerce, Bricks. Infrastructure layer: Cloudflare CDN, WAF, SSL, backup, monitoring. Integration layer: payment gateway, shipping provider, CRM, email automation, analytics platform. Future layer: loyalty, AI recommendation, AR try-on, mobile app, customer data platform.

### Design Notes

Future layer là hướng mở rộng, không phải cam kết scope Phase 1.

### Review Questions

- Không có.

## Slide 08: Data flow khách hàng

```yaml
id: "slide-08"
type: "data-flow"
status: "draft"
intent: "Giải thích traffic, tracking, checkout, order, CRM và retention kết nối thế nào."
animation: "line-draw"
icons: ["globe", "chart", "target", "stack", "sync"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Traffic -> Website
- Website -> Tracking
- Event -> Giỏ hàng / Checkout
- Checkout -> Đơn WooCommerce
- Dữ liệu đơn hàng -> CRM / Retention

### Visual Direction

Flow 5 hàng, có icon và connector animation cho từng bước.

### Speaker Notes

Luồng gốc: user truy cập website; tracking ghi nhận nguồn traffic; user xem sản phẩm và tương tác; event gửi về GA4, Meta, TikTok; user thêm sản phẩm vào giỏ hàng; user checkout; WooCommerce tạo đơn hàng; dữ liệu chuyển sang CRM hoặc hệ thống vận hành; customer data phục vụ remarketing và retention.

### Design Notes

Gộp thành 5 bước vì layout data-flow tối ưu cho tối đa 5 row.

### Review Questions

- Không có.

## Slide 09: Khả năng mở rộng

```yaml
id: "slide-09"
type: "before-after"
status: "draft"
intent: "Đối chiếu traffic thường ngày với campaign spike và giải pháp kỹ thuật."
animation: "gentle-rise"
icons: ["rocket", "cloud", "chart"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Kịch bản thông thường: traffic ổn định, người dùng xem sản phẩm, hạ tầng tiêu chuẩn.
- Kịch bản campaign: flash sale, TikTok viral, KOL/KOC campaign, livestream.
- Giải pháp: CDN, cache, object cache, tối ưu database, nâng tài nguyên, monitoring realtime.

### Visual Direction

Before/after giữa vận hành thường ngày và trạng thái sẵn sàng campaign.

### Speaker Notes

Năng lực mở rộng: tăng tài nguyên server theo traffic, tách media qua CDN, tách service tích hợp nếu cần, không bị giới hạn bởi kiến trúc monolithic custom khó bảo trì.

### Design Notes

Panel trái cho trạng thái thông thường; panel phải cho năng lực campaign-ready.

### Review Questions

- Không có.

## Slide 10: Hiệu năng, bảo mật, quản trị vận hành

```yaml
id: "slide-10"
type: "icon-grid"
status: "draft"
intent: "Tóm tắt các lớp bảo vệ vận hành của stack."
animation: "staggered-list"
icons: ["lightning", "shield", "lock", "branch", "chart", "cloud"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Tối ưu ảnh + lazy loading
- Chiến lược cache + tối ưu script
- Cloudflare WAF + SSL + 2FA
- Backup hằng ngày + phân quyền
- Staging + quy trình deploy
- Quản trị plugin + monitoring

### Visual Direction

Icon grid 6 card cho performance, security và governance.

### Speaker Notes

Core Web Vitals monitoring nên là một phần của performance loop. Monitoring và alerting thuộc governance, không chỉ là hạ tầng.

### Design Notes

Giữ label ngắn để tránh overflow.

### Review Questions

- Không có.

## Slide 11: Tóm tắt đề xuất

```yaml
id: "slide-11"
type: "comparison-table"
status: "draft"
intent: "Tóm tắt vì sao stack đề xuất phù hợp yêu cầu Vivimoon."
animation: "staggered-list"
icons: ["stack", "target", "shield"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

| Yêu cầu | Giải pháp đề xuất |
| --- | --- |
| Tăng doanh thu D2C | Commerce flow bằng WooCommerce |
| Tăng conversion | Mobile-first UX + checkout |
| Giảm phụ thuộc marketplace | Sở hữu website |
| Dữ liệu khách hàng | Tracking + customer account |
| Tối ưu quảng cáo | GA4 + Meta + TikTok |
| Ổn định hệ thống | CDN + cache + security |

### Visual Direction

Bảng tóm tắt với cột giải pháp được nhấn mạnh.

### Speaker Notes

Kết luận: đáp ứng nhu cầu business hiện tại, tối ưu chi phí đầu tư và vận hành, triển khai nhanh hơn custom platform, dễ quản trị bởi đội ngũ hiện tại, có khả năng mở rộng trong các phase tiếp theo.

### Design Notes

Dùng comparison-table, highlight cột giải pháp.

### Review Questions

- Không có.

## Slide 12: Kết luận

```yaml
id: "slide-12"
type: "closing"
status: "draft"
intent: "Kết thúc bằng quyết định đề xuất và hành động tiếp theo."
animation: "spotlight"
icons: ["rocket", "branch", "users"]
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Đề xuất triển khai: WordPress + WooCommerce + Bricks Builder
- Tiếp theo: chốt phạm vi, chốt phase launch, chốt danh sách tích hợp

### Visual Direction

Closing slide với quyết định rõ và ba hành động tiếp theo.

### Speaker Notes

Chốt hướng stack, thống nhất scope launch và xác định các tích hợp bắt buộc cho Phase 1.

### Design Notes

Dòng quyết định là nội dung chính; action đặt trong side panel.

### Review Questions

- Không có.
