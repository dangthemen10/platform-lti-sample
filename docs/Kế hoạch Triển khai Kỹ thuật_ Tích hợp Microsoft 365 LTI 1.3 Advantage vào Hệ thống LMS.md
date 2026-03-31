### Kế hoạch Triển khai Kỹ thuật: Tích hợp Microsoft 365 LTI 1.3 Advantage vào Hệ thống LMS

#### 1\. Tổng quan Chiến lược và Phạm vi Triển khai

Trong kỷ nguyên giáo dục số, việc tạo ra một hệ sinh thái học tập thống nhất là yếu tố tiên quyết để tối ưu hóa hiệu quả giảng dạy. Việc triển khai chuẩn  **LTI 1.3 Advantage Complete**  không chỉ là một kết nối kỹ thuật đơn thuần mà là chiến lược tích hợp sâu các trải nghiệm giáo dục của Microsoft — cụ thể là  **Teams Assignments LTI**  và  **OneDrive LTI**  — trực tiếp vào môi trường LMS của tổ chức.Giải pháp này thiết lập một quy trình làm việc tập trung cho việc quản lý bài tập và tệp tin, giúp phá vỡ các rào cản thao tác giữa các nền tảng khác nhau. Bằng cách tuân thủ các giao thức bảo mật hiện đại nhất, dự án đảm bảo tính toàn vẹn của dữ liệu điểm số và quyền riêng tư của người dùng, đồng thời mang lại trải nghiệm cộng tác thời gian thực liền mạch. Để đảm bảo thành công, đội ngũ triển khai cần đáp ứng các điều kiện kỹ thuật và phối hợp quản trị chặt chẽ được trình bày chi tiết trong các phần tiếp theo.

#### 2\. Yêu cầu Hệ thống và Chuẩn bị Tiền triển khai

Việc chuẩn bị đúng vai trò quản trị và thiết lập môi trường thử nghiệm là yếu tố quyết định để tránh gây gián đoạn cho hệ thống đang vận hành (production). Sự thiếu đồng bộ giữa bộ phận quản trị LMS và Microsoft 365 thường là rào cản lớn nhất dẫn đến việc cấu hình thất bại.

##### Phân định Vai trò và Trách nhiệm

Vai trò,Trách nhiệm chính  
LMS Administrator,"Bắt buộc:  Thực hiện đăng ký công cụ trên LMS, cấu hình các vị trí hiển thị (placements), và thực hiện khởi chạy công cụ lần đầu để kích hoạt hệ thống."  
Microsoft 365 Global Administrator,"Phê duyệt quyền ứng dụng trên Microsoft Entra ID, hỗ trợ xác thực định danh và hoàn thiện các thiết lập bảo mật cấp tổ chức."

##### Môi trường Thử nghiệm (Sandbox)

Đối với các đối tác (Microsoft Partners) thực hiện triển khai thay mặt khách hàng, việc sử dụng môi trường Sandbox là bắt buộc để kiểm thử chức năng:

* **Điều kiện:**  Cần có  **Microsoft Partner ID**  (đăng ký qua chương trình Microsoft AI Cloud Partner).  
* **Quy trình:**  Truy cập Microsoft Partner Center để yêu cầu môi trường  **Microsoft 365 Education Sandbox** . Tùy thuộc vào loại hình doanh nghiệp, bạn cần chọn phương thức phù hợp:  
* **ISV hoặc SI Partner:**  Yêu cầu sandbox phát triển/thử nghiệm để xây dựng và hỗ trợ tích hợp.  
* **Global Training Partner:**  Yêu cầu tham gia chương trình để cung cấp đào tạo và hỗ trợ trên sản phẩm Microsoft.

#### 3\. Tiêu chuẩn Kỹ thuật LTI 1.3 Advantage

Chuẩn  **LTI 1.3 Advantage Complete**  vượt trội hơn các phiên bản cũ nhờ việc chuyển đổi từ cơ chế OAuth 1.0 sang mô hình bảo mật dựa trên  **OpenID Connect (OIDC)**  và  **JSON Web Tokens (JWT)** , cung cấp khả năng tương tác sâu và bảo mật dữ liệu cấp cao.Hệ thống LMS của tổ chức cần triển khai đầy đủ 04 thành phần bắt buộc sau:

