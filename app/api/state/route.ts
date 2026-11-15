import { configSchema, defaults, cleanCopy, type Config } from '../../../lib/model';
import { authenticated } from '../../../lib/auth';
import { sameOrigin } from '../../../lib/session';
import { redis, stateKey } from '../../../lib/redis';
import { saveStateScript } from '../../../lib/state-store';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
export async function GET() {
  if (!await authenticated()) return Response.json({error:'Please sign in.'}, {status:401, headers});
  try {
    const saved = await redis().get<{config:Config;etag:string}>(stateKey());
    return Response.json({config:cleanCopy(saved ? configSchema.parse(saved.config) : defaults),etag:saved?.etag || ''},{headers});
  } catch {
    return Response.json({error:'Unable to load settings. Check the Redis connection in Vercel.'},{status:503,headers});
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:'Forbidden'},{status:403});
  if (!await authenticated()) return Response.json({error:'Please sign in.'},{status:401});
  let value: Config, expected: string;
  try {
    const raw = await request.text();
    if (raw.length > 120000) return Response.json({error:'Playlist is too large.'},{status:413});
    const body = JSON.parse(raw);
    if (typeof body.etag !== 'string' || body.etag.length > 80) throw new Error();
    expected = body.etag;
    value = cleanCopy(configSchema.parse(body.config));
  } catch { return Response.json({error:'Check your slide text, media URLs and durations.'},{status:400}); }
  try {
    const saved = {config:value,etag:crypto.randomUUID()};
    const success = await redis().eval(saveStateScript,[stateKey()],[expected,JSON.stringify(saved)]);
    if (Number(success) !== 1) return Response.json({error:'Another device updated the studio. Reload before publishing again.'},{status:409,headers});
    return Response.json(saved,{headers});
  } catch { return Response.json({error:'Could not save. Check the Redis connection and retry.'},{status:503,headers}); }
}
