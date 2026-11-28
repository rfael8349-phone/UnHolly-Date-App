import { FormEvent, ReactNode, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Heart, Mail, LockKeyhole, UserRound, CalendarDays, ArrowRight, LoaderCircle, MapPin, Camera, Video, Sparkles } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

function ageFromDate(value: string) {
  const birth = new Date(value + 'T00:00:00')
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
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
  const [city, setCity] = useState('Málaga')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [lookingFor, setLookingFor] = useState('Conocer gente y ver qué pasa')
  const [relationship, setRelationship] = useState('Soltero/a')
  const [icebreaker, setIcebreaker] = useState('Si hay buena conversación, el plan se improvisa.')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let alive = true
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { if (alive) { setSession(nextSession); setLoading(false) } })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    async function ensureProfile() {
      if (!session?.user || !supabase) return
      const metadata = session.user.user_metadata || {}
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle()
      if (!existing) {
        const displayName = String(metadata.display_name || session.user.email?.split('@')[0] || 'Nuevo usuario').slice(0, 40)
        await supabase.from('profiles').insert({ id: session.user.id, display_name: displayName, birth_date: metadata.birth_date || null, city: metadata.city || null, bio: metadata.bio || null })
      }
    }
    void ensureProfile()
  }, [session])

  function selectMedia(files: FileList | null, kind: 'photo' | 'video') {
    if (!files) return
    const acceptedFiles = Array.from(files).filter(file => kind === 'photo' ? file.type.startsWith('image/') : file.type.startsWith('video/'))
    if (kind === 'photo') {
      const next = [...photos, ...acceptedFiles].slice(0, 6)
      setPhotos(next); setPhotoPreviews(next.map(file => URL.createObjectURL(file)))
    } else {
      const next = [...videos, ...acceptedFiles].slice(0, 3)
      setVideos(next); setVideoPreviews(next.map(file => URL.createObjectURL(file)))
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setNotice('')
    if (mode === 'signup') {
      if (name.trim().length < 2) { setNotice('Escribe un nombre de al menos 2 caracteres.'); return }
      if (!birthDate || ageFromDate(birthDate) < 18) { setNotice('UnHolly es exclusivamente para mayores de 18 años.'); return }
      if (!accepted) { setNotice('Debes aceptar las condiciones y la política de privacidad.'); return }
      if (password.length < 8) { setNotice('La contraseña debe tener al menos 8 caracteres.'); return }
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim(), birth_date: birthDate, city: city.trim(), bio: bio.trim(), gender, looking_for: lookingFor, relationship_status: relationship, icebreaker } },
        })
        if (error) throw error
        if (!data.session) setNotice('Cuenta creada. Revisa tu correo para confirmar la dirección y después inicia sesión. Tus fotos y vídeos aún están en vista previa y podrás publicarlos al activar el almacenamiento multimedia.')
        else setNotice('¡Cuenta creada! Tu perfil básico ya está preparado. Completa tus fotos y vídeos desde tu perfil cuando el almacenamiento multimedia esté conectado.')
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

  return <main className="auth-page auth-page-v2">
    <div className="auth-showcase" aria-label="Ambiente social y encuentros">
      <div className="auth-showcase-image auth-image-one"/>
      <div className="auth-showcase-image auth-image-two"/>
      <div className="auth-showcase-image auth-image-three"/>
      <div className="auth-showcase-shade"/>
      <div className="auth-showcase-copy"><span className="auth-live"><i/> CONEXIONES SIN GUION</span><h2>Menos scroll.<br/><em>Más historias.</em></h2><p>Conoce gente, sal de la rutina y deja que pase algo bonito… o divertido.</p><div className="auth-social-proof"><span>💜</span><span>🥂</span><span>✨</span><small>Tu próxima aventura empieza con un hola.</small></div></div>
    </div>
    <section className="auth-card auth-card-v2">
      <a className="auth-brand" href="#"><span><Heart size={20} fill="currentColor"/></span>unholly<span className="brand-dot">.</span></a>
      <div className="auth-eyebrow">CONOCE · CONECTA · ENCUÉNTRATE</div>
      <h1>{mode === 'signup' ? 'Tu próxima historia' : 'Qué bueno verte'}<em>{mode === 'signup' ? ' empieza aquí.' : ' de nuevo.'}</em></h1>
      <p className="auth-intro">{mode === 'signup' ? 'Gente real, planes espontáneos y conexiones a tu manera.' : 'Entra en tu espacio y continúa donde lo dejaste.'}</p>
      <div className="auth-switch"><button type="button" className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setNotice('') }}>Crear cuenta</button><button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setNotice('') }}>Iniciar sesión</button></div>
      <form className="auth-form auth-form-v2" onSubmit={submit}>
        {mode === 'signup' && <>
          <div className="auth-form-section"><Sparkles size={15}/> TU PERFIL</div>
          <div className="auth-form-grid">
            <label>Nombre visible<div className="auth-input"><UserRound size={17}/><input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} placeholder="¿Cómo te llamamos?" maxLength={40} required/></div></label>
            <label>Fecha de nacimiento<div className="auth-input"><CalendarDays size={17}/><input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0,10)} required/></div></label>
          </div>
          <div className="auth-form-grid">
            <label>Ciudad<div className="auth-input"><MapPin size={17}/><input value={city} onChange={e => setCity(e.target.value)} placeholder="Tu ciudad" maxLength={60}/></div></label>
            <label>Género<div className="auth-input"><UserRound size={17}/><select value={gender} onChange={e => setGender(e.target.value)}><option value="">Prefiero indicarlo luego</option><option>Mujer</option><option>Hombre</option><option>No binario</option><option>Otro</option><option>Prefiero no decirlo</option></select></div></label>
          </div>
          <label>¿Qué te apetece encontrar?<div className="auth-input"><Heart size={17}/><select value={lookingFor} onChange={e => setLookingFor(e.target.value)}><option>Conocer gente y ver qué pasa</option><option>Una relación seria</option><option>Citas románticas</option><option>Algo casual, sin compromiso</option><option>Amistad y nuevos planes</option><option>Salir de fiesta y divertirme</option><option>Encontrar mi media naranja</option><option>Construir una familia</option></select></div></label>
          <label>Frase para romper el hielo<div className="auth-input"><Sparkles size={17}/><select value={icebreaker} onChange={e => setIcebreaker(e.target.value)}><option>Si hay buena conversación, el plan se improvisa.</option><option>¿Café, concierto o una aventura espontánea?</option><option>Vengo por las risas y me quedo por la química.</option><option>Mi talento: elegir canciones y malos chistes.</option><option>Un piropo ingenioso siempre suma, si hay respeto.</option><option>Mejor en persona: ¿cuál sería nuestro primer plan?</option></select></div></label>
          <div className="auth-form-grid">
            <label>Situación sentimental<div className="auth-input"><Heart size={17}/><select value={relationship} onChange={e => setRelationship(e.target.value)}><option>Soltero/a</option><option>Divorciado/a</option><option>Separado/a</option><option>Viudo/a</option><option>Prefiero no decirlo</option></select></div></label>
            <label>Sobre mí<div className="auth-input"><Sparkles size={17}/><input value={bio} onChange={e => setBio(e.target.value)} placeholder="Una frase que te describa" maxLength={240}/></div></label>
          </div>
          <div className="auth-form-section"><Camera size={15}/> FOTOS Y VÍDEOS DE PRESENTACIÓN</div>
          <div className="auth-media-pickers">
            <label className="auth-media-picker"><Camera size={18}/><strong>Añadir fotos</strong><small>Hasta 6 imágenes</small><input type="file" accept="image/*" multiple onChange={e => selectMedia(e.target.files,'photo')}/></label>
            <label className="auth-media-picker"><Video size={18}/><strong>Vídeos cortos</strong><small>Hasta 3 clips</small><input type="file" accept="video/*" multiple onChange={e => selectMedia(e.target.files,'video')}/></label>
          </div>
          {(photoPreviews.length > 0 || videoPreviews.length > 0) && <div className="auth-media-preview">{photoPreviews.map((src,i)=><img key={'p'+i} src={src} alt={'Vista previa '+(i+1)}/>)}{videoPreviews.map((src,i)=><video key={'v'+i} src={src} controls muted/> )}</div>}
          {(photos.length > 0 || videos.length > 0) && <small className="auth-media-note">Vista previa local: los archivos todavía no se suben a tu perfil. Se activará al conectar el almacenamiento seguro.</small>}
        </>}
        <div className="auth-form-section"><Mail size={15}/> ACCESO A TU CUENTA</div>
        <label>Correo electrónico<div className="auth-input"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required/></div></label>
        <label>Contraseña<div className="auth-input"><LockKeyhole size={17}/><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required/></div></label>
        {mode === 'signup' && <label className="auth-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>Confirmo que tengo 18 años o más y acepto las condiciones y la política de privacidad.</span></label>}
        {notice && <div className="auth-notice" role="status">{notice}</div>}
        <button className="auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={18}/> : <>{mode === 'signup' ? 'Crear mi cuenta' : 'Entrar'} <ArrowRight size={17}/></>}</button>
      </form>
      <div className="auth-privacy"><LockKeyhole size={14}/> Tú decides qué información y contenido muestras.</div>
      <div className="auth-footer">UnHolly es exclusivamente para mayores de 18 años.</div>
    </section>
  </main>
}
