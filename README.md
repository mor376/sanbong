# FAGLEAGUE247 – Hệ thống quản lý và đặt sân thể thao

## 1. Giới thiệu đồ án

FAGLEAGUE247 là ứng dụng web hỗ trợ khách hàng tra cứu sân thể thao, xem giá và lịch còn trống, gửi đặt sân và quản lý thông tin tài khoản. Quản trị viên sử dụng khu vực quản trị để theo dõi đặt sân, quản lý dữ liệu hoạt động và cập nhật trạng thái đơn. Ứng dụng còn có các nhóm dữ liệu đội bóng, cầu thủ và giải đấu.

Mô hình sân được tổ chức theo ba cấp **cụm sân → danh mục sân → sân con**. Ví dụ: cụm Gò Vấp có danh mục “Sân 5A”; bên trong danh mục có “Sân 1”, “Sân 2”… Mỗi sân con có lịch, trạng thái và giá riêng. Trên danh sách công khai, mỗi danh mục chỉ xuất hiện một thẻ; người dùng chọn sân con khi bắt đầu đặt.

Đồ án được xây dựng theo mô hình frontend – backend – database:

```text
Trình duyệt
    │
    ├── Frontend: Next.js, React, TypeScript (http://localhost:3000)
    │       │ REST API / JSON, JWT
    │       ▼
    └── Backend: Java 17, Spring Boot (http://localhost:8080)
                │
                ├── JPA: tài khoản và yêu cầu chủ sân
                └── JDBC: dữ liệu FAGLEAGUE
                         │
                         ▼
                 MariaDB / MySQL (XAMPP), database fag247
```

Frontend sử dụng Next.js App Router; backend cung cấp REST API JSON. Khi chạy local, frontend mặc định gọi backend tại `http://localhost:8080`; backend mặc định dùng profile `mysql` và MariaDB/MySQL.

### Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ backend | Java 17 |
| Framework backend | Spring Boot 3.3.5, Spring Web, Spring Data JPA |
| Bảo mật | Spring Security, JSON Web Token (JWT), BCrypt |
| Kết nối cơ sở dữ liệu | JDBC, MariaDB Connector/J |
| Cơ sở dữ liệu | MariaDB/MySQL, thường chạy bằng XAMPP |
| Giao diện | Next.js, React, TypeScript |
| Kiểm thử backend | JUnit 5, Spring Boot Test, MockMvc |
| Kiểm thử frontend | Vitest |

## 2. Chức năng đã thực hiện

### 2.1. Chức năng dành cho khách và thành viên

- Xem trang chủ, các môn thể thao, danh mục sân và sân đang hoạt động.
- Tìm sân theo môn, quy mô sân, khu vực và từ khóa; sắp xếp theo giá hoặc tên, xem dạng lưới/danh sách/bản đồ.
- Xem thông tin danh mục sân, địa chỉ cụm, mô tả, trạng thái hoạt động, giờ mở cửa và giá.
- Chọn sân con thuộc danh mục; mỗi sân con có lịch trống, giá và trạng thái riêng.
- Xem lịch sân theo ngày, phân biệt khung giờ đã đặt, đã qua và còn trống.
- Chọn thời gian đặt theo bước 30 phút (tối đa 4 giờ); hệ thống tính giá theo giá sân và quy tắc giá hiện hành.
- Kiểm tra mã khuyến mãi và xem số tiền được giảm trước khi đặt.
- Đăng ký, đăng nhập và đăng xuất tài khoản.
- Dùng JWT để xác thực các thao tác cần đăng nhập.
- Tạo đặt sân bằng tài khoản thành viên, điền thông tin liên hệ và ghi chú; chọn thanh toán tại sân hoặc chuyển khoản QR.
- Hệ thống kiểm tra ngày, giờ, trạng thái sân, giờ hoạt động và xung đột khung giờ trước khi lưu đơn.
- Xem lịch sử đặt sân và trạng thái đơn trong trang hồ sơ.
- Cập nhật họ tên, email, số điện thoại và đổi mật khẩu.
- Xem đánh giá cộng đồng; gửi đánh giá cho sân con, mỗi tài khoản có tối đa một đánh giá cho mỗi sân và có thể cập nhật đánh giá của mình.
- Xem danh sách/chi tiết giải đấu; gửi yêu cầu hợp tác làm chủ sân.
- Xem trang hướng dẫn, thông tin phần mềm và liên hệ hỗ trợ.

