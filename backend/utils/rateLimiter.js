/**
 * Simple rate limiter
 * Ограничивает количество запросов в минуту
 */
class RateLimiter {
  constructor(maxRequests = 10) {
    this.maxRequests = maxRequests;
    this.requests = new Map(); // IP -> [timestamps]
  }

  /**
   * Check if request is allowed
   */
  checkLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    
    // Get existing requests for this IP
    let ipRequests = this.requests.get(ip) || [];
    
    // Remove old requests (outside time window)
    ipRequests = ipRequests.filter(timestamp => now - timestamp < windowMs);
    
    // Check if limit exceeded
    if (ipRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...ipRequests);
      const waitTime = Math.ceil((windowMs - (now - oldestRequest)) / 1000);
      return {
        allowed: false,
        waitTime,
        remaining: 0,
      };
    }

    // Add current request
    ipRequests.push(now);
    this.requests.set(ip, ipRequests);

    return {
      allowed: true,
      waitTime: 0,
      remaining: this.maxRequests - ipRequests.length,
    };
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    const windowMs = 60 * 1000;

    for (const [ip, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
      
      if (validTimestamps.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validTimestamps);
      }
    }
  }
}

export default RateLimiter;
