# Hướng dẫn sử dụng form quảng cáo

Tài liệu này dành cho người quản trị đầu tiên của GoodLuckArk. Mục tiêu là giúp
người dùng tạo, kiểm tra, bật và xử lý lỗi quảng cáo mà không cần hiểu cấu trúc
code của website.

## 1. Những điều cần biết trước khi bắt đầu

- Trang quản trị: `http://localhost:3000/admin/login`.
- Mở menu **Ad placements** để xem danh sách quảng cáo.
- Chỉ tài khoản `SUPER_ADMIN` được thêm, sửa hoặc xóa code quảng cáo.
- Tài khoản `ADS_MANAGER` hiện chỉ được xem cấu hình.
- Code HTML hoặc JavaScript được nhập tại đây có thể chạy trên website. Chỉ sử
  dụng code do Google hoặc đối tác đáng tin cậy cung cấp.
- Khi xóa một Ad placement, bản ghi bị xóa cứng khỏi database. Nên tắt quảng cáo
  thay vì xóa nếu có khả năng sử dụng lại.

## 2. Quy trình an toàn được khuyến nghị

1. Nhấn **Add placement**.
2. Điền tên, phạm vi, vị trí, thiết bị và code.
3. Chưa chọn **Enabled**.
4. Lưu cấu hình.
5. Dùng HTML thử nghiệm để kiểm tra đúng vị trí trên desktop và mobile.
6. Kiểm tra ngày bắt đầu, ngày kết thúc và URL mục tiêu.
7. Thay HTML thử nghiệm bằng code thật của đối tác.
8. Bật **Enabled**.
9. Mở trang public bằng cửa sổ ẩn danh để kiểm tra lần cuối.

Không nên dán code thật rồi bật ngay, vì một script sai có thể ảnh hưởng tới
toàn bộ trang được chọn.

## 3. Giải thích từng trường trong form

### 3.1. Placement name

Tên nội bộ để đội quản trị nhận ra quảng cáo.

Ví dụ:

```text
Homepage top banner
Reader inline Google Ads
Bracelet of Lies - all chapters
Global partner loader
```

Tên không quyết định vị trí hiển thị. Nên đặt tên theo cấu trúc:

```text
[Trang hoặc phạm vi] - [Vị trí] - [Đối tác hoặc mục đích]
```

Ví dụ: `Chapter reader - Inline - Google`.

### 3.2. Technical Key

Người dùng không phải nhập Key. Hệ thống tự sinh mã kỹ thuật duy nhất khi tạo.

Ví dụ:

```text
CHAPTER_READER_INLINE_READER_INLINE_GOOGLE_ADS_01
```

Nếu tên và cấu hình trùng nhau, hệ thống tự tăng hậu tố `_02`, `_03`... Key được
giữ ổn định khi sửa placement và chỉ dùng để theo dõi, debug hoặc xác định vùng
Ads trong HTML.

### 3.3. Show this ad on

Trường này xác định quảng cáo được phép xuất hiện trên trang nào.

#### Entire website

Placement có thể chạy trên tất cả trang public. Không bao gồm trang Admin.

Nên dùng cho:

- Script loader chung của Google hoặc đối tác.
- Script cần được tải trên toàn site.
- Banner thực sự cần xuất hiện ở mọi trang.

Không nên dùng `Entire website + INLINE`, vì renderer chèn giữa đoạn chỉ tồn tại
trong trang đọc chương.

#### A type of page

Placement chạy trên một nhóm trang. Sau khi chọn, trường **Page type** xuất hiện.

| Page type | Phạm vi thực tế |
| --- | --- |
| Homepage | Chỉ trang `/` |
| Novel catalog | Trang danh sách `/novels` |
| Category pages | `/categories` và `/category/...` |
| Novel detail pages | Tất cả trang chi tiết `/novels/{slug}` |
| Chapter reader | Tất cả trang đọc `/novels/{slug}/{chapter}` |
| Search results | Trang `/search` |
| Content pages | About, Contact, FAQ, Privacy, Terms... |

Hiện tại một placement chỉ chọn được một Page type. Nếu cùng code phải chạy ở
Homepage và Category pages, cần tạo hai placement riêng.

#### A specific page or novel

Dùng khi quảng cáo chỉ thuộc một truyện hoặc một đường dẫn cụ thể.

Các lựa chọn Target:

1. **One story detail page**

   Chỉ khớp trang chi tiết truyện:

   ```text
   /novels/bracelet-of-lies
   ```

   Không khớp các chương của truyện đó.

2. **All chapters of one story**

   Khớp mọi chương:

   ```text
   /novels/bracelet-of-lies/*
   ```

   Đây là lựa chọn phù hợp khi muốn chèn quảng cáo giữa nội dung của toàn bộ
   chương thuộc một truyện.

