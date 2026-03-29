# Education Hub — LTI 1.3 Platform

## Vai trò đúng trong kiến trúc LTI 1.3

```
Education Hub (ta build)        = Platform / LMS
      ↓ đăng ký 1 lần
Microsoft LTI Gateway           = Broker / OIDC Provider trung gian
      ↓ route đến
Microsoft 365 Tools             = LTI Tools (OneDrive, Teams, SharePoint...)
```

Education Hub là **Platform chủ động** — user đăng nhập vào đây,
rồi từ đây mở các tool Microsoft thông qua LTI 1.3.

---

## Cấu trúc thư mục

```
education-hub/
├── app/
│   ├── api/
│   │   ├── lti/
│   │   │   ├── launch/route.js    # Platform khởi động LTI launch
│   │   │   ├── callback/route.js  # Nhận JWT từ MS Gateway
│   │   │   ├── keys/route.js      # JWKS Public Key của Platform
│   │   │   └── tools/route.js     # Danh sách tool có sẵn
│   │   └── auth/session/route.js  # Session management
│   ├── dashboard/page.jsx         # Dashboard chính
│   └── ...
├── lib/
│   ├── mongodb.js                 # Connection caching
│   ├── crypto.js                  # RSA key + JWT
│   ├── lti-utils.js               # LTI helpers
│   └── session.js                 # Session helpers
├── models/
│   ├── LtiRegistration.js         # Config MS Tools
│   ├── LtiNonce.js                # Nonce/State bảo mật
│   └── User.js                    # User của Education Hub
└── ...
```

---

## So sánh code cũ vs code mới

| | Code cũ (SAI) | Code mới (ĐÚNG) |
|---|---|---|
| Vai trò EH | Tool bị động | Platform chủ động |
| `/api/lti/login` | Chờ MS gọi vào | Không còn — đổi thành `/launch` |
| `/api/lti/launch` | Nhận id_token từ MS | Khởi động OIDC request gửi sang MS |
| `/api/lti/callback` | Không có | Nhận id_token từ MS Gateway gửi về |
| `LtiRegistrations` | Lưu config của MS (để verify MS gọi ta) | Lưu config MS Tools (ta gọi MS) |
| Sau verify JWT | Vào Dashboard của ta | Redirect đến URL tool Microsoft |

---

## URL đăng ký trên MS LTI Gateway Admin Portal

Khi đăng ký Education Hub làm **Platform** trên Gateway:

| Trường | Giá trị |
|--------|---------|
| Platform Login URL | `https://your-app.vercel.app/api/lti/launch` |
| Platform Redirect URL | `https://your-app.vercel.app/api/lti/callback` |
| Platform Keyset URL | `https://your-app.vercel.app/api/lti/keys` |
