/* =====================================================================
   PRODADENT · Envío de los formularios de cita a Google Sheets
   Va en assets/formulario.js y lo usan todas las páginas.
   ===================================================================== */

/* URL de tu Apps Script: debe empezar UNA sola vez con https://script.google.com/macros/s/ y terminar en /exec */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzeNc_dne3JX46kHp_Vm0zl8r_PvHQXoOiBxB73zuFyrLzQcXE_DrXzz_nmlakmrTs/exec';

/* ---------- Mensaje bajo el botón (errores de datos o de envío) ---------- */
function msgCita(form, texto) {
  let m = form.querySelector('.ferr');
  if (!m) {
    m = document.createElement('p');
    m.className = 'ferr';
    m.setAttribute('role', 'alert');
    m.style.cssText = 'color:#f0a493;font-size:.9rem;line-height:1.5;margin-top:-4px';
    form.querySelector('button[type="submit"]').after(m);
  }
  m.textContent = texto || '';
}

/* ---------- Avisa qué dato está mal (corre antes que la validación de la página) ---------- */
document.addEventListener('submit', e => {
  const f = e.target;
  if (!f.classList || !f.classList.contains('fm')) return;
  const nom = f.elements.nombre, mail = f.elements.correo, tel = f.elements.telefono;
  let t = '';
  if (!nom.value.trim()) t = 'Escribe tu nombre completo.';
  else if (!mail.value.trim() || !mail.checkValidity()) t = 'Escribe un correo válido, por ejemplo nombre@gmail.com.';
  else if (tel.value.replace(/\D/g, '').length < 7) t = 'Escribe un número de teléfono válido (mínimo 7 dígitos).';
  msgCita(f, t);
}, true);

/* ---------- Teléfono con el prefijo +593 (Ecuador) ----------
   0991234567 → +593 991234567 · si la persona ya escribió +593 o otro código, se respeta */
function telefonoCompleto(v) {
  const t = String(v).trim(), d = t.replace(/\D/g, '');
  if (t.startsWith('+')) return '+' + d;
  if (d.startsWith('593') && d.length > 10) return '+' + d;
  return '+593 ' + d.replace(/^0+/, '');
}

/* ---------- Página desde donde se envió ---------- */
function paginaOrigen(form) {
  const archivo = decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';
  const pagina  = (archivo === 'index.html' || archivo === '') ? 'Inicio' : (document.title.split('·')[0].trim() || archivo);
  const lugar   = form.closest('#modal') ? 'Ventana emergente' : 'Formulario final';
  return pagina + ' · ' + lugar;
}

/* ---------- Envía la cita. Devuelve true si se guardó ---------- */
async function enviarCita(form) {
  const btn = form.querySelector('button[type="submit"]');
  msgCita(form, '');
  const datos = new URLSearchParams({
    nombre:   form.elements.nombre.value.trim(),
    correo:   form.elements.correo.value.trim(),
    telefono: telefonoCompleto(form.elements.telefono.value),
    servicio: form.elements.servicio.value,
    pagina:   paginaOrigen(form)
  });
  const textoBtn = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enviando…';
  try {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(SHEETS_URL)) throw new Error('La URL de Apps Script en assets/formulario.js no es válida');
    await fetch(SHEETS_URL, { method: 'POST', mode: 'no-cors', body: datos });
    console.log('Cita guardada en Google Sheets ✔', Object.fromEntries(datos));
    return true;
  } catch (err) {
    console.error('Error al enviar la cita:', err);
    msgCita(form, 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp al +593 99292-9009.');
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = textoBtn;
  }
}

/* Al cerrar/reiniciar un formulario se borra el mensaje */
document.addEventListener('reset', e => { if (e.target.querySelector) msgCita(e.target, ''); }, true);