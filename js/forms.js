"use strict";
// Validate separately from delivery; never claim a demo submission was sent.
function localDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function setError(input, message) {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  const error = document.getElementById(input.id + '-error');
  if (error) { error.textContent = message; input.setAttribute('aria-describedby', error.id); }
}
function validateForm(form) {
  let valid = true;
  for (const input of form.querySelectorAll('input,select,textarea')) {
    const value = input.value.trim(); let message = '';
    if (input.required && !value) message = 'Please complete this field.';
    else if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Enter a valid email address.';
    else if (input.type === 'tel' && value && (!/^\+?[0-9 ()-]+$/.test(value) || value.replace(/\D/g, '').length < 7 || value.replace(/\D/g, '').length > 15)) message = 'Enter a phone number with 7–15 digits.';
    else if (input.type === 'number' && (!Number.isInteger(Number(value)) || Number(value) < Number(input.min) || Number(value) > Number(input.max))) message = `Enter a whole number from ${input.min} to ${input.max}.`;
    else if (input.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < localDate())) message = 'Choose today or a future date.';
    setError(input, message); if (message) valid = false;
  }
  if (!valid) form.querySelector('[aria-invalid="true"]').focus();
  return valid;
}
function status(form, text, error = false) {
  const box = form.querySelector('.form-status'); box.textContent = text; box.classList.toggle('error', error);
}
const config = window.WANDERLUX_CONFIG || { mode: 'demo' };
const contact = document.querySelector('#contact-form');
if (contact && config.mode !== 'demo') document.querySelector('#contact-mode').textContent = 'Email delivery is configured. Your enquiry will be sent to our travel team when you submit.';
async function sendEnquiry(data) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response;
    if (config.mode === 'emailjs') {
      const c = config.emailjs;
      if (!c?.publicKey || !c.serviceId || !c.templateId) throw new Error('Email setup is incomplete. Please try again after configuration.');
      response = await fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: c.serviceId, template_id: c.templateId, user_id: c.publicKey, template_params: { from_name: data.name, reply_to: data.email, phone: data.phone, subject: data.subject, message: data.message } }), signal: controller.signal });
      if (!response.ok) throw new Error('Your enquiry could not be sent. Please try again later.');
    } else if (config.mode === 'endpoint') {
      if (!config.endpoint) throw new Error('The email endpoint is not configured.');
      const url = new URL(config.endpoint, location.href);
      if (url.origin !== location.origin && url.protocol !== 'https:') throw new Error('Email endpoint must use HTTPS.');
      response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal });
      if (!response.ok) throw new Error('Your enquiry could not be sent. Please try again later.');
      const body = await response.json(); if (body.sent !== true) throw new Error('Email delivery was not confirmed. Please try again later.');
    } else throw new Error('Unknown email configuration.');
  } finally { clearTimeout(timeout); }
}
const appointment = document.querySelector('#appointment-form');
if (appointment) {
  appointment.elements.date.min = localDate();
  appointment.elements.date.addEventListener('focus', () => { appointment.elements.date.min = localDate(); });
  const query = new URLSearchParams(location.search);
  let destination = query.get('destination');
  destination = ({ 'Swiss Alps': 'Switzerland', Kyoto: 'Japan' })[destination] || destination;
  if (destination && [...appointment.elements.interest.options].some(o => o.value === destination)) appointment.elements.interest.value = destination;
  else if (destination) appointment.elements.interest.value = 'Other';
  if (query.get('service')) appointment.elements.message.value = `I’m interested in ${query.get('service').slice(0, 150)}.`;
}
for (const form of document.querySelectorAll('#appointment-form,#contact-form,#newsletter-form')) {
  form.addEventListener('input', event => { if (event.target.matches('input,textarea,select')) setError(event.target, ''); status(form, ''); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); status(form, ''); if (!validateForm(form)) return;
    const data = Object.fromEntries(new FormData(form));
    if (form.id === 'newsletter-form') { status(form, 'Thank you! Your email format is valid. This is a demonstration; no subscription was created and your email was not saved or sent.'); return; }
    if (form.id === 'appointment-form') { status(form, 'Your appointment details are valid. Demo only: the request was not sent or saved, and no appointment has been booked.'); return; }
    if (config.mode === 'demo') { status(form, 'Your enquiry is valid. Demo mode: no email was sent or saved. Configure EmailJS or a backend endpoint to enable delivery.'); return; }
    const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Sending…'; form.setAttribute('aria-busy', 'true');
    try { await sendEnquiry(data); status(form, 'Your enquiry has been sent successfully. Thank you for getting in touch.'); form.reset(); }
    catch (error) { status(form, error.name === 'AbortError' ? 'The request timed out. Delivery is unconfirmed; please try again later.' : error.message, true); }
    finally { button.disabled = false; button.textContent = 'Send My Enquiry ↗'; form.removeAttribute('aria-busy'); }
  });
}
