import { useEffect, useMemo, useState } from 'react'
import {
  Heart, Compass, MapPin, MessageCircle, UserRound, ShieldCheck,
  Sparkles, SlidersHorizontal, Bell, Plus, Send, ChevronRight,
  Check, Crown, X, Menu, MoreHorizontal, LockKeyhole, Settings, LogOut, CircleHelp
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { AccountSettings } from './AccountSettings'

type Tab = 'discover' | 'map' | 'likes' | 'chats' | 'profile'
type Person = { id: number; name: string; age: number; city: string; distance: string; bio: string; tags: string[]; photo: string }

const people: Person[] = [
  { id: 1, name: 'Lucía', age: 28, city: 'Málaga', distance: '2 km', bio: 'Me gustan los conciertos pequeños, los paseos junto al mar y descubrir cafeterías nuevas.', tags: ['Música', 'Playa', 'Café'], photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop' },
  { id: 2, name: 'Clara', age: 31, city: 'Málaga', distance: '4 km', bio: 'Un buen plan empieza con una conversación y termina con una historia que contar.', tags: ['Viajes', 'Cine', 'Arte'], photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop' },
  { id: 3, name: 'Nerea', age: 26, city: 'Torremolinos', distance: '7 km', bio: 'Naturaleza, animales y música en directo. Busco conocer gente sin prisas.', tags: ['Naturaleza', 'Música', 'Animales'], photo: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop' },
]

const miniGameQuestions = [
  {q:'¿Qué planeta es conocido como el planeta rojo?',options:['Venus','Marte','Júpiter','Mercurio'],answer:'Marte',topic:'Cultura general'},
  {q:'¿Qué instrumento tiene normalmente seis cuerdas?',options:['Violín','Flauta','Guitarra','Arpa'],answer:'Guitarra',topic:'Música'},
  {q:'¿En qué saga aparece la Tierra Media?',options:['Dune','Star Wars','El Señor de los Anillos','Matrix'],answer:'El Señor de los Anillos',topic:'Cine y libros'},
  {q:'¿Qué estudio creó Mario?',options:['Nintendo','Sega','Atari','Capcom'],answer:'Nintendo',topic:'Videojuegos'},
  {q:'¿Cuál es el océano más grande?',options:['Atlántico','Índico','Ártico','Pacífico'],answer:'Pacífico',topic:'Cultura general'},
  {q:'¿Qué género musical nació en Jamaica?',options:['Reggae','Tango','Flamenco','Samba'],answer:'Reggae',topic:'Música'}
]

const initialChats = [
  { id: 1, name: 'Lucía', preview: '¡Me encanta ese grupo!', time: '12:42', photo: people[0].photo, messages: ['¡Hola! ¿Qué música escuchas últimamente?', 'Mucho indie y rock. ¿Y tú?', '¡Me encanta ese grupo!'] },
  { id: 2, name: 'Clara', preview: '¿Te apetece un café?', time: 'Ayer', photo: people[1].photo, messages: ['Hola 😊', '¿Te apetece un café esta semana?'] },
]

export function DemoApp() {
  const [tab, setTab] = useState<Tab>('discover')
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<number[]>([])
  const [passed, setPassed] = useState<number[]>([])
  const [chats, setChats] = useState(initialChats)
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [profileName, setProfileName] = useState('Tu perfil')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [coins, setCoins] = useState(20)
  const [pendingIntro, setPendingIntro] = useState<number[]>([])
  const [coinStoreOpen, setCoinStoreOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<Person | null>(null)
  const [accountEmail, setAccountEmail] = useState('')
  const [gameOpen, setGameOpen] = useState(false)
  const [gameQuestionIndex, setGameQuestionIndex] = useState(0)
  const [gameAnswer, setGameAnswer] = useState('')
  const [gameResult, setGameResult] = useState('')
  const [premiumMinutes, setPremiumMinutes] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)

  useEffect(() => {
    let alive = true
    if (supabase) supabase.auth.getUser().then(({ data }) => { if (alive) setAccountEmail(data.user?.email || '') })
    return () => { alive = false }
  }, [])

  async function signOut() {
    if (!supabase) { flash('La sesión de demostración no está conectada.'); return }
    const { error } = await supabase.auth.signOut()
    if (error) flash('No se pudo cerrar sesión: ' + error.message)
    else { setAccountOpen(false); flash('Has cerrado sesión correctamente.') }
  }

  const current = people[index % people.length]
  const active = chats.find(c => c.id === activeChat)
  const remaining = useMemo(() => people.filter(p => !liked.includes(p.id) && !passed.includes(p.id)), [liked, passed])

  function flash(text: string) { setNotice(text); window.setTimeout(() => setNotice(''), 2600) }
  function likePerson() {
    if (!current) return
    setLiked(old => old.includes(current.id) ? old : [...old, current.id])
    flash('Like guardado en esta demostración')
    setIndex(i => i + 1)
  }
  function passPerson() { setPassed(old => [...old, current.id]); setIndex(i => i + 1) }
  function openIntro(p: Person) {
    if (coins < 5) { flash('Necesitas 5 monedas para enviar un primer saludo.'); return }
    setCoins(v => v - 5)
    setPendingIntro(old => old.includes(p.id) ? old : [...old, p.id])
    setChats(old => old.some(c => c.id === p.id) ? old : [...old, { id: p.id, name: p.name, preview: 'Tu primer saludo', time: 'Ahora', photo: p.photo, messages: ['Tu primer saludo está enviado.'] }])
    setActiveChat(p.id); setTab('chats')
    flash('Primer saludo enviado · 5 monedas reservadas hasta recibir respuesta')
  }
  function markIntroAnswered() {
    if (!activeChat || !pendingIntro.includes(activeChat)) return
    setPendingIntro(old => old.filter(id => id !== activeChat))
    setCoins(v => v + 5)
    flash('Te han respondido: las 5 monedas se han devuelto')
  }
  function reportPerson(p: Person, reason: string) {
    setReportTarget(null)
    flash('Denuncia recibida. El equipo de seguridad revisará el caso.')
  }
  function sendMessage() {
    if (!message.trim() || !activeChat) return
    setChats(old => old.map(c => c.id === activeChat ? { ...c, preview: message, time: 'Ahora', messages: [...c.messages, message] } : c))
    setMessage('')
  }
  function startMiniGame() {
    if (gamesPlayed >= 3) { flash('Has alcanzado el límite de 3 partidas de recompensa de esta demo.'); return }
    setGameQuestionIndex(Math.floor(Math.random() * miniGameQuestions.length))
    setGameAnswer('')
    setGameResult('')
    setGameOpen(true)
  }
  function answerMiniGame(option: string) {
    if (gameAnswer) return
    setGameAnswer(option)
    setGamesPlayed(v => v + 1)
    if (option === miniGameQuestions[gameQuestionIndex].answer) {
      setPremiumMinutes(v => Math.min(30, v + 10))
      setGameResult('¡Correcto! Has ganado 10 minutos de Premium de prueba.')
      flash('¡Has ganado 10 minutos Premium de prueba!')
    } else {
      setPremiumMinutes(v => Math.min(30, v + 2))
      setGameResult('¡Buen intento! Te llevas 2 minutos de cortesía. La respuesta era: ' + miniGameQuestions[gameQuestionIndex].answer)
      flash('Has ganado 2 minutos Premium de prueba por participar.')
    }
    if (activeChat) {
      const resultText = option === miniGameQuestions[gameQuestionIndex].answer ? '🎮 Ha ganado el reto de trivia' : '🎮 Ha jugado un reto de trivia'
      setChats(old => old.map(chat => chat.id === activeChat ? {...chat,preview:resultText,time:'Ahora',messages:[...chat.messages,resultText]} : chat))
    }
  }
  function addDemoAttachment(label: string) {
    if (!activeChat) return
    setChats(old => old.map(c => c.id === activeChat ? { ...c, preview: label, time: 'Ahora', messages: [...c.messages, label] } : c))
    flash(label + ' añadido a la conversación de demostración')
  }

  const nav = [
    { id: 'discover' as Tab, label: 'Descubrir', icon: Compass },
    { id: 'map' as Tab, label: 'Mapa', icon: MapPin },
    { id: 'likes' as Tab, label: 'Likes', icon: Heart },
    { id: 'chats' as Tab, label: 'Chats', icon: MessageCircle },
    { id: 'profile' as Tab, label: 'Perfil', icon: UserRound },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('discover') }}>
          <span className="brand-mark"><Heart size={20} fill="currentColor" /></span>
          <span>unholly<span className="brand-dot">.</span></span>
        </a>
        <div className="side-caption">TU ESPACIO</div>
        <nav className="side-nav">
          {nav.map(item => <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => { setTab(item.id); setActiveChat(null); setMobileMenu(false) }}><item.icon size={19} /><span>{item.label}</span>{item.id === 'likes' && liked.length > 0 && <b className="nav-count">{liked.length}</b>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="plus-card"><div className="plus-icon"><Crown size={18}/></div><strong>UnHolly Plus</strong><p>Descubre más posibilidades.</p><button onClick={() => flash('Los planes Premium se activarán más adelante')}>Conocer Plus <ChevronRight size={14}/></button></div>
          <button className="safety-link" onClick={() => flash('Centro de seguridad: versión inicial')}><ShieldCheck size={18}/> Centro de seguridad</button>
          <div className="mini-user"><div className="avatar-placeholder">T</div><div><strong>{profileName}</strong><small>Cuenta de demostración</small></div><MoreHorizontal size={19}/></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21}/></button>
          <div className="breadcrumb">UnHolly <span>/</span> <strong>{nav.find(n => n.id === tab)?.label}</strong></div>
          <div className="top-actions"><span className="location-pill"><MapPin size={14}/> Málaga</span><button className="icon-btn" aria-label="Notificaciones" onClick={() => flash('No tienes notificaciones nuevas')}><Bell size={19}/></button><button className="icon-btn" aria-label="Configuración" onClick={() => setAccountOpen(true)}><Settings size={18}/></button><button className="avatar-placeholder small account-avatar" aria-label="Abrir cuenta" onClick={() => setAccountOpen(true)}>T</button></div>
        </header>

        <div className="content tab-transition" key={tab}>
          {tab === 'discover' && <section className="discover-view">
            <div className="section-heading"><div><div className="eyebrow">CONEXIONES CON SENTIDO</div><h1>Hay personas por <em>descubrir.</em></h1><p>Conoce gente nueva, a tu ritmo y sin presiones.</p></div><button className="outline-btn" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17}/> Filtros</button></div>
            {showFilters && <div className="filter-panel"><strong>Preferencias de descubrimiento</strong><div className="filter-chips"><button className="chip selected">Cerca de mí</button><button className="chip">Relación</button><button className="chip">Amistad</button><button className="chip">Conocer gente</button></div><small>Los filtros avanzados estarán disponibles cuando conectemos tu cuenta.</small></div>}
            <div className="discover-layout">
              <div className="profile-card">
                <div className="profile-photo" style={{ backgroundImage: `linear-gradient(180deg, transparent 48%, rgba(12,8,19,.9) 100%), url("${current.photo}")` }}>
                  <span className="online-tag"><span/> Perfil de ejemplo</span>
                  <button className="photo-more" onClick={() => flash('Opciones de perfil de demostración')}><MoreHorizontal size={21}/></button>
                  <div className="photo-info"><div className="profile-name">{current.name}, {current.age}</div><div className="profile-location"><MapPin size={14}/>{current.city} · {current.distance}</div></div>
                </div>
                <div className="profile-details"><p>{current.bio}</p><div className="tag-row">{current.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div><div className="card-actions"><button className="pass-action" onClick={passPerson} aria-label="Pasar"><X size={23}/></button><button className="like-action" onClick={likePerson} aria-label="Me gusta"><Heart size={24} fill="currentColor"/></button></div></div>
              </div>
              <aside className="discover-aside"><div className="aside-title"><Sparkles size={17}/> Una conexión empieza aquí</div><h3>No se trata de deslizar sin parar.</h3><p>Queremos que descubras personas con intereses y formas de ver la vida que conecten contigo.</p><div className="aside-stat"><div><strong>{liked.length}</strong><span>Likes enviados</span></div><div><strong>{remaining.length}</strong><span>Perfiles por ver</span></div></div><div className="privacy-note"><LockKeyhole size={17}/><span>Tu ubicación exacta nunca se muestra a otros perfiles.</span></div></aside>
            </div>
          </section>}

          {tab === 'map' && <section><div className="section-heading"><div><div className="eyebrow">CERCA DE TI</div><h1>La ciudad también <em>conecta.</em></h1><p>Explora planes y encuentros compartidos.</p></div><button className="primary-btn" onClick={() => flash('La creación de quedadas llegará en una próxima etapa')}><Plus size={17}/> Crear quedada</button></div><div className="map-placeholder"><div className="map-grid"></div><div className="map-center"><MapPin size={28}/><strong>Málaga</strong><span>Vista de mapa de demostración</span></div><div className="map-pin pin-one"><MapPin/></div><div className="map-pin pin-two"><MapPin/></div><div className="map-pin pin-three"><MapPin/></div><div className="map-disclaimer">Ubicaciones ilustrativas · No representa personas reales</div></div><div className="event-row"><div className="event-icon"><Sparkles/></div><div><strong>Planes por descubrir</strong><p>Próximamente podrás encontrar quedadas públicas y proponer tus propios planes.</p></div></div></section>}

          {tab === 'likes' && <section><div className="section-heading"><div><div className="eyebrow">INTERÉS MUTUO</div><h1>Tus <em>likes.</em></h1><p>Personas a las que has mostrado interés en esta demo.</p></div></div><div className="people-grid">{liked.length ? people.filter(p => liked.includes(p.id) && !passed.includes(p.id)).map(p => <div className="person-tile like-person" key={p.id}><img src={p.photo} alt="Perfil de ejemplo"/><div className="like-person-info"><strong>{p.name}, {p.age}</strong><small>{p.city}</small><div className="like-person-actions"><button className="primary-btn" onClick={() => openIntro(p)}><MessageCircle size={14}/> Enviar mensaje · 5 🪙</button><button className="quiet-action" onClick={() => { setPassed(old => old.includes(p.id) ? old : [...old, p.id]); flash('Perfil ocultado. No volverás a verlo en esta demo.') }}>No me interesa</button><button className="quiet-action danger-action" onClick={() => setReportTarget(p)}>Denunciar</button></div></div></div>) : <div className="empty-state"><Heart size={28}/><h3>Aún no has enviado likes</h3><p>Cuando alguien te llame la atención, toca el corazón para mostrar interés.</p><button className="primary-btn" onClick={() => setTab('discover')}>Descubrir personas</button></div>}</div></section>}

          {tab === 'chats' && <section><div className="section-heading"><div><div className="eyebrow">CONVERSACIONES</div><h1>Un hola puede ser <em>el comienzo.</em></h1><p>Tus conversaciones, en un solo lugar.</p></div><div className="coin-balance"><span>🪙 {coins} monedas</span><button onClick={() => setCoinStoreOpen(true)}>Conseguir monedas</button></div></div><div className="chat-layout"><div className="chat-list">{chats.map(c => <button className={`chat-list-item ${activeChat === c.id ? 'selected' : ''}`} key={c.id} onClick={() => setActiveChat(c.id)}><img src={c.photo} alt=""/><div><strong>{c.name}</strong><small>{c.preview}</small></div><time>{c.time}</time></button>)}</div><div className="chat-window">{active ? <><div className="chat-head"><img src={active.photo} alt=""/><div><strong>{active.name}</strong><small>Conversación de demostración</small></div>{pendingIntro.includes(active.id) && <button className="reply-demo" onClick={markIntroAnswered}>Simular respuesta · devolver monedas</button>}</div><div className="messages">{active.messages.map((m, i) => <div className={`bubble ${i === active.messages.length - 1 ? 'mine' : ''}`} key={i}>{m}</div>)}</div><div className="inbox-tools"><button onClick={() => addDemoAttachment('😊 Sticker')}>☺️ Sticker</button><button onClick={() => addDemoAttachment('GIF divertido')}>GIF</button><button onClick={() => addDemoAttachment('🎙️ Audio de prueba')}>🎙️ Audio</button><button onClick={startMiniGame}>🎮 Jugar juntos</button><label className="attach-file">＋ Archivo<input type="file" onChange={e => { if (e.target.files?.[0]) addDemoAttachment('📎 ' + e.target.files[0].name) }}/></label></div><form className="message-form" onSubmit={e => { e.preventDefault(); sendMessage() }}><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribe un mensaje…"/><button className="send-btn" type="submit"><Send size={17}/></button></form></> : <div className="chat-empty"><MessageCircle size={30}/><strong>Elige una conversación</strong><span>Selecciona un chat para ver los mensajes.</span></div>}</div></div></section>}

          {tab === 'profile' && <section><div className="section-heading"><div><div className="eyebrow">TU IDENTIDAD</div><h1>Este espacio es <em>tuyo.</em></h1><p>Más adelante podrás completar tu perfil y tus preferencias.</p></div></div><div className="settings-card"><div className="profile-edit-avatar">T</div><div className="profile-edit-fields"><label>Nombre visible<input value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={30}/></label><div className="profile-progress"><span>Perfil de demostración</span><span>Vista previa</span></div><div className="progress-track"><span/></div><p>Los cambios de esta pantalla solo se guardan temporalmente en este navegador.</p></div></div><div className="settings-row"><ShieldCheck/><div><strong>Privacidad y seguridad</strong><small>Controles de cuenta, bloqueo y denuncias.</small></div><ChevronRight/></div><div className="settings-row"><LockKeyhole/><div><strong>Datos y permisos</strong><small>Gestiona la información que compartes.</small></div><ChevronRight/></div></section>}
        </div>
        <footer className="app-footer"><span>UnHolly © 2026</span><span>{isSupabaseConfigured ? 'Servicios conectados' : 'Entorno de demostración · Backend pendiente'}</span><span>Hecho para conectar 💜</span></footer>
      </main>
      {gameOpen && <div className="settings-backdrop" onClick={() => setGameOpen(false)}><section className="report-dialog mini-game-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="icon-btn report-close" onClick={() => setGameOpen(false)}><X size={18}/></button><span className="eyebrow">UNHOLLY PLAY · {miniGameQuestions[gameQuestionIndex].topic.toUpperCase()}</span><h2>Reto rompehielos 🎮</h2><p>Una pregunta rápida para conoceros y divertiros. En esta versión de prueba responde tu perfil; el rival es simulado.</p><div className="game-progress">Partida {gamesPlayed + (gameAnswer ? 0 : 1)} de 3 · Recompensas máximas: 30 min por sesión</div><h3 className="game-question">{miniGameQuestions[gameQuestionIndex].q}</h3><div className="game-options">{miniGameQuestions[gameQuestionIndex].options.map(option => <button key={option} disabled={!!gameAnswer} className={gameAnswer===option?'chosen':''} onClick={() => answerMiniGame(option)}>{option}</button>)}</div>{gameResult && <div className="game-result"><strong>{gameResult}</strong><span>Saldo de Premium de prueba: {premiumMinutes} minutos</span><button className="settings-save" onClick={() => setGameOpen(false)}>Volver al chat</button></div>}<div className="settings-note"><Crown size={15}/> Los minutos son una recompensa de demostración, no activan una suscripción real. A futuro, los retos patrocinados y anuncios voluntarios pueden financiar estos premios sin cobrar por jugar.</div></section></div>}{coinStoreOpen && <div className="settings-backdrop" onClick={() => setCoinStoreOpen(false)}><section className="report-dialog coin-store" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="icon-btn report-close" onClick={() => setCoinStoreOpen(false)}><X size={18}/></button><span className="eyebrow">MONEDERO UNHOLLY</span><h2>Monedas para primeros saludos</h2><p>Los paquetes son una propuesta de precios. Los pagos todavía no están conectados.</p>{[{n:30,p:'0,99 €'},{n:80,p:'1,99 €'},{n:200,p:'3,99 €'}].map(pack => <div className="coin-pack" key={pack.n}><strong>🪙 {pack.n} monedas</strong><span>{pack.p}</span><button onClick={() => flash('Las compras estarán disponibles cuando conectemos pagos seguros.')}>Elegir</button></div>)}<small>Solo se descuentan 5 monedas al enviar un primer saludo. Si la otra persona responde, se devuelven automáticamente cuando el sistema de mensajería esté conectado.</small></section></div>}{reportTarget && <div className="settings-backdrop" onClick={() => setReportTarget(null)}><section className="report-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="icon-btn report-close" onClick={() => setReportTarget(null)}><X size={18}/></button><span className="eyebrow">CENTRO DE SEGURIDAD</span><h2>Denunciar a {reportTarget.name}</h2><p>Elige el motivo. La denuncia es privada y será revisada por moderación.</p>{['Spam o mensajes repetidos','Acoso o intimidación','Contenido sexual no solicitado','Perfil falso o suplantación','Amenazas o comportamiento peligroso','Otro motivo'].map(reason => <button className="report-reason" key={reason} onClick={() => reportPerson(reportTarget, reason)}>{reason}<ChevronRight size={16}/></button>)}<small>No se suspende una cuenta solo por acumular denuncias: se revisan pruebas, gravedad y reincidencia. Los casos graves pueden implicar suspensión o baneo.</small></section></div>}{notice && <div className="toast"><Check size={17}/>{notice}</div>}
      {accountOpen && <AccountSettings onClose={() => setAccountOpen(false)} profileName={profileName} setProfileName={setProfileName} flash={flash}/>} 
      <nav className="mobile-nav">{nav.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setActiveChat(null) }}><item.icon size={20}/><span>{item.label}</span></button>)}</nav>
    </div>
  )
}

import { AuthGate } from './AuthGate'

export default function App() {
  return <AuthGate><DemoApp /></AuthGate>
}
