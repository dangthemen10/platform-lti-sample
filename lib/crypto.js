// lib/crypto.js
// ============================================================
// Tiện ích mã hóa: quản lý RSA key pair, tạo/verify JWT,
// và expose JWKS endpoint.
//
// Thư viện sử dụng: `jose` (không phải `node-jose`)
// `jose` là thư viện JOSE (JWT/JWK/JWS) thuần ESM, không có
// dependency native, chạy được trên Vercel Edge & Serverless.
//
// Cài đặt: npm install jose
// ============================================================
import * as jose from 'jose';
import crypto from 'crypto';

// ── PRIVATE KEY RSA ─────────────────────────────────────────
// Private key được lưu trong biến môi trường dạng PEM.
// Để tạo key pair mới, chạy script `scripts/generate-keys.js`.
// LƯU Ý: KHÔNG commit private key vào git!
const PRIVATE_KEY_PEM = process.env.LTI_PRIVATE_KEY;
const KEY_ID = process.env.LTI_KEY_ID || 'education-hub-key-1';

/**
 * Import Private Key từ PEM string trong biến môi trường.
 * Kết quả được cache để không import lại mỗi request.
 */
let _cachedPrivateKey = null;
let _cachedPublicKey = null;

export async function getPrivateKey() {
  if (_cachedPrivateKey) return _cachedPrivateKey;

  if (!PRIVATE_KEY_PEM) {
    throw new Error('❌ Thiếu biến môi trường LTI_PRIVATE_KEY');
  }

  // Thay thế ký tự \n literal thành newline thực (khi copy từ .env)
  const pemString = PRIVATE_KEY_PEM.replace(/\\n/g, '\n');

  _cachedPrivateKey = await jose.importPKCS8(pemString, 'RS256');
  return _cachedPrivateKey;
}

export async function getPublicKey() {
  if (_cachedPublicKey) return _cachedPublicKey;

  // Lấy public key từ private key
  const privateKey = await getPrivateKey();

  // Export private key thành JWK để lấy public components
  const privateJwk = await jose.exportJWK(privateKey);

  // Tạo public JWK bằng cách giữ lại chỉ các public fields
  const publicJwk = {
    kty: privateJwk.kty,
    n: privateJwk.n,
    e: privateJwk.e,
    alg: 'RS256',
    use: 'sig',
    kid: KEY_ID,
  };

  _cachedPublicKey = await jose.importJWK(publicJwk, 'RS256');
  return _cachedPublicKey;
}

/**
 * Tạo JWKS object để expose qua endpoint /api/lti/keys.
 * Microsoft LTI Gateway có thể gọi endpoint này để verify
 * chữ ký của các request từ Tool của chúng ta.
 *
 * @returns {Promise<{keys: Array}>}
 */
export async function getJWKS() {
  const privateKey = await getPrivateKey();
  const privateJwk = await jose.exportJWK(privateKey);

  // Chỉ expose public components (KHÔNG expose d, p, q, dp, dq, qi)
  const publicJwk = {
    kty: privateJwk.kty,
    n: privateJwk.n,
    e: privateJwk.e,
    alg: 'RS256',
    use: 'sig',
    kid: KEY_ID,
  };

  return { keys: [publicJwk] };
}

/**
 * Fetch và cache JWKS từ remote URL (dùng để verify JWT từ Microsoft).
 * `jose` có built-in `createRemoteJWKSet` với caching tự động.
 *
 * @param {string} jwksUri - URL JWKS của Microsoft
 * @returns {Function} - JWKS key selector function của jose
 */
const _jwksCache = new Map();

export function getRemoteJWKS(jwksUri) {
  if (_jwksCache.has(jwksUri)) {
    return _jwksCache.get(jwksUri);
  }

  const jwks = jose.createRemoteJWKSet(new URL(jwksUri), {
    // Cache keys trong 10 phút để tránh gọi quá nhiều
    cacheMaxAge: 10 * 60 * 1000,
  });

  _jwksCache.set(jwksUri, jwks);
  return jwks;
}

/**
 * Verify JWT (id_token) từ Microsoft.
 * Xác minh chữ ký RS256, issuer, audience và các claim bắt buộc.
 *
 * @param {string} token - JWT string từ Microsoft
 * @param {Object} registration - LtiRegistration document
 * @returns {Promise<Object>} - Payload đã verify
 */
export async function verifyMicrosoftJWT(token, registration) {
  const JWKS = getRemoteJWKS(registration.jwksUri);

  const { payload, protectedHeader } = await jose.jwtVerify(token, JWKS, {
    // Kiểm tra issuer phải khớp với registration
    issuer: registration.issuer,

    // Kiểm tra audience phải là Client ID của chúng ta
    audience: registration.clientId,

    // Cho phép lệch đồng hồ tối đa 5 phút (clock skew giữa servers)
    clockTolerance: '5 minutes',
  });

  return { payload, protectedHeader };
}

/**
 * Tạo session JWT nội bộ của Education Hub.
 * Dùng để lưu thông tin user vào cookie sau khi LTI launch thành công.
 *
 * @param {Object} userPayload - Thông tin user
 * @returns {Promise<string>} - Signed JWT string
 */
export async function createSessionToken(userPayload) {
  const privateKey = await getPrivateKey();

  const token = await new jose.SignJWT({
    ...userPayload,
    iss: process.env.NEXT_PUBLIC_APP_URL || 'https://education-hub.vercel.app',
  })
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setIssuedAt()
    .setExpirationTime('8h') // Session hết hạn sau 8 giờ
    .sign(privateKey);

  return token;
}

/**
 * Verify session JWT nội bộ.
 *
 * @param {string} token - Session JWT
 * @returns {Promise<Object>} - Payload
 */
export async function verifySessionToken(token) {
  const publicKey = await getPublicKey();

  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer:
      process.env.NEXT_PUBLIC_APP_URL || 'https://education-hub.vercel.app',
  });

  return payload;
}

/**
 * Tạo chuỗi ngẫu nhiên dùng cho nonce và state.
 * Sử dụng crypto.randomBytes để đảm bảo tính ngẫu nhiên cryptographic.
 *
 * @param {number} length - Độ dài (bytes), output hex sẽ dài gấp đôi
 * @returns {string}
 */
export function generateSecureRandom(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
