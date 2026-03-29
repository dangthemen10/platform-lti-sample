// models/LtiNonce.js
// ============================================================
// Lưu trữ nonce và state tạm thời trong quá trình OIDC flow.
// Mỗi bản ghi tự động xóa sau khi hết hạn (TTL index).
// ============================================================
import mongoose from 'mongoose';

const LtiNonceSchema = new mongoose.Schema(
  {
    // Giá trị nonce ngẫu nhiên, dùng để chống replay attack
    nonce: {
      type: String,
      required: true,
      unique: true,
    },

    // State ngẫu nhiên, dùng để chống CSRF
    state: {
      type: String,
      required: true,
      unique: true,
    },

    // Client ID để biết nonce này thuộc về registration nào
    clientId: {
      type: String,
      required: true,
    },

    // URL gốc mà LMS muốn redirect tới (lưu lại để redirect sau launch)
    targetLinkUri: {
      type: String,
      default: null,
    },

    // Thời điểm hết hạn — MongoDB sẽ tự xóa document sau thời điểm này
    // TTL index đặt bên dưới
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    },

    // Đã dùng chưa? (dùng xong là vô hiệu hóa)
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'lti_nonces',
  },
);

// TTL Index: MongoDB tự động xóa document sau khi expiresAt qua đi
LtiNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.LtiNonce ||
  mongoose.model('LtiNonce', LtiNonceSchema);

// ============================================================
// models/User.js (export riêng trong file này cho gọn)
// Lưu thông tin người dùng sau khi xác thực qua LTI thành công
// ============================================================
const UserSchema = new mongoose.Schema(
  {
    // Email từ Microsoft account (dùng làm unique identifier)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Họ tên đầy đủ
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Sub claim từ Microsoft JWT (unique user ID trong Microsoft)
    microsoftSub: {
      type: String,
      default: null,
    },

    // Vai trò LTI từ JWT claim (mảng vì user có thể có nhiều role)
    // Các giá trị LTI standard:
    //   "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
    //   "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
    ltiRoles: {
      type: [String],
      default: [],
    },

    // Vai trò rút gọn cho logic FE (instructor / learner / admin)
    role: {
      type: String,
      enum: ['instructor', 'learner', 'admin'],
      default: 'learner',
    },

    // Avatar URL từ Microsoft profile
    avatarUrl: {
      type: String,
      default: null,
    },

    // Client ID của registration mà user này đến từ đó
    registrationClientId: {
      type: String,
      default: null,
    },

    // Thông tin context LTI (lớp học / khóa học)
    ltiContext: {
      id: String,
      title: String,
      label: String,
    },

    // Lần cuối đăng nhập
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
