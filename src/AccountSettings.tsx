import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, LogOut, UserRound, SlidersHorizontal, Shield, Bell, Palette, HelpCircle, Save } from 'lucide-react'
import { supabase } from './lib/supabase'

type Props = { onClose: () => void; profileName: string; setProfileName: (v:string)=>void; flash: (v:string)=>void }
export function AccountSettings({onClose,profileName,setProfileName,flash}:Props) {
 const [page,setPage]=useState('home')
 const [city,setCity]=useState('Málaga')
 const [distance,setDistance]=useState('25')
 const [minAge,setMinAge]=useState('18')
 const [maxAge,setMaxAge]=useState('45')
 const [gender,setGender]=useState('Cualquier género')
 const [intent,setIntent]=useState('Conocer gente')
 const [bodies,setBodies]=useState<string[]>([])
 const [visible,setVisible]=useState(true)
 const [privateMode,setPrivateMode]=useState(false)
 const [notifications,setNotifications]=useState(true)
 const [email,setEmail]=useState('')
 supabase.auth.getUser().then(({data})=>setEmail(data.user?.email||''))
 const choices=['Delgada','Atlética','Media','Curvilínea','Grande / gordita','Robusta','Cualquier complexión']
 const title:Record<string,string>={home:'Configuración',profile:'Mi cuenta y perfil',search:'Preferencias de búsqueda',privacy:'Privacidad y seguridad',notifications:'Notificaciones',appearance:'Apariencia',help:'Ayuda y soporte'}
 const save=()=>{flash('Cambios guardados en esta vista. La sincronización se conectará en una próxima etapa.');setPage('home')}
 return <div className="settings-backdrop" onClick={onClose}><section className="account-panel" onClick={e=>e.stopPropagation()}>
  <header className="account-panel-head"><div>{page!=='home'&&<button className="settings-back" onClick={()=>setPage('home')}><ChevronLeft size={16}/> Volver</button>}<div className="eyebrow">UNHOLLY · TU CUENTA</div><h2>{title[page]}</h2></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></header>
  {page==='home'&&<><div className="account-summary"><div className="avatar-placeholder account-large">{profileName.slice(0,1).toUpperCase()}</div><div><strong>{profileName}</strong><small>{email}</small></div></div>
   {[
    ['profile','Mi cuenta y perfil','Datos personales y correo',UserRound],
    ['search','Preferencias de búsqueda','Ciudad, distancia, edades y tipo de persona',SlidersHorizontal],
    ['privacy','Privacidad y seguridad','Visibilidad y control de datos',Shield],
    ['notifications','Notificaciones','Likes, matches, mensajes y eventos',Bell],
    ['appearance','Apariencia','Tema y tamaño de texto',Palette],
    ['help','Ayuda y soporte','Normas y asistencia',HelpCircle]
   ].map(([id,name,desc,Icon])=><button className="account-option" key={String(id)} onClick={()=>setPage(String(id))}><Icon/><span><strong>{String(name)}</strong><small>{String(desc)}</small></span><ChevronRight/></button>)}
   <button className="account-logout" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error)flash(error.message);else onClose()}}><LogOut size={17}/> Cerrar sesión</button><div className="account-version">UnHolly · Configuración</div></>}
  {page==='search'&&<div className="settings-form"><p className="settings-help">Define a quién quieres encontrar. Estas preferencias son privadas.</p>
   <label>Ciudad o zona<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Ej. Málaga"/></label>
   <label>Distancia máxima: {distance} km<input type="range" min="1" max="100" value={distance} onChange={e=>setDistance(e.target.value)}/></label>
   <div className="settings-two"><label>Edad mínima<input type="number" min="18" max="99" value={minAge} onChange={e=>setMinAge(e.target.value)}/></label><label>Edad máxima<input type="number" min="18" max="99" value={maxAge} onChange={e=>setMaxAge(e.target.value)}/></label></div>
   <label>¿A quién quieres conocer?<select value={gender} onChange={e=>setGender(e.target.value)}><option>Cualquier género</option><option>Mujeres</option><option>Hombres</option><option>Personas no binarias</option></select></label>
   <label>¿Qué tipo de relación buscas?<select value={intent} onChange={e=>setIntent(e.target.value)}><option>Conocer gente</option><option>Relación estable</option><option>Relación casual</option><option>Amistad</option><option>Citas y ver qué surge</option><option>Planes y comunidad</option></select></label>
   <div className="settings-field"><strong>Complexión física que prefieres</strong><small>Selección múltiple, opcional y privada.</small><div className="settings-choice-grid">{choices.map(v=><button key={v} className={bodies.includes(v)?'selected':''} onClick={()=>setBodies(old=>old.includes(v)?old.filter(x=>x!==v):[...old,v])}>{v}</button>)}</div></div>
   <div className="settings-note"><Shield size={15}/> Solo se podrá filtrar por información que cada persona haya decidido compartir. No se mostrarán preferencias privadas.</div><button className="settings-save" onClick={save}><Save size={16}/> Guardar preferencias</button></div>}
  {page==='profile'&&<div className="settings-form"><label>Nombre visible<input value={profileName} onChange={e=>setProfileName(e.target.value)} maxLength={40}/></label><label>Correo electrónico<input value={email} readOnly/></label><div className="settings-note">La fecha de nacimiento se utiliza para el requisito +18 y no se muestra en tu perfil público.</div><button className="settings-save" onClick={save}><Save size={16}/> Guardar cambios</button></div>}
  {page==='privacy'&&<div className="settings-form"><label className="settings-toggle"><span><strong>Mostrar mi perfil en Descubrir</strong><small>Permite que otros perfiles te encuentren.</small></span><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/></label><label className="settings-toggle"><span><strong>Modo privado</strong><small>Oculta tu perfil de listados públicos.</small></span><input type="checkbox" checked={privateMode} onChange={e=>setPrivateMode(e.target.checked)}/></label><div className="settings-note">Estos controles son visuales por ahora. La ubicación exacta nunca debe compartirse.</div><button className="settings-save" onClick={save}><Save size={16}/> Guardar privacidad</button></div>}
  {page==='notifications'&&<div className="settings-form"><label className="settings-toggle"><span><strong>Notificaciones generales</strong><small>Actividad importante de tu cuenta.</small></span><input type="checkbox" checked={notifications} onChange={e=>setNotifications(e.target.checked)}/></label>{['Nuevos likes','Nuevos matches','Mensajes y llamadas','Quedadas y eventos','Novedades de UnHolly'].map(v=><label className="settings-toggle" key={v}><span><strong>{v}</strong><small>Preferencia de aviso.</small></span><input type="checkbox" defaultChecked/></label>)}<button className="settings-save" onClick={save}><Save size={16}/> Guardar notificaciones</button></div>}
  {page==='appearance'&&<div className="settings-form"><label>Tema<select defaultValue="Oscuro violeta"><option>Oscuro violeta</option><option>Oscuro</option><option>Claro (próximamente)</option></select></label><label>Tamaño de texto<select defaultValue="Normal"><option>Pequeño</option><option>Normal</option><option>Grande</option></select></label></div>}
  {page==='help'&&<div className="settings-form"><div className="settings-help-card"><HelpCircle size={25}/><strong>Ayuda y soporte</strong><p>UnHolly está en desarrollo. Antes de abrir al público añadiremos soporte, normas comunitarias y gestión de denuncias.</p></div></div>}
 </section></div>
}