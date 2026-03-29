// lib/mongodb.js
// ============================================================
// Kết nối MongoDB tối ưu cho môi trường Vercel Serverless.
//
// VẤN ĐỀ: Mỗi lần Serverless Function khởi động, nó tạo một
// Node.js process mới. Nếu tạo kết nối mới mỗi request thì
// sẽ bị "too many connections" trên MongoDB Atlas.
//
// GIẢI PHÁP: Cache connection trong global object của Node.js.
// Các invocation trong cùng một "warm" container sẽ tái sử
// dụng connection đã có thay vì tạo mới.
// ============================================================
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    '❌ Thiếu biến môi trường MONGODB_URI. Vui lòng thêm vào .env.local',
  );
}

/**
 * Cache global để giữ connection giữa các lần function được gọi.
 * Khai báo trên `global` để tồn tại xuyên suốt lifecycle của container.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Kết nối đến MongoDB.
 * - Lần đầu: tạo connection mới và cache lại.
 * - Các lần sau: trả về connection đã cache.
 *
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectToDatabase() {
  // Nếu đã có connection đang hoạt động, dùng lại luôn
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có promise kết nối, khởi tạo mới
  if (!cached.promise) {
    const opts = {
      // bufferCommands=false: Không queue commands khi chưa kết nối.
      // Giúp phát hiện lỗi sớm thay vì bị treo mãi.
      bufferCommands: false,

      // Số connection tối đa trong pool
      // Vercel free tier: giữ thấp để không vượt quá Atlas limit
      maxPoolSize: 10,

      // Timeout khi cố kết nối (ms)
      serverSelectionTimeoutMS: 5000,

      // Timeout khi socket không phản hồi (ms)
      socketTimeoutMS: 45000,
    };

    console.log('🔌 Đang kết nối MongoDB...');
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ Kết nối MongoDB thành công');
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise để lần sau có thể thử lại
    cached.promise = null;
    console.error('❌ Lỗi kết nối MongoDB:', err);
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
