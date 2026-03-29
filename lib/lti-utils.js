// lib/lti-utils.js
// ============================================================
// Các hàm tiện ích cho LTI 1.3 flow:
//   - Phân tích role từ LTI claims
//   - Trích xuất thông tin user từ JWT payload
//   - Validate LTI message type
// ============================================================

/**
 * Ánh xạ LTI role URN sang role đơn giản cho FE.
 *
 * LTI 1.3 dùng URN đầy đủ, ví dụ:
 *   "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
 *   "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
 *   "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator"
 *
 * @param {string[]} roles - Mảng LTI role URNs từ JWT claim
 * @returns {'admin' | 'instructor' | 'learner'}
 */
export function mapLtiRoleToSimple(roles = []) {
  if (!Array.isArray(roles)) return 'learner';

  // Kiểm tra admin trước (ưu tiên cao nhất)
  const isAdmin = roles.some(
    (r) =>
      r.includes('Administrator') ||
      r.includes('SysAdmin') ||
      r.includes('sys/person#Administrator'),
  );
  if (isAdmin) return 'admin';

  // Kiểm tra instructor
  const isInstructor = roles.some(
    (r) =>
      r.includes('Instructor') ||
      r.includes('Faculty') ||
      r.includes('Teacher') ||
      r.includes('ContentDeveloper'),
  );
  if (isInstructor) return 'instructor';

  // Mặc định là learner
  return 'learner';
}

/**
 * Trích xuất thông tin user từ LTI JWT payload.
 * Xử lý các claim LTI 1.3 chuẩn của Microsoft.
 *
 * @param {Object} payload - JWT payload đã verify
 * @returns {Object} - Thông tin user đã chuẩn hóa
 */
export function extractUserFromPayload(payload) {
  // LTI 1.3 claim namespace của IMS Global
  const LTI_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim';

  // Claim roles - mảng các role URN
  const ltiRoles = payload[`${LTI_CLAIM}/roles`] || [];

  // Claim context - thông tin lớp học/khóa học
  const contextClaim = payload[`${LTI_CLAIM}/context`] || {};

  // Claim resource link - thông tin tài nguyên đang được mở
  const resourceLinkClaim = payload[`${LTI_CLAIM}/resource_link`] || {};

  return {
    // Thông tin cơ bản
    sub: payload.sub, // Microsoft user ID (duy nhất)
    email: payload.email || null,
    name:
      payload.name ||
      `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
    givenName: payload.given_name || null,
    familyName: payload.family_name || null,
    avatarUrl: payload.picture || null,

    // LTI specific
    ltiRoles,
    role: mapLtiRoleToSimple(ltiRoles),

    // Context (lớp học)
    context: {
      id: contextClaim.id || null,
      title: contextClaim.title || null,
      label: contextClaim.label || null,
    },

    // Resource link (tài nguyên được mở)
    resourceLink: {
      id: resourceLinkClaim.id || null,
      title: resourceLinkClaim.title || null,
      description: resourceLinkClaim.description || null,
    },

    // Deployment ID
    deploymentId: payload[`${LTI_CLAIM}/deployment_id`] || null,

    // Message type (LtiResourceLinkRequest, LtiDeepLinkingRequest, v.v.)
    messageType: payload[`${LTI_CLAIM}/message_type`] || null,

    // Version LTI
    ltiVersion: payload[`${LTI_CLAIM}/version`] || null,
  };
}

/**
 * Kiểm tra payload có đủ claim bắt buộc của LTI 1.3 không.
 *
 * @param {Object} payload - JWT payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLtiPayload(payload) {
  const LTI_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim';
  const errors = [];

  // Các claim bắt buộc theo spec LTI 1.3
  const requiredClaims = [
    `${LTI_CLAIM}/message_type`,
    `${LTI_CLAIM}/version`,
    `${LTI_CLAIM}/deployment_id`,
    `${LTI_CLAIM}/roles`,
    'sub',
    'nonce',
    'iat',
    'exp',
  ];

  for (const claim of requiredClaims) {
    if (payload[claim] === undefined || payload[claim] === null) {
      errors.push(`Thiếu claim bắt buộc: ${claim}`);
    }
  }

  // Kiểm tra version phải là 1.3.0
  const version = payload[`${LTI_CLAIM}/version`];
  if (version && version !== '1.3.0') {
    errors.push(`LTI version không hỗ trợ: ${version} (yêu cầu 1.3.0)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Tạo URL redirect về FE kèm session token trong cookie (qua query hoặc Set-Cookie).
 * Hàm này trả về Next.js Response object với cookie đã set.
 *
 * @param {string} redirectUrl - URL trang dashboard
 * @param {string} sessionToken - JWT session
 * @returns {Response}
 */
export function buildLaunchResponse(redirectUrl, sessionToken) {
  const { NextResponse } = require('next/server');

  const response = NextResponse.redirect(redirectUrl);

  // Set session cookie (httpOnly để JS không đọc được, bảo mật hơn)
  response.cookies.set('edu_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only trên production
    sameSite: 'lax', // Cần 'none' nếu LMS và Tool khác domain + trong iframe
    maxAge: 60 * 60 * 8, // 8 giờ (tính bằng giây)
    path: '/',
  });

  return response;
}
