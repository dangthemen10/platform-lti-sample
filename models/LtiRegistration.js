// models/LtiRegistration.js
// ============================================================
// Lưu cấu hình đăng ký LTI với Microsoft LTI Gateway.
//
// ĐÚNG VAI TRÒ:
//   - Education Hub = Platform (LMS) — chủ động gọi sang MS
//   - Microsoft LTI Gateway = Broker trung gian
//   - OneDrive/Teams/... = Tool — bên được gọi tới
//
// Collection này lưu thông tin của CÁC TOOL MICROSOFT mà
// Education Hub (Platform của ta) muốn tích hợp.
// Các giá trị này lấy từ Microsoft LTI Gateway Admin Portal
// sau khi ta đăng ký Education Hub làm Platform.
// ============================================================
import mongoose from 'mongoose';

const LtiRegistrationSchema = new mongoose.Schema(
  {
    // Tên hiển thị để dễ quản lý
    // Ví dụ: "OneDrive LTI", "Teams Assignments", "SharePoint"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ── THÔNG TIN DO MICROSOFT LTI GATEWAY CẤP ──────────────
    // Sau khi Education Hub đăng ký làm Platform trên Gateway,
    // Microsoft sẽ cấp các giá trị này cho từng Tool tích hợp.

    // Client ID định danh Education Hub trên Microsoft LTI Gateway
    // (Gateway dùng cái này để nhận ra "ai đang gọi")
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Issuer: identity của Microsoft LTI Gateway
    // Ví dụ: "https://lti.microsoft.com"
    issuer: {
      type: String,
      required: true,
      trim: true,
    },

    // OIDC Authorization Endpoint của Microsoft LTI Gateway
    // Education Hub redirect user đến đây để bắt đầu LTI launch
    // Ví dụ: "https://lti.microsoft.com/api/oidc/authorize"
    authorizationEndpoint: {
      type: String,
      required: true,
    },

    // JWKS URI để Education Hub lấy Public Key của Gateway
    // Dùng để verify chữ ký JWT mà Gateway gửi về
    // Ví dụ: "https://lti.microsoft.com/.well-known/jwks.json"
    jwksUri: {
      type: String,
      required: true,
    },

    // Access Token Endpoint (dùng cho LTI Advantage Services:
    // Names & Roles, Assignment & Grades)
    // Ví dụ: "https://lti.microsoft.com/api/ltiv13/token"
    accessTokenUrl: {
      type: String,
      default: null,
    },

    // ── THÔNG TIN CỦA TOOL MICROSOFT ────────────────────────
    // URL của Tool Microsoft mà Education Hub muốn mở
    // Ví dụ OneDrive LTI: "https://sharepoint.com/..."
    targetLinkUri: {
      type: String,
      required: true,
    },

    // Deployment ID do Gateway cấp khi đăng ký Tool
    deploymentId: {
      type: String,
      required: true,
    },

    // Loại tool để FE biết hiển thị icon gì
    toolType: {
      type: String,
      enum: ['onedrive', 'teams', 'sharepoint', 'other'],
      default: 'other',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'lti_registrations',
  },
);

export default mongoose.models.LtiRegistration ||
  mongoose.model('LtiRegistration', LtiRegistrationSchema);
