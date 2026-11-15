import {env} from 'cloudflare:workers';
import {configSchema,defaults,cleanCopy,type Config} from '../../../lib/model';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(){try{const o=await env.BUCKET!.get('studio/config.json');return Response.json({config:cleanCopy(o?await o.json() as Config:defaults),etag:o?.etag||''},{headers});}catch{return Response.json({error:'Unable to load studio'},{status:503,headers});}}
export async function PUT(r:Request){
 if(r.headers.get('origin')!==new URL(r.url).origin)return new Response('Forbidden',{status:403});
 try{const raw=await r.text();if(raw.length>120000)return new Response('Too large',{status:413});const {config,etag}=JSON.parse(raw);const value=cleanCopy(configSchema.parse(config));const o=await env.BUCKET!.put('studio/config.json',JSON.stringify(value),{onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});if(!o)return Response.json({error:'Another device updated the studio. Reload to get its changes.'},{status:409});return Response.json({config:value,etag:o.etag},{headers});}catch{return Response.json({error:'Could not save. Check your connection and try again.'},{status:400});}}