### 2.2. Chức năng dành cho quản trị viên

- Xem dashboard tổng quan số sân, đơn chờ, đơn đã xác nhận và doanh thu của đơn hoàn thành.
- Xem danh sách đơn đặt sân; cập nhật trạng thái `Pending`, `Confirmed`, `Completed` hoặc `Cancelled`.
- Quản lý dữ liệu FAGLEAGUE: cụm sân, môn thể thao, sân con, quy tắc giá và khung giờ.
- Quản lý danh mục sân (ví dụ “Sân 5A”, “Sân 5B”) và liên kết sân con với đúng danh mục.
- Quản lý dịch vụ, khuyến mãi và nhân viên.
- Quản lý đội bóng, cầu thủ, giải đấu, bảng đấu, trận đấu, thống kê cầu thủ và bảng xếp hạng.
- Xem khách hàng và lịch sử đặt sân gắn với tài khoản.
- Tạo hóa đơn cho đơn đặt sân và ghi nhận các khoản thanh toán.
- Tìm kiếm, phân trang danh sách người dùng; khóa/mở khóa tài khoản và hỗ trợ đổi mật khẩu.
- Xem và cập nhật trạng thái yêu cầu chủ sân.
- Đặt sân hộ khách từ trang quản trị.

### 2.3. Quy tắc và bảo mật

- Các endpoint quản trị yêu cầu tài khoản có vai trò `ADMIN`.
- Các endpoint cá nhân yêu cầu JWT hợp lệ; đăng ký và đăng nhập được phép truy cập công khai.
- Dữ liệu request được kiểm tra bằng Jakarta Bean Validation, ví dụ định dạng email, số điện thoại, ngày giờ và giới hạn độ dài.
- Mật khẩu được mã hóa bằng BCrypt, không lưu mật khẩu dạng văn bản thuần.
- Trạng thái đơn đặt sân trong FAGLEAGUE: `Pending`, `Confirmed`, `Completed`, `Cancelled`.
- Khung đặt sân phải hợp lệ và theo bước 30 phút; không thể đặt vào giờ đã qua, ngoài giờ mở cửa hoặc khung đã bị đặt.
- Nếu không có quy tắc giá phù hợp, giá thường/cao điểm của sân con được dùng làm phương án tính giá.
- Những bảng có dữ liệu liên quan được bảo vệ bởi khóa ngoại; không nên xóa bản ghi cha khi còn bản ghi phụ thuộc.

### 2.4. Luồng dữ liệu sân

```text
SportsCenters (cụm sân / địa điểm)
  └── PitchCategories (danh mục sân, ví dụ Sân 5A)
        └── SubFields (sân con, ví dụ Sân 1, Sân 2)
              ├── lịch đặt và khung giờ
              ├── trạng thái hoạt động
              └── giá thường / giá cao điểm
```

Tên “Sân 1” được đánh số trong phạm vi danh mục, nên các danh mục khác nhau có thể cùng có sân con tên “Sân 1”. ID sân con vẫn là ID riêng để giữ liên kết đến lịch đặt, đánh giá và dữ liệu liên quan. Khi xem danh sách công khai, tiêu đề thẻ là tên danh mục; trong bước đặt sân, người dùng chọn một sân con thuộc danh mục đó.

## 3. Cấu trúc dữ liệu

Database chính có tên `fag247`. Các bảng được chia thành những nhóm nghiệp vụ:

