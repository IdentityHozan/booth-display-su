'use client';
import {useState, type FormEvent} from 'react';
export default function Login() {
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const result=await r.json();if(!r.ok)throw Error(result.error);const next=new URLSearchParams(location.search).get('next');location.assign(next==='/display'?'/display':'/admin');}catch(e){setError(e instanceof Error?e.message:'Unable to sign in.');setBusy(false)}}
 return <main className="login-page"><form onSubmit={submit}><b className="login-brand">CIMP</b><h1>Partners Studio</h1><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><p role="alert">{error}</p><button className="primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form></main>
}
