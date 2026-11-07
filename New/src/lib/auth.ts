/**
 * Auth facade. The screens call only these functions, so plugging in a real provider
 * (Supabase, Firebase, Clerk, your own API) later means replacing the bodies here.
 * Until then it keeps a local demo session so the whole flow can be used end to end.
 */
export type User = { id: string; name: string; email: string; provider: 'email' | 'google' | 'apple' }
const KEY = 'minal-user'
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const save = (u: User) => { localStorage.setItem(KEY, JSON.stringify(u)); window.dispatchEvent(new Event('minal-auth')); return u }

export function currentUser(): User | null { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
export async function signIn(email: string, password: string): Promise<User> {
  await wait(900)
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email doesn’t look right.')
  if (password.length < 6) throw new Error('Wrong email or password.')
  return save({ id: crypto.randomUUID(), name: email.split('@')[0], email, provider: 'email' })
}
export async function signUp(name: string, email: string, password: string): Promise<User> {
  await wait(1000)
  if (!name.trim()) throw new Error('Tell us your name.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email doesn’t look right.')
  if (password.length < 8) throw new Error('Use at least 8 characters.')
  return save({ id: crypto.randomUUID(), name: name.trim(), email, provider: 'email' })
}
export async function signInWith(provider: 'google' | 'apple'): Promise<User> {
  await wait(1100)
  return save({ id: crypto.randomUUID(), name: provider === 'google' ? 'Google user' : 'Apple user', email: '', provider })
}
export async function sendReset(email: string) {
  await wait(900)
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email doesn’t look right.')
}
export function signOut() { localStorage.removeItem(KEY); window.dispatchEvent(new Event('minal-auth')) }