| Nhóm | Các bảng |
|---|---|
| Tài khoản và khách hàng | `Users`, `Customers`, `Staff` |
| Sân và giá | `SportsCenters`, `Sports`, `PitchCategories`, `SubFields`, `PricingRules`, `FieldTimeSlots` |
| Đặt sân và thanh toán | `Bookings`, `BookingServices`, `Invoices`, `Payments`, `Promotions`, `Services` |
| Giải đấu | `Teams`, `Players`, `Tournaments`, `TournamentGroups`, `Matches`, `PlayerMatchStats`, `Standings` |
| Đánh giá | `SubFieldReviews` |
| Yêu cầu chủ sân | `yeu_cau_chu_san` |

Backend dùng JPA cho `Users` và `yeu_cau_chu_san`; các nghiệp vụ FAGLEAGUE đọc/ghi trực tiếp các bảng FAGLEAGUE bằng JDBC. `PitchCategories` là danh mục ở giữa `SportsCenters` và `SubFields`; `SubFields.CategoryID` liên kết sân con với danh mục. Đánh giá được lưu trong `SubFieldReviews`.

Các bảng legacy tiếng Việt đã được loại khỏi backend và database đang dùng. Những bảng đó không phải nguồn dữ liệu của các màn hình FAGLEAGUE hiện tại; backend không còn entity/API tương ứng để Hibernate tạo lại chúng.

Khi chạy với profile `mysql`, `PitchCategorySchema` kiểm tra và bổ sung bảng/cột liên kết danh mục nếu database cũ chưa có, sau đó gắn các sân hiện hữu vào danh mục phù hợp. File `backend/src/main/resources/db/fag247-category-structure.sql` là migration SQL thủ công tương ứng; chỉ dùng khi cần triển khai migration ngoài ứng dụng, và luôn sao lưu database trước.

## 4. Yêu cầu trước khi chạy

Cài đặt và kiểm tra:

1. **JDK 17 trở lên**
   ```powershell
   java -version
   javac -version
   ```
2. **Apache Maven**
   ```powershell
   mvn -version
   ```
3. **Node.js và npm** (dùng bản LTS phù hợp với phiên bản Next.js trong `frontend/package-lock.json`)
   ```powershell
   node --version
   npm --version
   ```
4. **XAMPP** có MariaDB/MySQL đang chạy, thông thường ở cổng `3306`.
5. Mở PowerShell tại thư mục dự án:
   ```powershell
   Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong'
   ```

Nếu `mvn` hoặc `npm` báo không nhận diện, hãy cài công cụ tương ứng và thêm thư mục `bin` của Maven hoặc Node.js vào `PATH`, sau đó mở lại terminal. Trên PowerShell, có thể gọi npm bằng `npm.cmd`.

## 5. Cài đặt database XAMPP

### 5.1. Kết nối tới database đã có

Nếu XAMPP đã có database `fag247` và dữ liệu cần dùng, **không nạp lại dữ liệu mẫu**. Kiểm tra XAMPP Control Panel đang chạy MySQL, sau đó xem cấu hình kết nối ở:

- `backend/src/main/resources/application-mysql.properties`
- Các biến môi trường tùy chọn `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`

Cấu hình mặc định:

| Thuộc tính | Giá trị mặc định |
|---|---|
| Địa chỉ | `127.0.0.1:3306` |
| Database | `fag247` |
| Tài khoản | `root` |
| Mật khẩu | Để trống (cấu hình XAMPP phổ biến) |

Ứng dụng không tự tạo hoặc đặt lại tài khoản quản trị MySQL. Tài khoản đăng nhập website được lấy từ bảng `Users`.

### 5.2. Tạo database lần đầu

Chỉ thực hiện phần này khi đang cài một database mới và đã kiểm tra đúng máy chủ/database đích. File schema dùng `CREATE TABLE IF NOT EXISTS`, nhưng không thay thế cho việc sao lưu dữ liệu trước khi thao tác:

```powershell
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong'
cmd.exe /c "C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < backend\src\main\resources\db\fag247.sql"
```

Nếu MySQL có mật khẩu, thêm `-p` sau `-u root`; MySQL sẽ yêu cầu nhập mật khẩu:

```powershell
cmd.exe /c "C:\xampp\mysql\bin\mysql.exe -u root -p --default-character-set=utf8mb4 < backend\src\main\resources\db\fag247.sql"
```

### 5.3. Dữ liệu mẫu (không bắt buộc)

`backend/src/main/resources/db/fag247-booking-samples.sql` dùng để đưa dữ liệu minh họa về cụm sân, sân, khách hàng, đặt sân và khung giờ vào FAGLEAGUE.

> **Cẩn thận:** script có bước dọn các bản ghi mẫu đã nhận diện trước khi nạp lại, đồng thời cập nhật một số dữ liệu mẫu. Không chạy trên database sản xuất hoặc database có dữ liệu cần giữ nếu chưa sao lưu và chưa kiểm tra nội dung script. Với database đang được website sử dụng, thường không cần chạy lại script này.

Chỉ khi chủ động tạo/cập nhật dữ liệu demo và đã sao lưu database, chạy từ thư mục gốc:

```powershell
cmd.exe /c "C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < backend\src\main\resources\db\fag247-booking-samples.sql"
```

Nếu có mật khẩu, thêm `-p` như hướng dẫn bên trên. Trước khi chạy với dữ liệu thật, tạo bản sao lưu, ví dụ:

```powershell
cmd.exe /c "C:\xampp\mysql\bin\mysqldump.exe -u root --single-transaction --default-character-set=utf8mb4 fag247 > fag247-backup.sql"
```

### 5.4. Cập nhật cấu trúc danh mục sân

Với backend chạy profile `mysql`, migration danh mục sân được kiểm tra/chạy khi ứng dụng khởi động. Nếu cần chạy migration thủ công thay vì để ứng dụng thực hiện, dùng script `backend/src/main/resources/db/fag247-category-structure.sql` sau khi sao lưu và xác nhận đúng database:

```powershell
cmd.exe /c "C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 fag247 < backend\src\main\resources\db\fag247-category-structure.sql"
```

Không chạy đồng thời cả hai cách trên database đang được sử dụng nếu chưa kiểm tra trạng thái schema và dữ liệu.

## 6. Cấu hình và khởi động Backend

### 6.1. Cấu hình kết nối

Profile mặc định của backend là `mysql`, chạy ở cổng `8080`. Có thể cấu hình các biến môi trường trong cửa sổ PowerShell **trước khi chạy Maven**:

```powershell
$env:DB_URL = 'jdbc:mariadb://127.0.0.1:3306/fag247?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Ho_Chi_Minh'
$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = ''
$env:JWT_SECRET = 'thay-bang-chuoi-bi-mat-rieng-it-nhat-32-ky-tu'
```

Không đưa mật khẩu database hoặc JWT secret thật lên Git, README, ảnh chụp màn hình hay mã nguồn.

### 6.2. Cài dependencies và chạy

Mở terminal thứ nhất:

```powershell
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong\backend'
mvn clean test
mvn spring-boot:run
```

Khi backend khởi động thành công, API phục vụ tại `http://localhost:8080`. Giữ terminal này mở trong suốt thời gian sử dụng ứng dụng.

Để chạy riêng kiểm thử:

```powershell
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong\backend'
mvn test
```

### 6.3. Chạy bằng VS Code

- Mở thư mục dự án hoặc thư mục `backend` trong VS Code.
- Chờ Java Language Server hoàn tất import Maven.
- Mở `backend/src/main/java/com/sanbong/SanBongApplication.java`.
- Chọn **Run Java** hoặc **Debug Java** trên lớp `SanBongApplication`.

Không nên chạy `debugjava -cp target\classes ...` bằng tay: classpath đó thường thiếu các thư viện Maven mà ứng dụng cần.

## 7. Cài đặt và khởi động Frontend

Mở terminal thứ hai, để backend tiếp tục chạy:

```powershell
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong\frontend'
npm.cmd ci
npm.cmd run dev
```