3. **Advanced: custom URL path**

   Dùng khi trang không có trong danh sách chọn sẵn.

   ```text
   /about
   /novels/bracelet-of-lies
   /novels/bracelet-of-lies/*
   ```

   Dấu `*` chỉ được hỗ trợ ở cuối đường dẫn và có nghĩa là mọi URL bắt đầu bằng
   phần đứng trước dấu `*`.

### 3.4. Placement preview

Khung Preview diễn giải cấu hình hiện tại bằng câu dễ đọc.

Ví dụ:

```text
This ad will appear in every chapter of Bracelet of Lies.
Position: between chapter paragraphs.
```

Phải đọc lại Preview trước khi lưu. Nếu nội dung Preview không đúng ý định, cần
quay lại chọn phạm vi hoặc vị trí khác.

### 3.5. Position

Position xác định nơi code được gắn vào trang đã chọn.

| Position | Hành vi | Có tạo block nhìn thấy? |
| --- | --- | --- |
| Head script | Gắn code vào phần `<head>` sau khi trang chạy | Không nhất thiết |
| Opening body script | Chạy code ở vùng đầu body | Tùy code |
| Closing body script | Chạy code ở vùng cuối body | Tùy code |
| Top of page | Vùng quảng cáo cấp trang trước nội dung chính | Có |
| Bottom of page | Vùng quảng cáo sau toàn bộ nội dung trang | Có |
| Between chapter paragraphs | Chèn lặp lại giữa các đoạn của chương | Có |

`Top of page` và `Bottom of page` là block trong luồng trang nên có thể đẩy nội
dung xuống. Đây là hành vi bình thường của quảng cáo in-flow.

Các vị trí hiện chưa được hỗ trợ riêng:

- Sau thông tin truyện.
- Sau Synopsis.
- Trước danh sách chương.
- Sau một card cụ thể trên Homepage.

Nếu cần các vị trí trên, phải bổ sung placement mới trong code trước khi khách
hàng có thể chọn trong Admin.

### 3.6. Code type

#### HTML or ad-unit snippet

Dùng cho HTML thử nghiệm hoặc nguyên ad-unit snippet do đối tác cung cấp.

```html
<div style="margin:20px 0;padding:20px;background:#fff3cd;border:2px dashed #c0396b;text-align:center">
  TEST ADVERTISEMENT
</div>
```

Đây là lựa chọn nên dùng khi kiểm tra local.

#### Inline JavaScript

Dùng khi đối tác cung cấp nội dung JavaScript không có thẻ `<script>` bao quanh.

```javascript
console.log("Partner ad script loaded");
```

Không dán code không rõ nguồn gốc.

#### External HTTPS script

Dùng khi đối tác cung cấp URL script:

```text
https://partner.example.com/ads.js
```

URL bắt buộc sử dụng HTTPS. Không nhập nguyên thẻ `<script>` khi đã chọn loại
này; chỉ nhập URL.

### 3.7. Device

| Lựa chọn | Thiết bị hiển thị |
| --- | --- |
| Desktop and mobile | Tất cả thiết bị |
| Desktop only | Màn hình lớn hơn breakpoint mobile |
| Mobile only | Màn hình mobile |

Nếu đối tác cung cấp code hoặc kích thước khác nhau cho desktop và mobile, nên
tạo hai placement riêng để dễ bật/tắt và kiểm tra.

### 3.8. Priority

Priority quyết định thứ tự xử lý khi nhiều placement cùng khớp một trang và vị
trí. Số lớn được xử lý trước.

```text
100 chạy trước 10
10 chạy trước 0
```

Thông thường để `0`. Chỉ thay đổi khi script loader phải chạy trước ad unit hoặc
đối tác yêu cầu thứ tự cụ thể.

### 3.9. Words between ads

Chỉ xuất hiện khi chọn **Between chapter paragraphs**. Giá trị nhỏ nhất là 10.

Ví dụ nhập `50`:

1. Hệ thống đếm phần chữ người đọc nhìn thấy.
2. Khi tổng đạt khoảng 50 từ, hệ thống chờ hết đoạn HTML hiện tại.
3. Ads được chèn sau đoạn gần mốc 50 nhất.
4. Mốc kế tiếp là 100, 150, 200...

Hệ thống không cắt ngang câu hoặc thẻ HTML.

Ví dụ với interval 10:

```text
123 trung check chuẩn bị đi chơi nhiều hôm chưa về
```

Câu có 11 từ. Ads không được đặt giữa từ `chưa` và `về`; nó được đặt sau toàn bộ
đoạn:

