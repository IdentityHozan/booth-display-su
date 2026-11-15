import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookie, validSession } from './session';
export async function authenticated() { return validSession((await cookies()).get(sessionCookie)?.value); }
export async function requirePage(next: '/admin' | '/display') {
  if (!await authenticated()) redirect(`/login?next=${next}`);
}
