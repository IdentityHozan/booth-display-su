import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { issueSignedToken, presignUrl } from '@vercel/blob';
import { authenticated } from '../../../lib/auth';
import { sameOrigin } from '../../../lib/session';
import { mediaPath, mediaTypes, maxMediaBytes } from '../../../lib/media';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!await authenticated()) return new Response('Please sign in.',{status:401});
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!mediaPath.test(key)) return new Response('Media must be uploaded again after migrating from Cloudflare.',{status:404});
  try {
    const signed = await issueSignedToken({pathname:key,operations:['get'],validUntil:Date.now()+60*60*1000});
    const {presignedUrl} = await presignUrl(signed,{pathname:key,operation:'get',access:'private'});
    // The CDN serves bytes and range requests directly, avoiding function response limits.
    return new Response(null,{status:307,headers:{Location:presignedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  } catch { return new Response('Media storage unavailable. Check the private Blob connection.',{status:503}); }
}
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 20000) return Response.json({error:'Request too large.'},{status:413});
    const body = JSON.parse(raw) as HandleUploadBody;
    if (body.type === 'blob.generate-client-token') {
      if (!sameOrigin(request)) return Response.json({error:'Forbidden'},{status:403});
      if (!await authenticated()) return Response.json({error:'Please sign in.'},{status:401});
    } else if (body.type !== 'blob.upload-completed') {
      return Response.json({error:'Invalid upload request.'},{status:400});
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({error:'Connect a private Vercel Blob store with BLOB_READ_WRITE_TOKEN.'},{status:503});
    const result = await handleUpload({request,body,
      onBeforeGenerateToken:async(pathname)=>{
        if (!mediaPath.test(pathname)) throw new Error('Invalid media filename.');
        return {allowedContentTypes:mediaTypes,maximumSizeInBytes:maxMediaBytes,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+60*60*1000};
      },
      // handleUpload verifies the Blob callback signature before invoking this.
      onUploadCompleted:async()=>{},
    });
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Upload failed. Sign in again and check your Blob connection.'},{status:400}); }
}