```text
123 trung check chuẩn bị đi chơi nhiều hôm chưa về
[QUẢNG CÁO]
```

Nếu đoạn đầu có 6 từ và đoạn hai có 7 từ, tổng là 13; Ads được đặt sau đoạn hai.

Lưu ý: nếu toàn bộ chương chỉ là một đoạn HTML rất dài, hệ thống không xé đoạn
đó thành nhiều phần. Placement chỉ có thể được chèn sau khi đoạn kết thúc.

### 3.10. Maximum insertions

Giới hạn số lần một placement được lặp trong một chương.

```text
Words between ads: 50
Maximum insertions: 5
```

Dù chương rất dài, placement đó không xuất hiện quá 5 lần. Luôn nên đặt giới hạn
để tránh làm gián đoạn trải nghiệm đọc.

### 3.11. Starts at và Ends at

Đây là lịch chạy quảng cáo.

- Để trống cả hai: chạy bất cứ lúc nào khi Enabled.
- Chỉ có Starts at: bắt đầu từ thời điểm đã chọn.
- Chỉ có Ends at: ngừng sau thời điểm đã chọn.
- Có cả hai: chỉ chạy trong khoảng thời gian đó.

Nếu `Ends at` đã qua, quảng cáo không hiển thị dù Enabled vẫn được bật.

Ví dụ ngày hiện tại là 23/06/2026 nhưng Ends at là 21/06/2026: placement đã hết
hạn và API sẽ không gửi nó cho frontend.

### 3.12. HTML, JavaScript, or external script URL

Nơi nhập code thật hoặc code thử nghiệm. Nội dung phải tương ứng với Code type.

Không lưu mật khẩu, API secret hoặc thông tin đăng nhập vào trường này. Các mã
publisher/slot công khai do Google cung cấp có thể nằm trong ad snippet.

### 3.13. Enabled

- Không chọn: lưu cấu hình nhưng không gửi ra website.
- Đã chọn: placement được xét theo phạm vi, vị trí, thiết bị và thời gian.

Enabled không có nghĩa là chắc chắn nhìn thấy quảng cáo. Script đối tác vẫn có
thể không trả inventory, bị ad blocker chặn hoặc từ chối domain local.

## 4. Ma trận tương thích quan trọng

| Mục tiêu | Position phù hợp | Ghi chú |
| --- | --- | --- |
| Homepage | TOP, BOTTOM, script hooks | Không dùng INLINE |
| Category pages | TOP, BOTTOM, script hooks | Không dùng INLINE |
| Story detail pages | TOP, BOTTOM, script hooks | INLINE không chạy ở trang chi tiết |
| Chapter reader | TOP, BOTTOM, INLINE, script hooks | INLINE dùng cho nội dung chương |
| One story detail page | TOP, BOTTOM, script hooks | Chỉ URL `/novels/{slug}` |
| All chapters of one story | INLINE, TOP, BOTTOM | Khớp `/novels/{slug}/*` |
| Content pages | TOP, BOTTOM, script hooks | About, FAQ, Contact... |

Nếu chọn tổ hợp không tương thích, placement có thể được lưu nhưng sẽ không có
renderer phù hợp để hiển thị.

## 5. Các cấu hình mẫu

### 5.1. Banner thử nghiệm đầu Homepage

```text
Placement name: Homepage - Top - Test
Show this ad on: A type of page
Page type: Homepage
Position: Top of page
Code type: HTML or ad-unit snippet
Device: Desktop and mobile
Priority: 0
Starts at: để trống
Ends at: để trống
Enabled: bật khi kiểm tra
```

Code:

```html
<div style="margin:16px auto;padding:24px;max-width:900px;background:#fff3cd;border:2px dashed #c0396b;text-align:center">
  TEST ADVERTISEMENT - HOMEPAGE TOP
</div>
```

### 5.2. Quảng cáo giữa mọi chương trên website

```text
Placement name: All readers - Inline - Google
Show this ad on: A type of page
Page type: Chapter reader
Position: Between chapter paragraphs
Words between ads: 50
Maximum insertions: 5
Code type: HTML or ad-unit snippet
Device: Desktop and mobile
Starts at: để trống
Ends at: để trống
Enabled: bật sau khi test
```

### 5.3. Quảng cáo giữa mọi chương của một truyện

```text
Placement name: Bracelet of Lies - Inline
Show this ad on: A specific page or novel
Target: All chapters of one story
Story: Bracelet of Lies
Position: Between chapter paragraphs
Words between ads: 50
Maximum insertions: 5
```

Không chọn `One story detail page`, vì lựa chọn đó không bao gồm các chương.

