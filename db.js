const Redis = require('ioredis');

let redisConfig;
if (process.env.UPSTASH_REDIS_URL) {
  redisConfig = process.env.UPSTASH_REDIS_URL;
} else {
  redisConfig = {
    host: process.env.UPSTASH_REDIS_HOST || 'localhost',
    port: process.env.UPSTASH_REDIS_PORT || 6379,
    password: process.env.UPSTASH_REDIS_PASSWORD || '',
    tls: process.env.UPSTASH_REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
    retryStrategy: function(times) { return Math.min(times * 500, 5000); },
    maxRetriesPerRequest: 3,
    lazyConnect: true
  };
}

const redis = new Redis(redisConfig);
redis.on('connect', function() { console.log('Redis connected'); });
redis.on('error', function(err) { console.error('Redis error:', err.message); });

const SESSION_TTL = 7 * 24 * 60 * 60;
const MAX_HISTORY = 20;

async function getSession(phone) {
  try {
    const data = await redis.get('session:' + phone);
    if (data) return JSON.parse(data);
    return { phone: phone, history: [], customerName: null, pendingCallback: null, createdAt: new Date().toISOString() };
  } catch (err) {
    console.error('Get session error for ' + phone + ':', err.message);
    return { phone: phone, history: [], customerName: null, pendingCallback: null, createdAt: new Date().toISOString() };
  }
}
async function saveSession(phone, sessionData) {
  try {
    if (sessionData.history && sessionData.history.length > MAX_HISTORY) {
      sessionData.history = sessionData.history.slice(-MAX_HISTORY);
    }
    sessionData.lastUpdated = new Date().toISOString();
    await redis.setex('session:' + phone, SESSION_TTL, JSON.stringify(sessionData));
  } catch (err) {
    console.error('Save session error for ' + phone + ':', err.message);
  }
}
async function deleteSession(phone) {
  try { await redis.del('session:' + phone); } catch (err) { console.error('Delete session error:', err.message); }
}
process.on('SIGTERM', async function() { await redis.quit(); process.exit(0); });
module.exports = { getSession, saveSession, deleteSession, redis };
