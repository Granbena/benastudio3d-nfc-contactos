import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, Building2, Check, CheckCircle2, Clipboard, Copy, ExternalLink,
  Globe2, Instagram, LogOut, Mail, MapPin, Nfc, Phone, Plus,
  Save, ShieldCheck, Sparkles, UserRound, XCircle
} from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, detectSessionInUrl: true }
});

const ADMIN_EMAIL = 'granbena@gmail.com';
const WHATSAPP_QUOTE_URL = `https://wa.me/56954056277?text=${encodeURIComponent('Hola, vi el servicio de tarjetas digitales NFC de BenaStudio3D y quisiera recibir información para mi empresa.')}`;
const CONSENT_VERSION = 'v1-2026-09-25';
const STATUS = {
  pending: 'Pendiente', review: 'Revisar', published: 'Publicado',
  nfc_programmed: 'NFC programado', delivered: 'Entregado', disabled: 'Desactivado'
};

const DEFAULT_COMPANY_BRAND = {
  logo_url: '', logo_layout: 'auto', show_brand_text: false,
  primary_color: '#2563EB', header_color: '#0B1628',
  secondary_color: '#60A5FA', button_color: '#2563EB', header_effect: true
};

function emptyCompany() {
  return {
    name: '', slug: '', access_code: '', logo_text: '', tagline: '', address: '',
    website: '', instagram: '', enabled: true, ...DEFAULT_COMPANY_BRAND
  };
}

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function cleanUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function whatsappUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

async function uploadCompanyLogo(file, companySlug) {
  if (!file) return '';
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) throw new Error('El logo debe ser PNG, JPG, WebP o SVG.');
  if (file.size > 2 * 1024 * 1024) throw new Error('El logo no puede superar los 2 MB.');
  const extension = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${slugify(companySlug || 'empresa')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from('nfc-company-logos').upload(path, file, {
    cacheControl: '3600', contentType: file.type, upsert: false
  });
  if (error) throw new Error(`No se pudo subir el logo: ${error.message}`);
  return supabase.storage.from('nfc-company-logos').getPublicUrl(path).data.publicUrl;
}

function WhatsAppIcon({ size = 24, className = '' }) {
  return <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.35 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.91 9.91 0 0 0 12.04 2m5.78 14.02c-.24.68-1.41 1.3-1.97 1.38-.5.08-1.14.11-1.84-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.94-4.38-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.01-2.42c.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.81 1.98.88 2.13.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.12.59.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.45.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.39-.24.65-.14.26.1 1.67.79 1.96.94.29.14.48.22.55.34.07.12.07.7-.17 1.38Z" />
  </svg>;
}

function initials(first = '', last = '') {
  return `${first.trim()[0] || ''}${last.trim()[0] || ''}`.toUpperCase();
}