### 5.4. Banner chỉ trên trang chi tiết một truyện

```text
Placement name: Bracelet of Lies - Detail top
Show this ad on: A specific page or novel
Target: One story detail page
Story: Bracelet of Lies
Position: Top of page
```

Không chọn INLINE trong trường hợp này.

### 5.5. Script loader toàn website

```text
Placement name: Global - Head - Partner loader
Show this ad on: Entire website
Position: Head script
Code type: External HTTPS script
Code: https://partner.example.com/ads.js
Priority: 100
```

Script loader có thể không tạo quảng cáo nhìn thấy; nó chỉ chuẩn bị thư viện để
các ad unit khác hoạt động.

## 6. Kiểm tra trên local

Có thể kiểm tra vị trí và layout hoàn toàn trên local bằng HTML màu nổi bật.

1. Dán HTML test ở mục 5.1.
2. Bật Enabled.
3. Xóa Starts at và Ends at.
4. Mở đúng trang mục tiêu.
5. Kiểm tra desktop và mobile.
6. Khi đã đúng vị trí, thay bằng code thật.

Google Ads thật có thể không hiển thị trên `localhost` vì:

- Domain chưa được xác nhận.
- Tài khoản hoặc site chưa được duyệt.
- Không có inventory phù hợp.
- Script kiểm tra hostname và chỉ chạy trên production.
- Trình duyệt hoặc extension đang chặn quảng cáo.

Vì vậy, HTML test xác nhận được layout và scope; nó không xác nhận Google đã cấp
inventory cho domain.

## 7. Khi quảng cáo không hiển thị

Kiểm tra theo đúng thứ tự sau:

1. **Enabled đã bật chưa?**
2. **Ends at có nằm trong quá khứ không?**
3. **Starts at có nằm trong tương lai không?**
4. **Có đang mở đúng URL không?**
5. **Target là trang chi tiết hay tất cả chương?**
6. **INLINE có được dùng trên Chapter reader không?**
7. **Chương có nội dung thực để đếm từ không?**
8. **Số từ đã đạt Words between ads chưa?**
9. **Device có đúng desktop/mobile đang kiểm tra không?**
10. **Code type có khớp nội dung đã nhập không?**
11. **Thử thay code thật bằng HTML test có nhìn thấy không?**
12. **Tắt ad blocker hoặc mở cửa sổ ẩn danh.**
13. **Kiểm tra Console và Network trong DevTools.**
14. **Xác nhận domain production với Google/đối tác.**

Nếu HTML test hiển thị nhưng code Google không hiển thị, placement của website
đã hoạt động; vấn đề nằm ở script, tài khoản, domain hoặc inventory phía đối tác.

## 8. Ví dụ phân tích một cấu hình sai

```text
Show this ad on: /novels/tieuthuyet
Position: Between chapter paragraphs
Ends at: ngày hôm qua
Enabled: bật
```

Cấu hình này không hiển thị vì:

1. URL chỉ là trang chi tiết, không phải URL chương.
2. INLINE chỉ được render trong trang đọc chương.
3. Ends at đã hết hạn.

Cách sửa:

```text
Show this ad on: A type of page
Page type: Chapter reader
Position: Between chapter paragraphs
Ends at: để trống
Enabled: bật
```

## 9. Ghi chú cho người vận hành

- Tên placement phải mô tả được trang, vị trí và đối tác.
- Không tạo hai placement Enabled giống hệt nhau trên cùng target nếu không chủ ý.
- Luôn đặt Maximum insertions cho INLINE.
- Không dùng interval quá ngắn chỉ để tăng số lần hiển thị.
- Không đặt ngày kết thúc nếu quảng cáo phải chạy liên tục.
- Khi đổi script, nên tắt placement, sửa, kiểm tra rồi bật lại.
- Nên giữ placement cũ ở trạng thái Disabled thay vì xóa nếu cần đối chiếu.
- Trước khi deploy, kiểm tra cả desktop và mobile trên domain production.

## 10. Checklist bàn giao cho khách hàng

- [ ] Đăng nhập được Admin.
- [ ] Hiểu sự khác nhau giữa page type, story detail và all chapters.
- [ ] Hiểu TOP/BOTTOM khác INLINE.
- [ ] Biết để trống lịch khi không cần chiến dịch theo thời gian.
- [ ] Biết sử dụng HTML test trên local.
- [ ] Biết Google Ads thật có thể không chạy trên localhost.
- [ ] Biết chỉ `SUPER_ADMIN` được sửa raw script.
- [ ] Biết kiểm tra Enabled, target, schedule, device và ad blocker khi có lỗi.
- [ ] Đã kiểm tra code thật trên desktop và mobile production.