Mở website tại `http://localhost:3000`. Frontend mặc định gọi API `http://localhost:8080`. Nếu backend chạy ở địa chỉ khác, cấu hình `NEXT_PUBLIC_API_URL` trong `frontend/.env.local`, rồi khởi động lại frontend.

Các lệnh frontend khác:

```powershell
npm.cmd run build
npm.cmd start
npm.cmd test
```

- `npm.cmd run dev`: chạy máy chủ phát triển.
- `npm.cmd run build`: kiểm tra TypeScript và tạo bản build production.
- `npm.cmd start`: chạy bản build production sau khi build.
- `npm.cmd test`: chạy kiểm thử Vitest.

## 8. Các trang chính

| Đường dẫn | Nội dung |
|---|---|
| `/shop` | Trang chủ, giới thiệu, môn thể thao và danh mục sân nổi bật |
| `/tim-san` | Tìm/lọc/sắp xếp sân; xem lưới, danh sách hoặc bản đồ; chọn danh mục và sân con để đặt |
| `/san-bong/{id}` | Thông tin chi tiết sân con và danh mục liên quan |
| `/dang-ky` | Tạo tài khoản thành viên |
| `/dang-nhap` | Đăng nhập |
| `/shop/ho-so` | Hồ sơ, bảo mật và lịch sử đặt sân của thành viên |
| `/danh-gia` | Danh sách đánh giá và chia sẻ trải nghiệm |
| `/giai-dau` | Danh sách giải đấu |
| `/giai-dau/{id}` | Chi tiết một giải đấu |
| `/huong-dan` | Hướng dẫn sử dụng |
| `/phan-mem` | Giới thiệu nền tảng/phần mềm |
| `/lien-he` | Kênh liên hệ, hỗ trợ và biểu mẫu hợp tác |
| `/admin` | Dashboard, đơn chờ và tổng quan doanh thu |
| `/admin/fagleague` | Tổng quan và lối vào các nhóm dữ liệu |
| `/admin/fagleague/{module}` | Quản lý cụm sân, môn, danh mục sân, sân con, dịch vụ, giá, khuyến mãi, nhân viên và dữ liệu giải đấu |
| `/admin/dat-san` | Quản lý đặt sân |
| `/admin/san-bong` | Quản lý sân |
| `/admin/dich-vu` | Quản lý dịch vụ |
| `/admin/khuyen-mai` | Quản lý khuyến mãi |
| `/admin/nhan-vien` | Quản lý nhân viên |
| `/admin/giai-dau` | Quản lý dữ liệu giải đấu |
| `/admin/hoa-don` | Hóa đơn và thanh toán |
| `/admin/nguoi-dung` | Tìm kiếm và quản lý tài khoản thành viên |
| `/admin/yeu-cau-chu-san` | Xem và xử lý yêu cầu chủ sân |
| `/admin/tai-khoan` | Hồ sơ và bảo mật tài khoản quản trị |

Liên kết dạng `/tim-san?sanId={id}` mở danh sách đã lọc theo sân con có ID đó; thẻ hiển thị tên danh mục chứa sân con, không phải tên “Sân 1/Sân 2”. Đây là liên kết sâu để mở đúng danh mục khi chuyển từ trang chi tiết hoặc từ nơi khác trong website.

## 9. API chính

Các API trả dữ liệu JSON. Lỗi nghiệp vụ được trả thành JSON có thông báo để frontend hiển thị. Với API cần đăng nhập, gửi token:

```http
Authorization: Bearer <JWT>
```

### Xác thực và hồ sơ

| Phương thức | Endpoint | Quyền |
|---|---|---|
| `POST` | `/api/auth/dang-ky` | Công khai |
| `POST` | `/api/auth/dang-nhap` | Công khai |
| `GET` | `/api/auth/me` | Thành viên |
| `PUT` | `/api/auth/me` | Thành viên |
| `PUT` | `/api/auth/doi-mat-khau` | Thành viên |

### Tra cứu và đặt sân

