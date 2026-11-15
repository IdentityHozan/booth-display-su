// Integration checks against the production Next server and a local Redis REST test double.
// No cloud credentials, live storage or user data are used.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const entries=new Map();
function command(cmd){
 const [name,...args]=cmd;
 switch(String(name).toLowerCase()){
  case 'get':return entries.get(args[0])??null;
  case 'del':return Number(entries.delete(args[0]));
  case 'eval':{
   const [script,count,key,...argv]=args;
   if(script.includes("'INCR'")){const n=Number(entries.get(key)||0)+1;entries.set(key,n);return n;}
   const current=entries.get(key);
   if(current?JSON.parse(current).etag!==argv[0]:argv[0]!=='')return 0;
   entries.set(key,argv[1]);return 1;
  }
  default:throw Error('Unsupported test command '+name);
 }
}
const redis=createServer(async(req,res)=>{try{let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);const result=Array.isArray(input[0])?input.map(c=>({result:command(c)})):{result:command(input)};res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));}catch(e){res.statusCode=500;res.end(JSON.stringify({error:e.message}));}});
await new Promise(r=>redis.listen(0,'127.0.0.1',r));
const port=redis.address().port,origin='http://127.0.0.1:3198';
let output='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3198'],{env:{...process.env,ADMIN_PASSWORD:'local-test-password-123456789',UPSTASH_REDIS_REST_URL:`http://127.0.0.1:${port}`,UPSTASH_REDIS_REST_TOKEN:'test',BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_test_test',VERCEL_ENV:'',VERCEL:''},stdio:['ignore','pipe','pipe']});
child.stdout.on('data',s=>{output+=s;process.stdout.write(s)});child.stderr.on('data',s=>{output+=s;process.stderr.write(s)});
try{
 for(let i=0;i<100;i++){try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(3000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===99)throw Error(output);}
 const call=(path,options={})=>fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(10000),...options});
 assert.equal((await call('/admin')).status,307);
 assert.equal((await call('/display')).status,307);
 assert.equal((await call('/api/state')).status,401);
 const send=(body,cookie='',extra={})=>({method:'POST',headers:{origin,'Content-Type':'application/json',cookie,...extra},body:JSON.stringify(body)});
 assert.equal((await call('/api/auth',send({password:'wrong'}))).status,401);
 const login=await call('/api/auth',send({password:'local-test-password-123456789'}));
 assert.equal(login.status,200,await login.clone().text());
 const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.ok(login.headers.get('set-cookie').includes('HttpOnly'));
 assert.equal((await call('/admin',{headers:{cookie}})).status,200);
 assert.equal((await call('/display',{headers:{cookie}})).status,200);
 const state=await (await call('/api/state',{headers:{cookie}})).json();
 assert.equal(state.etag,'');assert.ok(state.config.slides.some(s=>s.kind==='video'));
 const save=(value,headers={})=>call('/api/state',{...send(value,cookie,headers),method:'PUT'});
 assert.equal((await save(state,{origin:'https://evil.test'})).status,403);
 assert.equal((await save({...state,config:{...state.config,slides:[]}})).status,400);
 const saved=await save({...state,config:{...state.config,ticker:'Integration check'}});
 assert.equal(saved.status,200);const next=await saved.json();assert.ok(next.etag);
 assert.equal((await save(state)).status,409);
 const latest=await (await call('/api/state',{headers:{cookie}})).json();
 assert.equal(latest.config.ticker,'Integration check');assert.equal(latest.etag,next.etag);
 const tokenRequest={type:'blob.generate-client-token',payload:{pathname:'media/not-allowed.html',multipart:true,clientPayload:null}};
 assert.equal((await call('/api/media',send(tokenRequest))).status,401);
 assert.equal((await call('/api/media',send(tokenRequest,cookie))).status,400);
 assert.equal((await call('/api/media?key=../settings',{headers:{cookie}})).status,404);
 console.log('PASS: production routes, login, protected admin/display, persistence, stale-write conflicts, validation, upload authorization and media path restrictions.');
} catch(e){console.error(output);throw e;}finally{child.kill('SIGTERM');await new Promise(r=>redis.close(r));}
