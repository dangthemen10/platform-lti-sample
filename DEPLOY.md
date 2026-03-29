# 📘 Hướng Dẫn Deploy Education Hub lên Vercel

## Mục lục
1. [Chuẩn bị môi trường](#1-chuẩn-bị-môi-trường)
2. [Cài đặt và chạy local](#2-cài-đặt-và-chạy-local)
3. [Tạo RSA Key Pair](#3-tạo-rsa-key-pair)
4. [Setup MongoDB Atlas](#4-setup-mongodb-atlas)
5. [Deploy lên Vercel](#5-deploy-lên-vercel)
6. [Cấu hình biến môi trường trên Vercel](#6-cấu-hình-biến-môi-trường-trên-vercel)
7. [Đăng ký Tool trên Microsoft LTI Gateway](#7-đăng-ký-tool-trên-microsoft-lti-gateway)
8. [Kiểm tra và Debug](#8-kiểm-tra-và-debug)

---

## 1. Chuẩn bị môi trường

**Yêu cầu:**
- Node.js >= 18.17.0
- npm >= 9.0.0
- Git
- Tài khoản [Vercel](https://vercel.com) (miễn phí)
- Tài khoản [MongoDB Atlas](https://www.mongodb.com/atlas) (miễn phí M0)
- Quyền truy cập Microsoft LTI Gateway Admin Portal

---

## 2. Cài đặt và chạy local

```bash
# Clone hoặc tạo project
git init education-hub
cd education-hub

# Cài dependencies
npm install

# Copy file env mẫu
cp .env.local.example .env.local

# Chạy dev server
npm run dev
```

Truy cập: http://localhost:3000

---

## 3. Tạo RSA Key Pair

Key này dùng để sign session JWT và expose JWKS endpoint.

```bash
npm run generate-keys
```

**Output:**
```
🔐 Đang tạo cặp RSA 2048-bit key pair...

✅ Private key đã lưu: keys/private.pem
✅ Public key đã lưu: keys/public.pem
✅ JWKS đã lưu: keys/jwks.json

============================================================
📋 HƯỚNG DẪN: Copy giá trị sau vào file .env.local

LTI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBAD...\n-----END PRIVATE KEY-----"
LTI_KEY_ID=education-hub-key-1234567890
============================================================
```

**Quan trọng:** Copy hai dòng `LTI_PRIVATE_KEY` và `LTI_KEY_ID` vào file `.env.local`.

---

## 4. Setup MongoDB Atlas

### Bước 4.1: Tạo Cluster miễn phí
1. Đăng ký tại https://www.mongodb.com/atlas
2. Tạo cluster **M0 Free Tier** (chọn region gần nhất, ví dụ: Singapore)
3. Tạo database user: Security > Database Access > Add New User
   - Username: `education-hub-user`
   - Password: tạo password mạnh (lưu lại!)
   - Role: `readWriteAnyDatabase`

### Bước 4.2: Cấu hình Network Access
1. Security > Network Access > Add IP Address
2. **Development:** Click "Allow Access from Anywhere" (0.0.0.0/0)
3. **Production:** Thêm IP của Vercel (hoặc giữ 0.0.0.0/0 vì Vercel dùng dynamic IP)

### Bước 4.3: Lấy Connection String
1. Clusters > Connect > Connect your application
2. Driver: Node.js, Version: 6.x or later
3. Copy connection string, thay `<password>` bằng password vừa tạo:
   ```
   mongodb+srv://education-hub-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/education_hub
   ```
4. Điền vào `MONGODB_URI` trong `.env.local`

### Bước 4.4: Seed dữ liệu mẫu
```bash
npm run seed
```

---

## 5. Deploy lên Vercel

### Cách 1: Dùng Vercel CLI (khuyến nghị)

```bash
# Cài Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (lần đầu sẽ hỏi một số config)
vercel

# Trả lời các câu hỏi:
# ? Set up and deploy? → Yes
# ? Which scope? → [chọn account của bạn]
# ? Link to existing project? → No
# ? What's your project's name? → education-hub
# ? In which directory is your code located? → ./
# ? Want to override the settings? → No
```

Sau khi deploy xong, bạn sẽ nhận được URL dạng:
```
https://education-hub-xxxx.vercel.app
```

### Cách 2: Dùng GitHub Integration

1. Push code lên GitHub:
   ```bash
   git add .
   git commit -m "feat: initial LTI 1.3 integration"
   git push origin main
   ```

2. Vào https://vercel.com/new
3. Import GitHub repository
4. Click **Deploy**

---

## 6. Cấu hình biến môi trường trên Vercel

Vào **Vercel Dashboard > Project > Settings > Environment Variables**

Thêm từng biến sau:

| Tên biến | Giá trị | Môi trường |
|----------|---------|------------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |
| `LTI_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Production, Preview, Development |
| `LTI_KEY_ID` | `education-hub-key-xxx` | Production, Preview, Development |
| `LTI_CLIENT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Production, Preview |
| `LTI_ISSUER` | `https://login.microsoftonline.com/TENANT_ID/v2.0` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://education-hub-xxxx.vercel.app` | Production |
| `NEXT_PUBLIC_LTI_CLIENT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Production, Preview |
| `NEXT_PUBLIC_LTI_ISSUER` | `https://login.microsoftonline.com/TENANT_ID/v2.0` | Production, Preview |

### ⚠️ Lưu ý quan trọng về LTI_PRIVATE_KEY

Khi copy private key PEM vào Vercel, **phải giữ nguyên format `\n`** (không phải newline thực):

```
# ĐÚNG (dùng \n literal):
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----

# SAI (newline thực — sẽ bị Vercel cắt bỏ):
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBg...
-----END PRIVATE KEY-----
```

Sau khi thêm tất cả biến, click **Redeploy** để áp dụng.

---

## 7. Đăng ký Tool trên Microsoft LTI Gateway

### Bước 7.1: Truy cập LTI Admin Portal

URL thường là: `https://lti.microsoft.com/admin` hoặc qua Microsoft Teams Admin Center.

### Bước 7.2: Tạo Tool Registration mới

Điền các thông tin sau (dùng URL Vercel thực của bạn):

| Trường | Giá trị |
|--------|---------|
| **Tool Name** | Education Hub |
| **Tool URL** (Target Link URI) | `https://your-app.vercel.app/dashboard` |
| **Login URL** (OIDC Initiation) | `https://your-app.vercel.app/api/lti/login` |
| **Redirect URIs** | `https://your-app.vercel.app/api/lti/launch` |
| **Public JWK Set URL** | `https://your-app.vercel.app/api/lti/keys` |
| **Supported Message Types** | LtiResourceLinkRequest |

### Bước 7.3: Lưu thông tin từ Microsoft

Sau khi đăng ký thành công, Microsoft sẽ cấp:
- **Client ID** → điền vào `LTI_CLIENT_ID` và `NEXT_PUBLIC_LTI_CLIENT_ID`
- **Deployment ID** → điền vào `deploymentId` trong MongoDB registration

### Bước 7.4: Cập nhật MongoDB Registration

Dùng MongoDB Atlas UI hoặc Compass để update document trong `lti_registrations`:

```json
{
  "clientId": "CLIENT_ID_TỪ_MICROSOFT",
  "issuer": "https://login.microsoftonline.com/TENANT_ID/v2.0",
  "authEndpoint": "https://login.microsoftonline.com/TENANT_ID/oauth2/v2.0/authorize",
  "jwksUri": "https://login.microsoftonline.com/TENANT_ID/discovery/v2.0/keys",
  "tokenEndpoint": "https://login.microsoftonline.com/TENANT_ID/oauth2/v2.0/token",
  "redirectUri": "https://your-app.vercel.app/api/lti/launch",
  "targetLinkUri": "https://your-app.vercel.app/dashboard",
  "deploymentId": "1",
  "isActive": true
}
```

---

## 8. Kiểm tra và Debug

### Test JWKS endpoint
```bash
curl https://your-app.vercel.app/api/lti/keys
```

Kết quả mong đợi:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "education-hub-key-xxx",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### Test Login Initiation (simulate Microsoft call)
```bash
curl "https://your-app.vercel.app/api/lti/login?\
iss=https://login.microsoftonline.com/TENANT_ID/v2.0&\
client_id=YOUR_CLIENT_ID&\
login_hint=test&\
target_link_uri=https://your-app.vercel.app/dashboard"
```

Kết quả mong đợi: HTTP 302 redirect sang Microsoft login page.

### Xem Vercel Function Logs
```bash
vercel logs --follow
```

Hoặc vào Vercel Dashboard > Project > Functions tab để xem real-time logs.

---

## 9. Các lỗi thường gặp

### Lỗi: "Không tìm thấy LTI Registration"
- Kiểm tra `issuer` trong DB có khớp với `iss` Microsoft gửi không
- Verify `isActive: true`
- Chạy lại `npm run seed` nếu cần

### Lỗi: "JWT verification thất bại"
- Kiểm tra `jwksUri` trong registration có đúng không
- Kiểm tra `clientId` (audience) có khớp không
- Clock skew: Vercel server time có thể lệch — đã set `clockTolerance: 5 minutes`

### Lỗi: "LTI_PRIVATE_KEY không hợp lệ"
- Đảm bảo format `\n` đúng trong Vercel env var
- Thử generate lại key với `npm run generate-keys`

### Lỗi: Cookie `edu_session` không được set
- Kiểm tra `sameSite` — nếu Tool chạy trong iframe cần `sameSite: 'none'` + `secure: true`
- Trong next.config.mjs, đảm bảo Content-Security-Policy cho phép Microsoft domain

### Lỗi MongoDB: "Too Many Connections"
- lib/mongodb.js đã có caching — kiểm tra xem có import đúng chưa
- Giảm `maxPoolSize` xuống còn 5 nếu dùng free tier Atlas

---

## 10. Bước tiếp theo (LTI Advantage Services)

Sau khi luồng cơ bản hoạt động, bạn có thể mở rộng với:

- **Names and Roles Provisioning Service (NRPS):** Lấy danh sách học sinh trong lớp
- **Assignment and Grades Service (AGS):** Trả điểm về LMS tự động
- **Deep Linking:** Cho phép giảng viên chọn tài liệu OneDrive và nhúng vào LMS

Tất cả các service này cần `tokenEndpoint` và scope `https://purl.imsglobal.org/spec/lti-ags/scope/lineitem`.
