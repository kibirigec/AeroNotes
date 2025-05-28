import jwt from 'jsonwebtoken';

/**
 * Verify JWT token
 */
export function verifyJWT(token, secret = process.env.NEXTAUTH_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

/**
 * Extract token from request headers
 */
export function extractTokenFromRequest(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to x-user-id header (legacy)
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) {
    return userIdHeader;
  }
  
  return null;
} 