| Phương thức | Endpoint | Quyền |
|---|---|---|
| `GET` | `/api/platform/sports`, `/api/platform/sports-centers`, `/api/platform/subfields` | Công khai |
| `GET` | `/api/platform/pitches`, `/api/platform/pitches/{id}` | Công khai |
| `GET` | `/api/platform/pitches/available?date=&startTime=&endTime=&sportId=` | Công khai |
| `GET` | `/api/platform/pitches/{id}/schedule?date=` | Công khai |
| `GET` | `/api/platform/pricing-rules`, `/api/platform/time-slots` | Công khai |
| `GET` | `/api/platform/bookings/mine` | Thành viên |
| `POST` | `/api/platform/bookings` | Thành viên |
| `POST` | `/api/platform/promotions/validate` | Thành viên |

### Giải đấu, cộng đồng và biểu mẫu

| Phương thức | Endpoint | Quyền |
|---|---|---|
| `GET` | `/api/platform/teams`, `/api/platform/players` | Công khai |
| `GET` | `/api/platform/tournaments`, `/api/platform/tournaments/{id}` | Công khai |
| `GET` | `/api/platform/groups`, `/api/platform/matches`, `/api/platform/standings`, `/api/platform/player-stats` | Công khai |
| `GET` | `/api/platform/reviews`, `/api/platform/reviews/mine` | Công khai / thành viên |
| `POST`, `PUT` | `/api/platform/reviews`, `/api/platform/reviews/{id}` | Thành viên |
| `POST` | `/api/yeu-cau-chu-san` | Công khai |

### Quản trị

| Phương thức | Endpoint | Quyền |
|---|---|---|
| `GET` | `/api/platform/overview` | Admin |
| `GET` | `/api/platform/admin/bookings`, `/api/platform/admin/customers` | Admin |
| `GET` | `/api/platform/admin/users/{userId}/bookings` | Admin |
| `PUT` | `/api/platform/admin/bookings/{id}/status` | Admin |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/platform/admin/{sports-centers\|sports\|pitch-categories\|subfields\|pricing-rules\|services\|promotions\|staff\|teams\|players\|tournaments\|groups\|matches\|player-stats\|standings}` | Admin |
| `GET` | `/api/platform/admin/invoices` | Admin |
| `POST` | `/api/platform/admin/bookings/{id}/invoice` | Admin |
| `POST` | `/api/platform/admin/bookings/{id}/payments` | Admin |
| `GET` | `/api/admin/nguoi-dung?q=&trang=0&kichThuoc=20` | Admin |
| `PUT` | `/api/admin/nguoi-dung/{id}/trang-thai` | Admin |
| `PUT` | `/api/admin/nguoi-dung/{id}/doi-mat-khau` | Admin |
| `GET` | `/api/admin/yeu-cau-chu-san` | Admin |
| `PUT` | `/api/admin/yeu-cau-chu-san/{id}/trang-thai` | Admin |

## 10. Kiểm thử và nghiệm thu

Chạy các lệnh sau từ đúng thư mục:

```powershell
# Backend
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong\backend'
mvn test

