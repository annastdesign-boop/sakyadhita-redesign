/**
 * Shared form behaviour for all Netlify Forms on the site.
 *
 * Gives every form, in plain terms:
 *  - friendly error messages next to the field they belong to
 *    (announced to screen readers via aria-describedby / role=alert)
 *  - email format checking before sending
 *  - a "Sending…" button state that can't be double-clicked
 *  - a clear thank-you panel on success
 *  - a gentle try-again message on failure — typed answers are kept
 *
 * Usage: enhanceForm(document.querySelector('form[name="contact"]'), {
 *   successTitle: 'Message sent',
 *   successText: "Thank you — we'll reply within a week.",
 * })
 */

interface EnhanceOptions {
  successTitle: string
  successText: string
  /** Called after a successful submission (e.g. to reset extra UI) */
  onSuccess?: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fieldWrap(el: Element): HTMLElement {
  return (el.closest('.field') as HTMLElement) ?? (el.parentElement as HTMLElement)
}

function showFieldError(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, msg: string) {
  clearFieldError(input)
  const wrap = fieldWrap(input)
  const id = `err-${input.name || Math.random().toString(36).slice(2)}`
  const err = document.createElement('p')
  err.className = 'field-error'
  err.id = id
  err.setAttribute('role', 'alert')
  err.textContent = msg
  wrap.appendChild(err)
  input.setAttribute('aria-invalid', 'true')
  input.setAttribute('aria-describedby', id)
  input.classList.add('has-error')
}

function clearFieldError(input: Element) {
  const wrap = fieldWrap(input)
  wrap.querySelector('.field-error')?.remove()
  input.removeAttribute('aria-invalid')
  input.removeAttribute('aria-describedby')
  input.classList.remove('has-error')
}

/** Returns true if all required/email fields pass; shows inline errors otherwise. */
export function validateForm(form: HTMLFormElement): boolean {
  let ok = true
  let firstBad: HTMLElement | null = null

  const controls = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input[name], textarea[name], select[name]'
  )
  controls.forEach((input) => {
    if (input.type === 'hidden' || input.name === 'bot-field') return
    clearFieldError(input)

    const value = input.type === 'checkbox' ? ((input as HTMLInputElement).checked ? 'on' : '') : input.value.trim()

    if (input.required && !value) {
      const label = fieldWrap(input).querySelector('label')?.textContent?.replace('*', '').trim() || 'This field'
      showFieldError(input, input.type === 'checkbox' ? 'Please tick this box to continue.' : `${label} is required.`)
      ok = false
      firstBad ??= input
      return
    }
    if (input.type === 'email' && value && !EMAIL_RE.test(value)) {
      showFieldError(input, "That email address doesn't look right — please check it (e.g. name@example.com).")
      ok = false
      firstBad ??= input
    }
  })

  if (firstBad) {
    ;(firstBad as HTMLElement).focus()
    firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return ok
}

export function enhanceForm(form: HTMLFormElement | null, opts: EnhanceOptions) {
  if (!form) return
  let sending = false

  // Clear a field's error as soon as the visitor edits it.
  form.addEventListener('input', (e) => {
    const t = e.target as Element
    if (t.matches('input, textarea, select')) clearFieldError(t)
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (sending) return
    if (!validateForm(form)) return

    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')
    const btnLabel = btn?.innerHTML ?? ''
    sending = true
    if (btn) {
      btn.disabled = true
      btn.innerHTML = 'Sending…'
    }
    form.querySelector('.form-failure')?.remove()

    try {
      const data = new FormData(form)
      const body = new URLSearchParams()
      data.forEach((v, k) => body.append(k, String(v)))

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (!res.ok) throw new Error(`Submission failed (${res.status})`)

      // Success: swap the form for a thank-you panel (typed data no longer needed).
      const panel = document.createElement('div')
      panel.className = 'form-success'
      panel.setAttribute('role', 'status')
      panel.innerHTML = `
        <div class="fs-icon" aria-hidden="true">🪷</div>
        <h3>${opts.successTitle}</h3>
        <p>${opts.successText}</p>`
      form.style.display = 'none'
      form.insertAdjacentElement('afterend', panel)
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' })
      opts.onSuccess?.()
    } catch {
      // Failure: keep everything the visitor typed and show a gentle note.
      const fail = document.createElement('p')
      fail.className = 'form-failure'
      fail.setAttribute('role', 'alert')
      fail.textContent =
        "Sorry — your message couldn't be sent just now (it may be a connection problem). Your answers are still here; please try again in a moment."
      form.appendChild(fail)
    } finally {
      sending = false
      if (btn) {
        btn.disabled = false
        btn.innerHTML = btnLabel
      }
    }
  })
}