function Spinner({ label = 'Cargando…' }) {
  return <div className="center-state"><span className="spinner" /><p>{label}</p></div>;
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function Brand({ compact = false }) {
  return <button className={`brand-lockup ${compact ? 'compact' : ''}`} onClick={() => go('/')}>
    <span className="brand-b"><img src="/benastudio3d-b-transparent.png" alt="" /></span>
    <span><strong>BenaStudio3D</strong><small>Contactos NFC</small></span>
  </button>;
}

function Home() {
  const [code, setCode] = useState('');
  usePageTitle('Contactos NFC | BenaStudio3D');
  function enter(e) {
    e.preventDefault();
    if (code.trim()) go(`/empresa/${encodeURIComponent(code.trim().toUpperCase())}`);
  }
  return <main className="home-shell">
    <header className="home-nav"><Brand /></header>
    <section className="home-grid">
      <div className="hero-copy">
        <span className="eyebrow"><Nfc size={16} /> Tarjetas digitales para NFC</span>
        <h1>Tu información profesional, siempre actualizada.</h1>
        <p>Creamos tarjetas digitales NFC para empresas y profesionales. Comparte tus datos, redes y medios de contacto con un solo toque.</p>
        <a className="quote-button" href={WHATSAPP_QUOTE_URL} target="_blank" rel="noreferrer">
          <WhatsAppIcon size={20} /> Cotizar para mi empresa
        </a>
        <form className="code-box" onSubmit={enter}>
          <div className="code-heading"><strong>¿Ya eres cliente?</strong><span>Ingresa el código entregado a tu empresa.</span></div>
          <label htmlFor="company-code">Código de acceso</label>
          <div><input id="company-code" value={code} onChange={e => setCode(e.target.value)} autoCapitalize="characters" /><button>Continuar</button></div>
        </form>
      </div>
      <div className="hero-card-wrap">
        <div className="demo-intro">
          <span className="section-kicker"><Sparkles size={15} /> Así funciona</span>
          <h2>Comparte tus datos con un solo toque.</h2>
          <p>Tus clientes podrán guardar tu contacto, escribirte por WhatsApp, llamarte, enviarte un correo y visitar tus enlaces sin instalar aplicaciones.</p>
          <div className="benefits"><span>Siempre actualizada</span><span>Sin aplicaciones</span><span>Para todo tu equipo</span></div>
        </div>
        <div className="demo-label"><strong>Ejemplo de tarjeta digital</strong><span>Datos ficticios</span></div>
        <div className="card-stage">
          <div className="nfc-orbit"><Nfc size={30} /></div>
          <ContactCard company={{ name: 'Nova Soluciones', logo_text: 'NS', tagline: 'SOLUCIONES PARA EMPRESAS', primary_color: '#2563eb', website: 'https://example.com' }} contact={{ first_name: 'Camila', last_name: 'Torres', role: 'Gerenta comercial', phone: '+56 9 0000 0000', email: 'camila@ejemplo.com', show_call: true, show_whatsapp: true }} preview />
        </div>
      </div>
    </section>
    <section className="process-section">
      <span className="section-kicker"><Nfc size={15} /> Proceso simple</span>
      <h2>De tu marca a una solución NFC en tres pasos.</h2>
      <div className="process-grid">
        <article><span>01</span><h3>Solicita tu cotización</h3><p>Cuéntanos cuántas personas integran tu equipo y qué información necesitas compartir.</p></article>
        <article><span>02</span><h3>Personalizamos las tarjetas</h3><p>Adaptamos el diseño con la identidad de tu empresa y recopilamos los datos autorizados.</p></article>
        <article><span>03</span><h3>Entregamos tus productos NFC listos</h3><p>Programamos cada producto NFC con su tarjeta digital, lista para compartir y actualizar.</p></article>
      </div>
      <a className="quote-button process-cta" href={WHATSAPP_QUOTE_URL} target="_blank" rel="noreferrer"><WhatsAppIcon size={20} /> Quiero cotizar</a>
    </section>
    <footer className="site-footer">
      <span>Diseñado y administrado por BenaStudio3D</span>
      <nav><a href="https://www.instagram.com/benastudio3d/" target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a><a href={WHATSAPP_QUOTE_URL} target="_blank" rel="noreferrer"><WhatsAppIcon size={15} /> WhatsApp</a><button onClick={() => go('/admin')}>Administración</button></nav>
    </footer>
  </main>;
}

function CompanyForm({ code }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', role: '', phone: '', email: '', show_call: true, show_whatsapp: true, consent: false });

  usePageTitle(company ? `Crea tu tarjeta | ${company.name}` : 'Contactos NFC | BenaStudio3D');

  useEffect(() => {
    supabase.from('nfc_companies').select('*').eq('access_code', decodeURIComponent(code).toUpperCase()).eq('enabled', true).maybeSingle()
      .then(({ data }) => { setCompany(data); setLoading(false); });
  }, [code]);

  async function submit(e) {
    e.preventDefault(); setError('');
    if (!form.consent) return setError('Debes aceptar la autorización para enviar la solicitud.');
    const phone = form.phone.trim() || null;
    const email = form.email.trim() || null;
    const { error: insertError } = await supabase.from('nfc_contacts').insert({
      ...form,
      phone,
      email,
      show_call: Boolean(phone && form.show_call),
      show_whatsapp: Boolean(phone && form.show_whatsapp),
      company_id: company.id
    });
    if (insertError) return setError('No pudimos enviar la solicitud. Revisa los datos e inténtalo nuevamente.');
    setSent(true);
  }

  if (loading) return <Spinner />;
  if (!company) return <NotFound title="Código no encontrado" text="Revisa el código entregado por tu empresa o solicítalo nuevamente." />;
  if (sent) return <main className="form-shell"><Brand /><section className="success-card"><CheckCircle2 size={54} /><h1>Solicitud enviada</h1><p>BenaStudio3D revisará tus datos antes de publicar la tarjeta y programar el NFC.</p><button onClick={() => go('/')}>Volver al inicio</button></section></main>;

  const updateRequestUrl = `https://wa.me/56954056277?text=${encodeURIComponent(`Hola, necesito actualizar los datos de mi tarjeta digital NFC.\n\nEmpresa: ${company.name}\nMi nombre completo es:\nEl dato que necesito modificar es:`)}`;

  return <main className="form-shell">
    <header className="form-header"><Brand compact /><button className="text-button" onClick={() => go('/')}><ArrowLeft size={16} /> Salir</button></header>
    <div className="form-layout">
      <section className="form-panel">
        <span className="eyebrow"><Building2 size={16} /> {company.name}</span>
        <h1>Crea tu tarjeta de contacto</h1>
        <p>Completa solamente la información que quieres mostrar públicamente.</p>
        <form onSubmit={submit}>
          <div className="two-cols">
            <Field label="Nombre" value={form.first_name} onChange={v => setForm({ ...form, first_name: v })} required />
            <Field label="Apellidos" value={form.last_name} onChange={v => setForm({ ...form, last_name: v })} required />
          </div>
          <Field label="Cargo" value={form.role} onChange={v => setForm({ ...form, role: v })} placeholder="Ej. Directora Jurídica" required />
          <div className="two-cols">
            <Field label="Teléfono (opcional)" type="tel" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+56 9…" />
            <Field label="Correo (opcional)" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
          </div>
          <ContactPreferences form={form} setForm={setForm} />
          <label className="consent">
            <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} required />
            <span><strong>Autorización obligatoria *</strong>Autorizo a BenaStudio3D y a {company.name} a almacenar y publicar los datos ingresados en mi tarjeta digital de contacto. Podré solicitar su modificación o eliminación.<small>Versión {CONSENT_VERSION}</small></span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={!form.consent}>Enviar para revisión <Check size={18} /></button>
        </form>
        <aside className="update-request-box">
          <strong>¿Ya tienes una tarjeta publicada?</strong>
          <p>Solicita cambios en tu cargo, teléfono, correo u otros datos.</p>
          <a href={updateRequestUrl} target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> Solicitar actualización por WhatsApp</a>
        </aside>
      </section>
      <aside className="preview-panel"><span>Vista previa</span><ContactCard company={company} contact={form} preview /></aside>
    </div>
  </main>;
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', autoComplete }) {
  return <label className="field"><span>{label}{required && ' *'}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} autoComplete={autoComplete} /></label>;
}

