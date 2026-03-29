// scripts/seed-db.mjs
// ============================================================
// Script seed dữ liệu mẫu vào MongoDB.
// Chạy: npm run seed
//
// Yêu cầu: MONGODB_URI đã được set trong .env.local
// ============================================================
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config'; // Đọc .env.local tự động

const __dirname = dirname(fileURLToPath(import.meta.url));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Thiếu MONGODB_URI trong .env.local');
  process.exit(1);
}

// ── Schema inline (không import từ models để tránh phụ thuộc Next.js) ──
const LtiRegistrationSchema = new mongoose.Schema(
  {
    name: String,
    clientId: { type: String, unique: true },
    issuer: String,
    authEndpoint: String,
    jwksUri: String,
    tokenEndpoint: String,
    redirectUri: String,
    targetLinkUri: String,
    deploymentId: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'lti_registrations' },
);

const LtiRegistration =
  mongoose.models.LtiRegistration ||
  mongoose.model('LtiRegistration', LtiRegistrationSchema);

async function seed() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối\n');

    // Đọc sample data
    const samplePath = join(
      __dirname,
      '..',
      'seed-data',
      'lti-registrations.sample.json',
    );
    const rawData = readFileSync(samplePath, 'utf-8');

    // Lọc bỏ các key có tiền tố _ (comment key)
    const samples = JSON.parse(rawData).map((item) => {
      const cleaned = {};
      for (const [key, val] of Object.entries(item)) {
        if (!key.startsWith('_')) {
          cleaned[key] = val;
        }
      }
      return cleaned;
    });

    console.log(`📦 Đang seed ${samples.length} LTI Registration(s)...\n`);

    for (const sample of samples) {
      try {
        // Dùng upsert để không bị duplicate error khi chạy nhiều lần
        await LtiRegistration.findOneAndUpdate(
          { clientId: sample.clientId },
          { $set: sample },
          { upsert: true, new: true },
        );
        console.log(`  ✅ ${sample.name} (clientId: ${sample.clientId})`);
      } catch (err) {
        console.error(`  ❌ Lỗi seed: ${sample.name}:`, err.message);
      }
    }

    const total = await LtiRegistration.countDocuments();
    console.log(`\n✅ Hoàn tất! Tổng số registrations trong DB: ${total}`);
  } catch (err) {
    console.error('❌ Lỗi seed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

seed();
