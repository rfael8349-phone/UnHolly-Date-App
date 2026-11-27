import { FormEvent, ReactNode, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Heart, Mail, LockKeyhole, UserRound, CalendarDays, ArrowRight, LoaderCircle } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

function ageFromDate(value: string) {
  const birth = new Date(value + 'T00:00:00')
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age--
  return age
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setLoading(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) { setSession(nextSession); setLoading(false) }
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    async function ensureProfile() {
      if (!session?.user || !supabase) return
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle()
      if (!existing) {
        const displayName = String(session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Nuevo usuario').slice(0, 40)
        await supabase.from('profiles').insert({ id: session.user.id, display_name: displayName })
      }
    }
    void ensureProfile()
  }, [session])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setNotice('')
    if (mode === 'signup') {
      if (name.trim().length < 2) { setNotice('Escribe un nombre de al menos 2 caracteres.'); return }
      if (!birthDate || ageFromDate(birthDate) < 18) { setNotice('UnHolly es exclusivamente para mayores de 18 años.'); return }
      if (!accepted) { setNotice('Debes aceptar las condiciones y la política de privacidad.'); return }
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim(), birth_date: birthDate } },
        })
        if (error) throw error
        if (!data.session) setNotice('Cuenta creada. Revisa tu correo para confirmar la dirección y después inicia sesión.')
        else setNotice('¡Cuenta creada! Ya puedes empezar a completar tu perfil.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo completar la operación.')
    } finally { setBusy(false) }
  }

  if (!isSupabaseConfigured) return <>{children}</>
  if (loading) return <div className="auth-loading"><LoaderCircle className="spin" size={28}/><span>Preparando UnHolly…</span></div>
  if (session) return <>{children}</>

  return <main className="auth-page">
    <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
    <section className="auth-card">
      <a className="auth-brand" href="#"><span><Heart size={20} fill="currentColor"/></span>unholly<span className="brand-dot">.</span></a>
      <div className="auth-eyebrow">CONOCE · CONECTA · ENCUÉNTRATE</div>
      <h1>{mode === 'signup' ? 'Tu próxima historia' : 'Qué bueno verte'}<em>{mode === 'signup' ? ' empieza aquí.' : ' de nuevo.'}</em></h1>
      <p className="auth-intro">{mode === 'signup' ? 'Crea tu cuenta y descubre conexiones con sentido.' : 'Entra en tu espacio y continúa donde lo dejaste.'}</p>
      <div className="auth-switch"><button className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setNotice('') }}>Crear cuenta</button><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setNotice('') }}>Iniciar sesión</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'signup' && <>
          <label>Nombre visible<div className="auth-input"><UserRound size={17}/><input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} placeholder="¿Cómo te llamamos?" maxLength={40} required/></div></label>
          <label>Fecha de nacimiento<div className="auth-input"><CalendarDays size={17}/><input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0,10)} required/></div></label>
        </>}
        <label>Correo electrónico<div className="auth-input"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required/></div></label>
        <label>Contraseña<div className="auth-input"><LockKeyhole size={17}/><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required/></div></label>
        {mode === 'signup' && <label className="auth-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>Confirmo que tengo 18 años o más y acepto las condiciones y la política de privacidad.</span></label>}
        {notice && <div className="auth-notice" role="status">{notice}</div>}
        <button className="auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={18}/> : <>{mode === 'signup' ? 'Crear mi cuenta' : 'Entrar'} <ArrowRight size={17}/></>}</button>
      </form>
      <div className="auth-privacy"><LockKeyhole size={14}/> Tu información personal se protege y controla desde tu cuenta.</div>
      <div className="auth-footer">UnHolly está diseñado exclusivamente para personas adultas (+18).</div>
    </section>
  </main>
}
