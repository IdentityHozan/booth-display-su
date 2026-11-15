import { Redis } from '@upstash/redis';
export function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Connect an Upstash Redis database in Vercel Storage.');
  return new Redis({ url, token });
}
export function stateKey() {
  const branch = process.env.VERCEL_ENV === 'preview' ? `preview:${process.env.VERCEL_GIT_COMMIT_REF || 'default'}` : 'production';
  return `cimp:${process.env.STUDIO_NAMESPACE || branch}:config`;
}
