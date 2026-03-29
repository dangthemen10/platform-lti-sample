// models/User.js
// ============================================================
// Lưu thông tin người dùng sau khi xác thực qua LTI thành công
// ============================================================
import mongoose from 'mongoose';

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
      id: { type: String },
      title: { type: String },
      label: { type: String },
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

export default mongoose.models.User || mongoose.model('User', UserSchema);