* **LTI Core Specification:**  Nền tảng kết nối cơ bản, tạo phiên làm việc bảo mật giữa LMS và Microsoft.  
* **Deep Linking Specification:**  Cho phép giảng viên lựa chọn và nhúng các tài nguyên OneDrive hoặc tạo bài tập Microsoft ngay trong luồng nội dung của LMS.  
* **Names and Roles Provisioning Services (NRPS):**  Tự động đồng bộ danh sách lớp, cho phép ứng dụng xác định vai trò giảng viên hoặc sinh viên.  
* **Assignment and Grading Services (AGS):**  Cho phép tự động chuyển giao điểm số từ Teams Assignments về bảng điểm (Gradebook) của LMS.*Lưu ý:*  Mặc dù không bắt buộc, nhưng việc hệ thống LMS sở hữu chứng nhận  **1EdTech LTI Certification**  là "bảo chứng" quan trọng nhất để đảm bảo tính tương thích và giảm thiểu lỗi phát sinh trong quá trình vận hành.

#### 4\. Cấu hình Đối khớp Định danh (User Matching) và Bảo mật

Cơ chế  **Identity Mapping**  (Khớp nối định danh) giữa Microsoft Entra ID và LMS là "xương sống" của toàn bộ hệ thống. Bất kỳ sai lệch nào trong dữ liệu định danh sẽ dẫn đến các lỗi nghiêm trọng như: không thể phân quyền tệp tin, không thể tự động tạo  **OneNote Class Notebooks** , và thất bại trong việc đồng bộ điểm số.

##### Yêu cầu về Trường dữ liệu Định danh

Để hệ thống hoạt động, yêu cầu kỹ thuật sau là bắt buộc:**Yêu cầu Bắt buộc:**  Trường dữ liệu Email của người dùng trong LMS (trùng với giá trị trả về từ dịch vụ NRPS) phải khớp hoàn toàn với  **User Principal Name (UPN)**  hoặc  **Primary Email address**  trong Microsoft Entra ID.

##### Cấu hình Trình duyệt

Người dùng cuối cần đảm bảo các thiết lập sau để tránh lỗi xác thực:

* **Cookies:**  Phải cho phép cookies bên thứ ba cho các ứng dụng Microsoft. Nếu gặp lỗi, hãy kiểm tra biểu tượng trên thanh địa chỉ trình duyệt (address bar icon) để cấp quyền thủ công.  
* **Popups:**  Tuyệt đối không chặn cửa sổ bật lên (Popups) cho các tên miền liên quan đến Microsoft 365, vì đây là cơ chế chính để đăng nhập và lựa chọn tài liệu.

#### 5\. Quy trình Triển khai Công cụ Microsoft 365 LTI

Quy trình này thiết lập kênh kết nối hai chiều giữa  **Microsoft LMS Gateway**  và nền tảng LMS của tổ chức. Khuyến nghị sử dụng mô hình "dual-tab" (mở song song hai tab trình duyệt) trong suốt quá trình cấu hình.

* **Đăng ký trên Microsoft LMS Gateway:**  
* Truy cập Gateway và đăng nhập bằng tài khoản Microsoft 365 Education (hoặc tài khoản sandbox).  
* Chọn  **Add new registration**  \-\>  **Microsoft 365 LTI** .  
* Đặt  **Registration name**  dễ nhận diện.  
* **Quan trọng:**  Tại mục chọn nền tảng LMS, hãy chọn  **"Other"**  để nhận các khóa (keys) kỹ thuật cần thiết cho cấu hình thủ công.  
* **Cấu hình trên hệ thống LMS:**  
* Tại tab LMS, tạo một cấu hình công cụ LTI 1.3 mới. Sao chép các giá trị từ Gateway vào các trường tương ứng trên LMS.  
* Lấy các URL nền tảng do LMS cung cấp (Platform URLs) và quay lại tab Gateway, chọn mục  **LMS provided registration keys**  để điền vào.  
* **Hoàn tất và Lưu trữ:**  
* Sau khi kiểm tra lại các giá trị trên trang  **Review and add** , nhấn  **Save** .  
* Toàn bộ khóa đăng ký sẽ được lưu trữ tại Gateway. Đây là nguồn dữ liệu quan trọng để quản trị viên truy cập khi cần xử lý sự cố (troubleshooting) hoặc khôi phục cấu hình LMS trong tương lai.