function ColorField({ label, value, onChange }) {
  return <label className="field color-field"><span>{label}</span><div><input type="color" value={value} onChange={e => onChange(e.target.value)} /><code>{value.toUpperCase()}</code></div></label>;
}

function BrandHeaderPreview({ company }) {
  const previewCompany = { ...DEFAULT_COMPANY_BRAND, ...company, name: company.name || 'Nombre de la empresa' };
  return <div className="brand-header-preview" style={companyTheme(previewCompany)}>
    <header className={`contact-brand ${previewCompany.header_effect === false ? 'no-effect' : 'has-effect'}`}>
      <CompanyIdentity company={previewCompany} />
    </header>
    <small>Vista previa del encabezado</small>
  </div>;
}

function CompanyBrandFields({ form, setForm, logoFile, setLogoFile }) {
  return <section className="brand-settings">
    <div className="settings-heading"><strong>Identidad de la tarjeta</strong><span>Estos ajustes se aplicarán a todos los integrantes de la empresa.</span></div>
    <label className="field logo-upload"><span>Logotipo de la empresa</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setLogoFile(e.target.files?.[0] || null)} /><small>{logoFile ? logoFile.name : form.logo_url ? 'Logo actual configurado. Elige otro archivo para reemplazarlo.' : 'PNG, JPG, WebP o SVG · máximo 2 MB'}</small></label>
    {form.logo_url && <button className="remove-logo" type="button" onClick={() => { setLogoFile(null); setForm({ ...form, logo_url: '' }); }}>Quitar logo y usar iniciales</button>}
    <div className="two-cols">
      <label className="field"><span>Formato del logo</span><select value={form.logo_layout || 'auto'} onChange={e => setForm({ ...form, logo_layout: e.target.value })}><option value="auto">Automático</option><option value="compact">Compacto / isotipo</option><option value="horizontal">Horizontal</option></select></label>
      <Field label="Iniciales de respaldo" value={form.logo_text || ''} onChange={v => setForm({ ...form, logo_text: v })} placeholder="Ej. SD" />
    </div>
    <label className="setting-check"><input type="checkbox" checked={form.show_brand_text === true} onChange={e => setForm({ ...form, show_brand_text: e.target.checked })} /><span><strong>Mostrar nombre bajo el logo</strong><small>Úsalo cuando el archivo contenga solamente el símbolo de la empresa.</small></span></label>
    <div className="color-grid">
      <ColorField label="Fondo del encabezado" value={form.header_color || DEFAULT_COMPANY_BRAND.header_color} onChange={v => setForm({ ...form, header_color: v })} />
      <ColorField label="Color principal" value={form.primary_color || DEFAULT_COMPANY_BRAND.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
      <ColorField label="Color secundario" value={form.secondary_color || DEFAULT_COMPANY_BRAND.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
      <ColorField label="Botón principal" value={form.button_color || DEFAULT_COMPANY_BRAND.button_color} onChange={v => setForm({ ...form, button_color: v })} />
    </div>
    <label className="setting-check"><input type="checkbox" checked={form.header_effect !== false} onChange={e => setForm({ ...form, header_effect: e.target.checked })} /><span><strong>Iluminación corporativa suave</strong><small>Genera profundidad usando los colores elegidos, sin cargar imágenes de fondo.</small></span></label>
    <BrandHeaderPreview company={form} />
  </section>;
}

function ContactPreferences({ form, setForm }) {
  const disabled = !String(form.phone || '').trim();
  return <fieldset className="contact-preferences">
    <legend>Opciones del teléfono</legend>
    <p>Elige qué botones aparecerán en tu tarjeta.</p>
    <div>
      <label className={disabled ? 'disabled' : ''}>
        <input type="checkbox" checked={Boolean(form.show_whatsapp)} disabled={disabled} onChange={e => setForm({ ...form, show_whatsapp: e.target.checked })} />
        <WhatsAppIcon size={19} />
        <span><strong>WhatsApp</strong><small>Mostrar botón para escribir</small></span>
      </label>
      <label className={disabled ? 'disabled' : ''}>
        <input type="checkbox" checked={form.show_call !== false} disabled={disabled} onChange={e => setForm({ ...form, show_call: e.target.checked })} />
        <Phone size={19} />
        <span><strong>Llamadas</strong><small>Mostrar botón para llamar</small></span>
      </label>
    </div>
  </fieldset>;
}

function PublicContact({ companySlug, contactSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const contactName = data ? `${data.contact.first_name || ''} ${data.contact.last_name || ''}`.trim() : '';
  usePageTitle(data ? `${contactName} | ${data.company.name}` : 'Contactos NFC | BenaStudio3D');
  useEffect(() => {
    (async () => {
      const { data: company } = await supabase.from('nfc_companies').select('*').eq('slug', companySlug).maybeSingle();
      if (!company) return setLoading(false);
      const { data: contact } = await supabase.from('nfc_contacts')
        .select('id,company_id,slug,first_name,last_name,role,phone,email,photo_url,status,published_at,nfc_programmed_at,delivered_at,created_at,updated_at,show_call,show_whatsapp')
        .eq('company_id', company.id).eq('slug', contactSlug).maybeSingle();
      if (contact) setData({ company, contact });
      setLoading(false);
    })();
  }, [companySlug, contactSlug]);
  if (loading) return <Spinner label="Abriendo tarjeta…" />;
  if (!data) return <NotFound title="Tarjeta no disponible" text="La dirección puede estar incorrecta o la tarjeta aún no ha sido publicada." />;
  return <main className="public-shell"><ContactCard {...data} /></main>;
}

function CompanyIdentity({ company }) {
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [company.logo_url]);
  const hasLogo = Boolean(company.logo_url) && !logoFailed;
  const showText = !hasLogo || company.show_brand_text === true;
  const layout = ['auto', 'compact', 'horizontal'].includes(company.logo_layout) ? company.logo_layout : 'auto';
  const brandWords = String(company.name || '').trim().split(/\s+/);
  const splitHorizontalName = layout === 'horizontal' && brandWords.length > 1;
  return <div className={`company-identity logo-${layout} ${hasLogo && showText ? 'with-brand-text' : ''}`}>
    {hasLogo
      ? <img className="company-logo" src={company.logo_url} alt={`Logo de ${company.name}`} onError={() => setLogoFailed(true)} />
      : <div className="company-mark">{company.logo_text || company.name.slice(0, 2).toUpperCase()}</div>}
    {showText && <div className="company-brand-copy">
      <strong>{splitHorizontalName
        ? <>{brandWords.slice(0, -1).join(' ')} <em>{brandWords.at(-1)}</em></>
        : company.name.toUpperCase()}</strong>
      {company.tagline && <small>{company.tagline}</small>}
    </div>}
  </div>;
}

function companyTheme(company) {
  return {
    '--accent': company.primary_color || DEFAULT_COMPANY_BRAND.primary_color,
    '--header': company.header_color || DEFAULT_COMPANY_BRAND.header_color,
    '--secondary': company.secondary_color || DEFAULT_COMPANY_BRAND.secondary_color,
    '--button': company.button_color || company.primary_color || DEFAULT_COMPANY_BRAND.button_color
  };
}

function ContactCard({ company, contact, preview = false }) {
  const name = `${contact.first_name || 'Nombre'} ${contact.last_name || ''}`.trim();
  const showCall = Boolean(contact.phone) && contact.show_call !== false;
  const showWhatsApp = Boolean(contact.phone) && contact.show_whatsapp === true;
  const showEmail = Boolean(contact.email);
  const actionCount = [showWhatsApp, showCall, showEmail].filter(Boolean).length;
  const whatsappHref = whatsappUrl(contact.phone);
  function saveVcard() {
    if (preview) return;
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${contact.last_name};${contact.first_name};;;`, `FN:${name}`, `ORG:${company.name}`, `TITLE:${contact.role}`];
    if (contact.phone && (showCall || showWhatsApp)) lines.push(`TEL;TYPE=CELL:${contact.phone}`);
    if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
    if (company.website) lines.push(`URL:${cleanUrl(company.website)}`);
    if (company.address) lines.push(`ADR;TYPE=WORK:;;${company.address};;;;`);
    lines.push('END:VCARD');
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${slugify(name)}.vcf`; a.click(); URL.revokeObjectURL(url);
  }
  return <article className="contact-card" style={companyTheme(company)}>
    <header className={`contact-brand ${company.header_effect === false ? 'no-effect' : 'has-effect'}`}>
      <CompanyIdentity company={company} />
    </header>
    <section className="contact-profile">
      <h1>{name}</h1><p>{contact.role || 'Cargo profesional'}</p>
    </section>
    <button className="save-contact" onClick={saveVcard} disabled={preview}><Plus size={19} /> Guardar contacto</button>
    {actionCount > 0 && <nav className={`quick-actions actions-${actionCount}`}>
      {showWhatsApp && <a className="whatsapp-action" href={preview ? undefined : whatsappHref} target={preview ? undefined : '_blank'} rel="noreferrer"><WhatsAppIcon size={22} />WhatsApp</a>}
      {showCall && <a href={preview ? undefined : `tel:${contact.phone}`}><Phone size={22} />Llamar</a>}
      {showEmail && <a href={preview ? undefined : `mailto:${contact.email}`}><Mail size={22} />Correo</a>}
    </nav>}
    <div className="contact-details">
      {contact.email && <a href={preview ? undefined : `mailto:${contact.email}`}><Mail size={19} /><span>{contact.email}</span></a>}
      {contact.phone && (showCall || showWhatsApp) && <a href={preview ? undefined : showCall ? `tel:${contact.phone}` : whatsappHref} target={!preview && !showCall ? '_blank' : undefined} rel="noreferrer">{showCall ? <Phone size={19} /> : <WhatsAppIcon size={19} />}<span>{contact.phone}</span></a>}
      {company.address && <a href={preview ? undefined : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`} target="_blank"><MapPin size={19} /><span>{company.address}</span></a>}
      {company.website && <a href={preview ? undefined : cleanUrl(company.website)} target="_blank"><Globe2 size={19} /><span>{company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></a>}
      {company.instagram && <a href={preview ? undefined : cleanUrl(company.instagram)} target="_blank"><Instagram size={19} /><span>Instagram</span></a>}
    </div>
    <footer><span className="creator-b">B</span> Creado por BenaStudio3D</footer>
  </article>;
}

function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  usePageTitle('Administración | BenaStudio3D');
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  if (checking) return <Spinner />;
  if (!session) return <AdminLogin />;
  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) return <NotFound title="Acceso no autorizado" text="Esta cuenta no tiene permisos para administrar las tarjetas." />;
  return <AdminDashboard session={session} />;
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  async function login(e) {
    e.preventDefault(); setMessage('Ingresando…');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? 'Correo o contraseña incorrectos.' : 'Acceso correcto.');
  }
  return <main className="login-shell"><Brand /><section className="login-card"><ShieldCheck size={38} /><h1>Panel de administración</h1><form onSubmit={login} autoComplete="off"><Field label="Correo administrador" type="email" value={email} onChange={setEmail} autoComplete="off" required /><Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="new-password" required /><button className="primary-button">Ingresar</button></form>{message && <p className="login-message">{message}</p>}</section></main>;
}

function AdminDashboard({ session }) {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tab, setTab] = useState('requests');
  const [selected, setSelected] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [notice, setNotice] = useState('');
  const [newCompany, setNewCompany] = useState(emptyCompany);
  const [newLogoFile, setNewLogoFile] = useState(null);

  async function load() {
    const [{ data: cs }, { data: people }] = await Promise.all([
      supabase.from('nfc_companies').select('*').order('created_at'),
      supabase.from('nfc_contacts').select('*').order('created_at', { ascending: false })
    ]);
    setCompanies(cs || []); setContacts(people || []);
  }
  useEffect(() => { load(); }, []);

  async function createCompany(e) {
    e.preventDefault(); setNotice('');
    const companySlug = newCompany.slug || slugify(newCompany.name);
    let logoUrl = newCompany.logo_url || null;
    try {
      if (newLogoFile) logoUrl = await uploadCompanyLogo(newLogoFile, companySlug);
    } catch (uploadError) {
      return setNotice(uploadError.message);
    }
    const payload = { ...newCompany, logo_url: logoUrl, slug: companySlug, access_code: newCompany.access_code.toUpperCase() };
    const { error } = await supabase.from('nfc_companies').insert(payload);
    if (error) return setNotice('No se pudo crear la empresa. Revisa que el código y la dirección sean únicos.');
    setNewCompany(emptyCompany()); setNewLogoFile(null);
    setNotice('Empresa creada correctamente.'); load();
  }

  async function quickStatus(contact, status) {
    const payload = { status, updated_at: new Date().toISOString() };
    if (status === 'published') { payload.slug = contact.slug || slugify(`${contact.first_name}-${contact.last_name}`); payload.published_at = contact.published_at || new Date().toISOString(); }
    if (status === 'nfc_programmed') payload.nfc_programmed_at = new Date().toISOString();
    if (status === 'delivered') payload.delivered_at = new Date().toISOString();
    const { error } = await supabase.from('nfc_contacts').update(payload).eq('id', contact.id);
    if (error) setNotice(`No se pudo actualizar: ${error.message}`); else { setNotice('Estado actualizado.'); load(); }
  }

  function companyFor(id) { return companies.find(c => c.id === id); }
  function copy(value) { navigator.clipboard.writeText(value); setNotice('Enlace copiado.'); }
  return <main className="admin-shell">
    <aside className="admin-sidebar"><Brand compact /><nav><button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}><Clipboard size={19} />Solicitudes</button><button className={tab === 'companies' ? 'active' : ''} onClick={() => setTab('companies')}><Building2 size={19} />Empresas</button></nav><button className="logout" onClick={() => supabase.auth.signOut()}><LogOut size={18} />Cerrar sesión</button></aside>
    <section className="admin-main">
      <header><div><span className="eyebrow">Panel privado</span><h1>{tab === 'requests' ? 'Contactos NFC' : 'Empresas'}</h1></div><span className="admin-user">{session.user.email}</span></header>
      {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      {tab === 'requests' ? <>
        <div className="stats"><Stat label="Pendientes" value={contacts.filter(c => c.status === 'pending').length} /><Stat label="Publicados" value={contacts.filter(c => ['published','nfc_programmed','delivered'].includes(c.status)).length} /><Stat label="Entregados" value={contacts.filter(c => c.status === 'delivered').length} /></div>
        <div className="admin-list">{contacts.length === 0 ? <p className="empty">Aún no hay solicitudes.</p> : contacts.map(contact => {
          const company = companyFor(contact.company_id); const publicUrl = contact.slug ? `${window.location.origin}/contacto/${company?.slug}/${contact.slug}` : '';
          return <article className="request-card" key={contact.id}><div className="request-avatar">{initials(contact.first_name, contact.last_name)}</div><div className="request-info"><strong>{contact.first_name} {contact.last_name}</strong><span>{contact.role} · {company?.name}</span><small>{[contact.email, contact.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</small></div><span className={`status status-${contact.status}`}>{STATUS[contact.status]}</span><div className="request-actions"><button onClick={() => setSelected({ ...contact })}>Revisar</button>{contact.status === 'pending' && <button className="accent-action" onClick={() => quickStatus(contact, 'published')}>Publicar</button>}{publicUrl && <button title="Copiar URL" onClick={() => copy(publicUrl)}><Copy size={17} /></button>}{contact.status === 'published' && <button onClick={() => quickStatus(contact, 'nfc_programmed')}>NFC listo</button>}{contact.status === 'nfc_programmed' && <button onClick={() => quickStatus(contact, 'delivered')}>Entregado</button>}</div></article>;
        })}</div>
      </> : <div className="companies-layout">
        <section><h2>Empresas activas</h2>{companies.map(c => <article className="company-row" key={c.id}>
          <span className="company-mini" style={{ background: c.header_color || c.primary_color }}>{c.logo_url ? <img src={c.logo_url} alt="" /> : (c.logo_text || c.name.slice(0,2))}</span>
          <div><strong>{c.name}</strong><small>Código: {c.access_code}</small></div>
          <div className="company-actions"><button onClick={() => setSelectedCompany({ ...c })}>Configurar</button><button onClick={() => copy(`${window.location.origin}/empresa/${c.access_code}`)}><Copy size={16} /> Copiar formulario</button></div>
        </article>)}</section>
        <section className="new-company"><h2>Nueva empresa</h2><form onSubmit={createCompany}>
          <Field label="Nombre" value={newCompany.name} onChange={v => setNewCompany({ ...newCompany, name: v })} required />
          <div className="two-cols"><Field label="Código de acceso" value={newCompany.access_code} onChange={v => setNewCompany({ ...newCompany, access_code: v })} required /><Field label="Dirección web de la empresa" value={newCompany.slug} onChange={v => setNewCompany({ ...newCompany, slug: slugify(v) })} placeholder="Se genera automáticamente" /></div>
          <Field label="Bajada de marca" value={newCompany.tagline} onChange={v => setNewCompany({ ...newCompany, tagline: v })} />
          <Field label="Dirección" value={newCompany.address} onChange={v => setNewCompany({ ...newCompany, address: v })} />
          <Field label="Sitio web" value={newCompany.website} onChange={v => setNewCompany({ ...newCompany, website: v })} />
          <Field label="Instagram" value={newCompany.instagram} onChange={v => setNewCompany({ ...newCompany, instagram: v })} />
          <CompanyBrandFields form={newCompany} setForm={setNewCompany} logoFile={newLogoFile} setLogoFile={setNewLogoFile} />
          <button className="primary-button"><Plus size={18} />Crear empresa</button>
        </form></section>
      </div>}
    </section>
    {selected && <EditContact contact={selected} company={companyFor(selected.company_id)} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); setNotice('Contacto actualizado.'); }} />}
    {selectedCompany && <EditCompany company={selectedCompany} onClose={() => setSelectedCompany(null)} onSaved={() => { setSelectedCompany(null); load(); setNotice('Configuración de empresa actualizada.'); }} />}
  </main>;
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }

function EditCompany({ company, onClose, onSaved }) {
  const [form, setForm] = useState({ ...DEFAULT_COMPANY_BRAND, ...company });
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function save(e) {
    e.preventDefault(); setError(''); setSaving(true);
    let logoUrl = form.logo_url || null;
    try {
      if (logoFile) logoUrl = await uploadCompanyLogo(logoFile, form.slug || form.name);
    } catch (uploadError) {
      setSaving(false); return setError(uploadError.message);
    }
    const payload = {
      name: String(form.name || '').trim(), slug: slugify(form.slug || form.name), access_code: String(form.access_code || '').trim().toUpperCase(),
      logo_text: String(form.logo_text || '').trim() || null, logo_url: logoUrl, logo_layout: form.logo_layout,
      show_brand_text: form.show_brand_text === true, tagline: String(form.tagline || '').trim() || null,
      address: String(form.address || '').trim() || null, website: String(form.website || '').trim() || null, instagram: String(form.instagram || '').trim() || null,
      primary_color: form.primary_color, header_color: form.header_color, secondary_color: form.secondary_color,
      button_color: form.button_color, header_effect: form.header_effect !== false, enabled: form.enabled !== false,
      updated_at: new Date().toISOString()
    };
    const { error: updateError } = await supabase.from('nfc_companies').update(payload).eq('id', company.id);
    setSaving(false);
    if (updateError) setError(`No se pudo guardar: ${updateError.message}`); else onSaved();
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal company-modal" onMouseDown={e => e.stopPropagation()}>
    <header><div><span>Configuración corporativa</span><h2>{company.name}</h2></div><button onClick={onClose}>×</button></header>
    <form onSubmit={save}>
      <div className="company-editor-grid"><div>
        <Field label="Nombre" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
        <div className="two-cols"><Field label="Código de acceso" value={form.access_code} onChange={v => setForm({ ...form, access_code: v })} required /><Field label="Dirección web de la empresa" value={form.slug} onChange={v => setForm({ ...form, slug: slugify(v) })} required /></div>
        <Field label="Bajada de marca" value={form.tagline || ''} onChange={v => setForm({ ...form, tagline: v })} />
        <Field label="Dirección" value={form.address || ''} onChange={v => setForm({ ...form, address: v })} />
        <Field label="Sitio web" value={form.website || ''} onChange={v => setForm({ ...form, website: v })} />
        <Field label="Instagram" value={form.instagram || ''} onChange={v => setForm({ ...form, instagram: v })} />
        <label className="setting-check"><input type="checkbox" checked={form.enabled !== false} onChange={e => setForm({ ...form, enabled: e.target.checked })} /><span><strong>Empresa activa</strong><small>Permite nuevos formularios y mantiene visibles las tarjetas publicadas.</small></span></label>
      </div><CompanyBrandFields form={form} setForm={setForm} logoFile={logoFile} setLogoFile={setLogoFile} /></div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}><Save size={17} />{saving ? 'Guardando…' : 'Guardar configuración'}</button></div>
    </form>
  </section></div>;
}

function EditContact({ contact, company, onClose, onSaved }) {
  const [form, setForm] = useState(contact);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    const phone = String(form.phone || '').trim() || null;
    const payload = { first_name: form.first_name, last_name: form.last_name, role: form.role, phone, email: String(form.email || '').trim() || null, show_call: Boolean(phone && form.show_call), show_whatsapp: Boolean(phone && form.show_whatsapp), photo_url: form.photo_url || null, slug: form.slug || null, status: form.status, updated_at: new Date().toISOString() };
    if (['published','nfc_programmed','delivered'].includes(payload.status) && !payload.slug) payload.slug = slugify(`${payload.first_name}-${payload.last_name}`);
    if (payload.status === 'published' && !contact.published_at) payload.published_at = new Date().toISOString();
    const { error: updateError } = await supabase.from('nfc_contacts').update(payload).eq('id', contact.id);
    if (updateError) setError(updateError.message); else onSaved();
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e => e.stopPropagation()}>
    <header><div><span>{company?.name}</span><h2>Revisar contacto</h2></div><button onClick={onClose}>×</button></header>
    {contact.consent && <div className="consent-record"><ShieldCheck size={21} /><span><strong>Autorización registrada</strong><small>Respaldo guardado con la solicitud del {new Date(contact.created_at).toLocaleString('es-CL')}.</small></span></div>}
    <form onSubmit={save}><div className="two-cols"><Field label="Nombre" value={form.first_name} onChange={v => setForm({ ...form, first_name: v })} required /><Field label="Apellidos" value={form.last_name} onChange={v => setForm({ ...form, last_name: v })} required /></div><Field label="Cargo" value={form.role} onChange={v => setForm({ ...form, role: v })} required /><div className="two-cols"><Field label="Teléfono (opcional)" value={form.phone || ''} onChange={v => setForm({ ...form, phone: v })} /><Field label="Correo (opcional)" type="email" value={form.email || ''} onChange={v => setForm({ ...form, email: v })} /></div><ContactPreferences form={form} setForm={setForm} /><Field label="Dirección de la tarjeta" value={form.slug || ''} onChange={v => setForm({ ...form, slug: slugify(v) })} placeholder="Se genera al publicar" /><label className="field"><span>Estado</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="primary-button"><Save size={17} />Guardar cambios</button></div></form>
  </section></div>;
}

function NotFound({ title, text }) {
  usePageTitle(`${title} | BenaStudio3D`);
  return <main className="not-found"><XCircle size={50} /><h1>{title}</h1><p>{text}</p><button onClick={() => go('/')}>Volver al inicio</button></main>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const onPop = () => setPath(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'empresa' && parts[1]) return <CompanyForm code={parts[1]} />;
  if (parts[0] === 'contacto' && parts[1] && parts[2]) return <PublicContact companySlug={parts[1]} contactSlug={parts[2]} />;
  if (parts[0] === 'admin') return <Admin />;
  return <Home />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
