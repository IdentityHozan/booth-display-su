import test from 'node:test';
import assert from 'node:assert/strict';
import {signSession,validSession,matchesPassword,sameOrigin,sessionSeconds} from '../lib/session.ts';
import {mediaPath} from '../lib/media.ts';
process.env.ADMIN_PASSWORD='test-only-password-123456789';
test('signed session accepts correct signature, rejects changes and expiry',()=>{
 const now=Math.floor(Date.now()/1000), token=signSession(now+sessionSeconds);
 assert.equal(validSession(token,now),true);
 assert.equal(validSession(token.slice(0,-1)+(token.endsWith('0')?'1':'0'),now),false);
 assert.equal(validSession(signSession(now-1),now),false);
 assert.equal(validSession('bad-token',now),false);
 assert.equal(validSession(signSession(now+sessionSeconds*2),now),false);
});
test('password rotation invalidates existing sessions',()=>{
 const token=signSession();const password=process.env.ADMIN_PASSWORD;
 process.env.ADMIN_PASSWORD='different-password-123456789';
 assert.equal(validSession(token),false);process.env.ADMIN_PASSWORD=password;
});
test('password validation and origin checks fail closed',()=>{
 assert.equal(matchesPassword(process.env.ADMIN_PASSWORD),true);
 assert.equal(matchesPassword('wrong'),false);
 assert.equal(sameOrigin(new Request('https://studio.test/api/state',{headers:{origin:'https://studio.test'}})),true);
 assert.equal(sameOrigin(new Request('https://studio.test/api/state',{headers:{origin:'https://evil.test'}})),false);
 assert.equal(sameOrigin(new Request('https://studio.test/api/state')),false);
});
test('media keys cannot escape the media namespace or redirect to arbitrary hosts',()=>{
 assert.equal(mediaPath.test('media/12345678-1234-1234-1234-123456789abc.mp4'),true);
 for(const key of ['../studio/config.json','https://evil.test/video.mp4','media/a.svg','media/a.html','media/123'])assert.equal(mediaPath.test(key),false);
});
