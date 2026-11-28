import { FormEvent, ReactNode, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Heart, Mail, LockKeyhole, UserRound, CalendarDays, ArrowRight, LoaderCircle, MapPin, Camera, Video, Sparkles, ChevronLeft, Apple, Facebook } from 'lucide-react'
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
  const [screen, setScreen] = useState<'welcome' | 'access' | 'profile' | 'media'>('welcome')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('Málaga')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [lookingFor, setLookingFor] = useState('Conocer gente y ver qué pasa')
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
        const fullName = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') || metadata.display_name || session.user.email?.split('@')[0] || 'Nuevo usuario'
        await supabase.from('profiles').insert({ id: session.user.id, display_name: String(fullName).slice(0, 40), birth_date: metadata.birth_date || null, city: metadata.city || null, bio: metadata.bio || null })
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

  async function socialLogin(provider: 'google' | 'apple' | 'facebook') {
    if (!supabase) { setNotice('Configura Supabase para activar el acceso con proveedores externos.'); return }
    setBusy(true); setNotice('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })
      if (error) throw error
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo iniciar el acceso externo.')
      setBusy(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setNotice('')
    if (mode === 'signup') {
      if (screen === 'profile') {
        if (firstName.trim().length < 2 || lastName.trim().length < 2) { setNotice('Indica tu nombre y apellido.'); return }
        if (!birthDate || ageFromDate(birthDate) < 18) { setNotice('UnHolly es exclusivamente para mayores de 18 años.'); return }
        if (!accepted) { setNotice('Debes confirmar que eres mayor de 18 años y aceptar las condiciones.'); return }
        setScreen('media'); return
      }
      if (password.length < 8) { setNotice('La contraseña debe tener al menos 8 caracteres.'); return }
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const fullName = [firstName.trim(), lastName.trim()].join(' ')
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), display_name: fullName, birth_date: birthDate, city: city.trim(), bio: bio.trim(), gender, looking_for: lookingFor } },
        })
        if (error) throw error
        if (!data.session) setNotice('Cuenta creada. Confirma tu correo para entrar. Las fotos y vídeos quedan seleccionados en esta sesión, pero todavía no se publican: falta conectar el almacenamiento seguro.')
        else setNotice('¡Cuenta creada! Tu perfil básico ya está preparado. Para publicar tus fotos y vídeos falta activar el almacenamiento seguro.')
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

  return <main className="uh-entry">
    {screen === 'welcome' && <section className="uh-welcome">
      <div className="uh-welcome-photo"/>
      <div className="uh-welcome-overlay"/>
      <div className="uh-welcome-top"><a className="uh-logo"><Heart fill="currentColor"/> unholly<span>.</span></a><span className="uh-adult">18+ · SOLO ADULTOS</span></div>
      <div className="uh-welcome-bottom"><div className="uh-kicker"><i/> CONEXIONES REALES, MOMENTOS INESPERADOS</div><h1>Que empiece<br/>la <em>química.</em></h1><p>Personas que te despiertan curiosidad. Planes que no estaban en tus planes. Historias que empiezan aquí.</p><button className="uh-primary" onClick={() => setScreen('access')}>Entrar en UnHolly <ArrowRight size={18}/></button><div className="uh-footnote">Conoce · Coquetea · Sal · Enamórate · Sé tú</div></div>
      <div className="uh-image-credit">Imagen ilustrativa · Unsplash</div>
    </section>}

    {screen === 'access' && <section className="uh-access">
      <button className="uh-back" onClick={() => {setScreen('welcome');setNotice('')}}><ChevronLeft/> Volver</button>
      <div className="uh-access-art"><div className="uh-access-image"/><div className="uh-access-art-copy"><span>UNHOLLY / 2027</span><strong>La vida pasa<br/>cuando conectas.</strong></div></div>
      <div className="uh-access-panel"><a className="uh-logo"><Heart fill="currentColor"/> unholly<span>.</span></a><div className="uh-kicker">TU SIGUIENTE CAPÍTULO</div><h2>{mode === 'login' ? 'Qué bueno tenerte de vuelta.' : '¿Y si hoy conoces a alguien especial?'}</h2><p>Entra a tu cuenta o crea tu espacio. Tú decides qué historia quieres vivir.</p>
        <div className="uh-social-buttons">
          <button onClick={() => socialLogin('google')} disabled={busy}><b className="uh-google-g">G</b> Continuar con Google</button>
          <button onClick={() => socialLogin('apple')} disabled={busy}><Apple/> Continuar con Apple</button>
          <button onClick={() => socialLogin('facebook')} disabled={busy}><Facebook/> Continuar con Facebook</button>
        </div>
        <div className="uh-or"><span/> O CON TU CORREO <span/></div>
        <button className="uh-email-choice" onClick={() => {setMode('signup');setScreen('profile');setNotice('')}}><Mail/> Crear perfil con correo <ArrowRight/></button>
        <button className="uh-login-choice" onClick={() => {setMode('login');setNotice('')}}>¿Ya tienes cuenta? <strong>Iniciar sesión</strong></button>
        {mode === 'login' && <form className="uh-login-form" onSubmit={submit}><label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="uh-primary" disabled={busy}>{busy?<LoaderCircle className="spin"/>:'Iniciar sesión'} <ArrowRight/></button></form>}
        {notice && <div className="uh-notice" role="status">{notice}</div>}
        <small className="uh-legal">Al continuar aceptas nuestras condiciones y política de privacidad. UnHolly es exclusivamente para mayores de 18 años.</small>
      </div>
    </section>}

    {(screen === 'profile' || screen === 'media') && <section className="uh-builder">
      <header className="uh-builder-header"><button className="uh-back" onClick={() => setScreen(screen === 'media' ? 'profile' : 'access')}><ChevronLeft/> Atrás</button><a className="uh-logo"><Heart fill="currentColor"/> unholly<span>.</span></a><span className="uh-step-count">{screen === 'profile' ? '01' : '02'} / 02</span></header>
      <div className="uh-progress"><i style={{width:screen==='profile'?'50%':'100%'}}/></div>
      {screen === 'profile' ? <div className="uh-builder-content"><div className="uh-kicker">VAMOS A CONOCERNOS</div><h1>Primero, <em>tú.</em></h1><p className="uh-builder-intro">Cuéntanos lo esencial. Tu perfil debe sentirse como tú, no como un formulario.</p>
        <form className="uh-profile-form" onSubmit={submit}>
          <div className="uh-field-pair"><label>Nombre<input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Tu nombre" autoComplete="given-name" required/></label><label>Apellido<input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Tu apellido" autoComplete="family-name" required/></label></div>
          <label>Fecha de nacimiento<div className="uh-input-icon"><CalendarDays/><input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} max={new Date().toISOString().slice(0,10)} required/></div><small>Tu edad se mostrará en el perfil; tu fecha completa no será pública.</small></label>
          <div className="uh-field-pair"><label>Ciudad<div className="uh-input-icon"><MapPin/><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Tu ciudad"/></div></label><label>¿Cómo te identificas?<select value={gender} onChange={e=>setGender(e.target.value)}><option value="">Prefiero no decirlo</option><option>Mujer</option><option>Hombre</option><option>No binario</option><option>Otra identidad</option></select></label></div>
          <label>¿Qué te gustaría encontrar?<select value={lookingFor} onChange={e=>setLookingFor(e.target.value)}><option>Conocer gente y ver qué pasa</option><option>Una relación seria</option><option>Citas románticas</option><option>Algo casual, sin compromiso</option><option>Amistad y nuevos planes</option><option>Salir de fiesta y divertirme</option><option>Encontrar mi media naranja</option><option>Construir una familia</option></select></label>
          <label>Tu presentación<textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="¿Qué te hace ser tú? Una frase, una pasión, una pequeña locura…" maxLength={300}/></label>
          <label className="uh-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> Tengo 18 años o más y acepto las condiciones y la política de privacidad.</label>
          {notice && <div className="uh-notice">{notice}</div>}
          <button className="uh-primary" type="submit">Continuar a mis fotos <ArrowRight/></button>
        </form>
      </div> : <div className="uh-builder-content uh-media-step"><div className="uh-kicker">TU LADO MÁS AUTÉNTICO</div><h1>Que te <em>vean.</em></h1><p className="uh-builder-intro">Las fotos cuentan tu historia. Añade imágenes y pequeños vídeos para que puedan conocerte mejor.</p>
        <div className="uh-upload-grid"><label className="uh-upload-card uh-main-upload"><Camera/><strong>Tu foto principal</strong><small>La primera impresión empieza aquí</small><input type="file" accept="image/*" onChange={e=>selectMedia(e.target.files,'photo')}/></label><label className="uh-upload-card"><Sparkles/><strong>Más fotos</strong><small>Hasta 6 imágenes</small><input type="file" accept="image/*" multiple onChange={e=>selectMedia(e.target.files,'photo')}/></label><label className="uh-upload-card"><Video/><strong>Vídeos cortos</strong><small>Hasta 3 clips</small><input type="file" accept="video/*" multiple onChange={e=>selectMedia(e.target.files,'video')}/></label></div>
        <div className="uh-credentials"><div className="uh-kicker">CREA TU ACCESO</div><label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" required/></label><label>Contraseña<input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required/></label></div>
        {(photoPreviews.length>0 || videoPreviews.length>0) && <div className="uh-media-preview">{photoPreviews.map((src,i)=><img key={'p'+i} src={src} alt={'Foto seleccionada '+(i+1)}/>)}{videoPreviews.map((src,i)=><video key={'v'+i} src={src} controls muted/>)}</div>}
        {notice && <div className="uh-notice">{notice}</div>}
        <button className="uh-primary" disabled={busy} onClick={async()=>{if(!supabase)return;if(!email.trim()||password.length<8){setNotice('Introduce un correo y una contraseña de al menos 8 caracteres.');return}setBusy(true);setNotice('');try{const fullName=[firstName.trim(),lastName.trim()].join(' ');const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{first_name:firstName.trim(),last_name:lastName.trim(),display_name:fullName,birth_date:birthDate,city:city.trim(),bio:bio.trim(),gender,looking_for:lookingFor}}});if(error)throw error;if(!data.session)setNotice('Cuenta creada. Confirma tu correo para continuar. Las imágenes y vídeos seleccionados son una vista previa: falta conectar el almacenamiento seguro.');else setNotice('¡Bienvenido/a a UnHolly! Tu cuenta está creada. Tus archivos aún no se publican hasta activar el almacenamiento seguro.')}catch(error){setNotice(error instanceof Error?error.message:'No se pudo crear la cuenta.')}finally{setBusy(false)}}}>{busy?<LoaderCircle className="spin"/>:'Crear mi cuenta'} <ArrowRight/></button>
        <small className="uh-media-privacy">Tus archivos deben ser tuyos y mostrarte a ti. Podrás decidir qué contenido es visible. No publicamos nada sin tu acción.</small>
      </div>}
    </section>}
  </main>
}
