// scripts/generate-keys.mjs
// ============================================================
// Script tạo cặp RSA 2048-bit key pair cho LTI 1.3.
// Chạy một lần duy nhất: npm run generate-keys
//
// Output:
//   - keys/private.pem  (giữ bí mật, copy vào LTI_PRIVATE_KEY)
//   - keys/public.pem   (có thể chia sẻ)
//   - keys/jwks.json    (upload lên hoặc serve qua /api/lti/keys)
// ============================================================
import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '..', 'keys');

// Tạo thư mục keys nếu chưa có
if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
}

console.log('🔐 Đang tạo cặp RSA 2048-bit key pair...\n');

// Tạo RSA key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Lưu private key
const privateKeyPath = join(keysDir, 'private.pem');
writeFileSync(privateKeyPath, privateKey);
console.log(`✅ Private key đã lưu: ${privateKeyPath}`);

// Lưu public key
const publicKeyPath = join(keysDir, 'public.pem');
writeFileSync(publicKeyPath, publicKey);
console.log(`✅ Public key đã lưu: ${publicKeyPath}`);

// Tạo JWKS JSON từ public key
// (Cách thủ công: parse PEM để lấy modulus và exponent)
import { createPublicKey } from 'crypto';

const pubKeyObj = createPublicKey(publicKey);
const jwk = pubKeyObj.export({ format: 'jwk' });

const keyId = `education-hub-key-${Date.now()}`;

const jwks = {
  keys: [
    {
      kty: jwk.kty,
      use: 'sig',
      alg: 'RS256',
      kid: keyId,
      n: jwk.n,
      e: jwk.e,
    },
  ],
};

const jwksPath = join(keysDir, 'jwks.json');
writeFileSync(jwksPath, JSON.stringify(jwks, null, 2));
console.log(`✅ JWKS đã lưu: ${jwksPath}`);

// In hướng dẫn copy vào .env
console.log('\n' + '='.repeat(60));
console.log('📋 HƯỚNG DẪN: Copy giá trị sau vào file .env.local\n');

// Format private key cho .env (thay newline bằng \n literal)
const privateKeyEnv = privateKey.replace(/\n/g, '\\n');
console.log(`LTI_PRIVATE_KEY="${privateKeyEnv}"`);
console.log(`LTI_KEY_ID=${keyId}`);
console.log('='.repeat(60));

console.log('\n⚠️  QUAN TRỌNG:');
console.log('   - KHÔNG commit thư mục keys/ vào Git!');
console.log('   - Thêm keys/ vào .gitignore');
console.log('   - Sao lưu private key ở nơi an toàn');