#### 6\. Thiết lập Vị trí (Placements) và Tham số Tùy chỉnh

Chiến lược đặt vị trí công cụ (Placements) quyết định tính tiện dụng và tối ưu hóa luồng công việc cho người dùng cuối.

##### Phân loại Vị trí (Placements)

* **Resource Launch placement:**  Thích hợp làm mục menu điều hướng khóa học, cho phép truy cập OneDrive Explorer và các tài nguyên chung.  
* **Deep Linking Launch placement:**  Sử dụng khi tạo hoạt động/bài tập mới. Khi giảng viên khởi chạy, công cụ sẽ tạo một liên kết tài nguyên kèm theo khả năng đồng bộ điểm số (lineItem) về LMS.

##### Tham số Tùy chỉnh (Custom Parameters)

Các tham số này cần được khai báo chính xác để LMS truyền đúng ngữ cảnh cho Microsoft 365 tại thời điểm khởi chạy:| Tham số | Biến LTI/LIS | Mô tả chức năng | Ví dụ biểu thức || \------ | \------ | \------ | \------ || **t** | ResourceLink.title | Tiêu đề của bài tập/tài nguyên | t=$ResourceLink.title || **dd** | ResourceLink.submission.endDateTime | Thời hạn nộp bài tập | dd=$ResourceLink.submission.endDateTime || **mp** | N/A | Điểm tối đa (lấy từ thuộc tính scoreMaximum) | mp=$ResourceLink.lineItem.scoreMaximum || **csid** | CourseOffering.sourcedId | Mã định danh duy nhất của khóa học | csid=$CourseOffering.sourcedId || **ssid** | CourseSection.sourcedId | Mã định danh của phân lớp/nhóm | ssid=$CourseSection.sourcedId |  
**Tính năng Sao chép Khóa học (Course Copying):**  Để cho phép giảng viên sao chép bài tập từ khóa học cũ sang khóa học mới mà không làm hỏng liên kết, quản trị viên  **phải**  cấu hình tham số: ContextHistory=$Context.id.history.

#### 7\. Kích hoạt Hệ thống và Kiểm soát Chất lượng (QA)

##### Kích hoạt lần đầu (First-run Experience)

Công cụ sẽ không khả dụng cho người dùng thông thường cho đến khi  **LMS Administrator**  thực hiện kích hoạt. Quản trị viên phải truy cập vào một khóa học và khởi chạy công cụ bằng một trong các URL vai trò LIS sau để kích hoạt deployment:

* http://purl.imsglobal.org/vocab/lis/v2/system/person\#Administrator  
* http://purl.imsglobal.org/vocab/lis/v2/institution/person\#Administrator

##### Kịch bản Kiểm thử (Test Cases)

* **Tạo bài tập:**  Sử dụng tệp tin mẫu (PPTX, XLSX, DOCX) để kiểm tra luồng tạo bài nộp.  
* **Cộng tác (Collaboration):**  Kiểm tra tính năng làm việc nhóm trên tài liệu dùng chung. Lưu ý: Giới hạn tối đa là  **250 thành viên**  cho mỗi phiên cộng tác.  
* **Đồng bộ điểm:**  Chấm điểm trên Teams Assignments và xác nhận điểm số hiển thị ngay lập tức tại Gradebook của LMS thông qua dịch vụ AGS.  
* **Kiểm tra Sao chép:**  Thực hiện sao chép bài tập có chứa tài nguyên OneDrive LTI sang khóa học khác và kiểm tra tính khả dụng của liên kết (dựa trên tham số Context.id.history).

##### Hỗ trợ và Phản hồi

Quản trị viên có thể liên hệ  **Microsoft Education Support**  để giải quyết các vấn đề triển khai chuyên sâu. Người dùng cuối (giảng viên/sinh viên) có thể gửi phản hồi hoặc yêu cầu hỗ trợ trực tiếp qua menu  **"Help and Feedback"**  ngay trong ứng dụng.Hệ thống hiện đã sẵn sàng phục vụ mục tiêu giảng dạy và học tập với sự ổn định, bảo mật và hiệu suất cao nhất.  