# Frontend
Set-Location 'C:\Users\nguye\Desktop\sanbong\sanbong\frontend'
npm.cmd test
npm.cmd run build
```

Khi nghiệm thu thủ công, có thể kiểm tra lần lượt:

1. XAMPP MySQL đang chạy và database `fag247` truy cập được.
2. Backend khởi động trên cổng `8080`, không báo lỗi kết nối database.
3. Frontend mở được tại cổng `3000` và gọi được backend.
4. Khách xem được sân, giá, lịch trống; đặt thử một khung giờ hợp lệ.
5. Kiểm tra khung giờ đó không thể bị đặt trùng và đơn xuất hiện trong lịch sử.
6. Admin đăng nhập, thấy đơn mới, đổi được trạng thái và dữ liệu cập nhật trên database.
7. Kiểm tra hồ sơ, đổi mật khẩu, đánh giá, hóa đơn/thanh toán và yêu cầu chủ sân theo quyền tương ứng.

## 11. Xử lý một số lỗi thường gặp

### `mvn` hoặc `npm` không được nhận diện

- Cài JDK/Maven hoặc Node.js/npm.
- Kiểm tra `JAVA_HOME` và `PATH`.
- Đóng/mở lại terminal sau khi cài.
- Trên PowerShell Windows, thử `npm.cmd` thay vì `npm`.

### `debugjava.ps1 cannot be loaded` hoặc `running scripts is disabled`

Đây là chính sách chạy script của PowerShell, không phải lỗi biên dịch ứng dụng. Cách ưu tiên là chạy lớp `SanBongApplication` bằng chức năng **Run Java** trong VS Code. Nếu được phép trong máy của bạn, có thể tạm thời cho phép script trong phiên PowerShell hiện tại:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

Thay đổi `Process` chỉ áp dụng cho cửa sổ PowerShell đang mở; không cần đổi chính sách toàn máy.

### Frontend báo `Failed to fetch`

- Xác nhận backend đang chạy tại `http://localhost:8080`.
- Kiểm tra XAMPP MySQL và kết nối `fag247`.
- Kiểm tra `NEXT_PUBLIC_API_URL` trong `frontend/.env.local`.
- Sau khi sửa `.env.local`, khởi động lại Next.js.

### Lỗi cổng đã được sử dụng

Kiểm tra cổng `3000` (Next.js) hoặc `8080` (Spring Boot) đang bị chương trình khác chiếm hay không. Dừng đúng tiến trình cũ hoặc cấu hình cổng khác; không khởi động nhiều bản backend cùng kết nối nếu chưa cần thiết.

### Đăng nhập không được

- Tài khoản website nằm trong bảng `Users`; đây là tài khoản của ứng dụng, khác với tài khoản MySQL.
- Dùng tài khoản đã đăng ký hoặc tài khoản admin đã được cấu hình trong database.
- Không có mật khẩu admin mặc định được bảo đảm trong README này.
- Nếu frontend vừa đổi thông tin API, tải lại trang và đăng nhập lại.

### Không thấy dữ liệu mới trong phpMyAdmin

Đảm bảo đang xem đúng máy chủ `127.0.0.1:3306`, database `fag247` và đúng bảng FAGLEAGUE như `Bookings`, `Payments`, `Invoices`, `SubFieldReviews`. Tên bảng legacy đã bỏ không còn là nguồn dữ liệu cho website.

## 12. Cây thư mục chính

```text
sanbong/
├── README.md
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/sanbong/
│       │   ├── config/       # Cấu hình Spring, schema đánh giá
│       │   ├── controller/   # REST API
│       │   ├── dto/          # Request/response
│       │   ├── entity/       # Entity JPA
│       │   ├── exception/    # Xử lý lỗi API
│       │   ├── repository/   # Repository
│       │   ├── security/     # JWT và bảo mật
│       │   └── service/      # Nghiệp vụ
│       ├── main/resources/
│       │   ├── db/           # Schema FAGLEAGUE và dữ liệu mẫu
│       │   ├── application.properties
│       │   └── application-mysql.properties
│       └── test/             # Kiểm thử backend
└── frontend/
    ├── app/                  # Trang Next.js
    ├── components/           # Thành phần giao diện dùng chung
    ├── lib/                  # API client và tiện ích
    ├── package.json
    └── package-lock.json
```

## 13. Ghi chú khi phát triển

- Chạy backend và frontend trong **hai terminal riêng**.
- Giữ nguyên database hiện có; sao lưu trước khi sửa schema hoặc chạy SQL mẫu.
- `fag247.sql` là file tạo schema cho lần cài mới. `fag247-booking-samples.sql` dành cho dữ liệu minh họa và có thao tác dọn dữ liệu demo được đánh dấu.
- Không chạy script SQL mẫu tùy tiện trên database chứa dữ liệu cần giữ.
- Các thay đổi quyền truy cập API phải được kiểm tra đồng thời ở backend và giao diện.
- Khi thêm biến môi trường mới, ghi tên và mục đích trong tài liệu nhưng không ghi giá trị bí mật.
