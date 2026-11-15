import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { matchesPassword, passwordConfigured, sameOrigin, signSession, sessionCookie, sessionSeconds } from '../../../lib/session';
import { redis } from '../../../lib/redis';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:'Forbidden'},{status:403});
  if (!passwordConfigured()) return Response.json({error:'Set ADMIN_PASSWORD to at least 16 characters in Vercel, then redeploy.'},{status:503});
  try {
    // Vercel supplies the trusted client IP; locally all requests share one bucket.
    const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
    const key = 'cimp:login:' + createHash('sha256').update(ip).digest('hex');
    const attempts = Number(await redis().eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n",[key],[]));
    if (attempts > 10) return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429,headers:{'Retry-After':'900'}});
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({error:'Invalid password.'},{status:400});
    const {password} = JSON.parse(raw);
    if (typeof password !== 'string' || !matchesPassword(password)) return Response.json({error:'Incorrect password.'},{status:401});
    (await cookies()).set(sessionCookie, signSession(), {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:sessionSeconds});
    await redis().del(key);
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Sign-in unavailable. Check your Redis environment variables.'},{status:503}); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response('Forbidden',{status:403});
  (await cookies()).delete(sessionCookie);
  return Response.json({ok:true});
}
