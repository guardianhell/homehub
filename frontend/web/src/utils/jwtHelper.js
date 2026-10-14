/**
 * jwtHelper.js
 * Utilities for decoding, validating expiration, and simulating JWT tokens.
 */

/**
 * Safely decodes the payload of a JWT without external libraries.
 * @param {string} token
 * @returns {Object|null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Checks whether a given JWT token is expired based on its 'exp' claim.
 * @param {string} token
 * @returns {boolean} true if expired, false if active or non-JWT demo token
 */
export function isJwtExpired(token) {
  if (!token) return true;
  
  // Valid JWT format must have exactly 3 parts separated by dots (header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3) return true;

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;

  // 'exp' is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Creates a simulated expired JWT token for interactive testing.
 * The 'exp' claim is set to 1 hour in the past.
 * @param {Object} customClaims
 * @returns {string} Simulated expired JWT
 */
export function createSimulatedExpiredToken(customClaims = {}) {
  const header = { alg: "HS256", typ: "JWT" };
  const pastTimestampSec = Math.floor((Date.now() - 3600000) / 1000); // 1 hour ago

  const payload = {
    userId: "u-simulated-expired",
    email: "test.expired@homehub.com",
    role: "OWNER",
    householdId: "hh-simulated",
    subscriptionTier: "FREE",
    exp: pastTimestampSec,
    iat: pastTimestampSec - 3600,
    ...customClaims,
  };

  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const unsignedToken = `${encode(header)}.${encode(payload)}.simulated_signature_hash`;
  return unsignedToken;
}
