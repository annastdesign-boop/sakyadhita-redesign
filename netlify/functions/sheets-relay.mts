import type { Context } from '@netlify/functions'

/**
 * Relay: Netlify form-submission webhooks → Google Apps Script → Google Sheet.
 *
 * Netlify's webhook delivery treats the Apps Script 302-redirect response as
 * a failure, which causes retries (duplicate rows) and eventually auto-disables
 * the hook. This function answers Netlify with a clean 200 immediately and
 * forwards the payload to Apps Script itself, following redirects.
 *
 * The Apps Script web app URL lives in the SHEETS_WEBAPP_URL env var.
 */
export default async (req: Request, _context: Context) => {
  const url = Netlify.env.get('SHEETS_WEBAPP_URL')
  if (!url) {
    console.error('SHEETS_WEBAPP_URL is not set')
    return new Response('not configured', { status: 200 })
  }
  try {
    const body = await req.text()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      redirect: 'follow',
    })
    console.log('forwarded to sheets, status:', res.status)
  } catch (err) {
    // Never propagate errors to Netlify — a non-2xx here would trigger
    // retries and eventually disable the hook. The Apps Script side
    // deduplicates by submission id anyway.
    console.error('relay error:', err)
  }
  return new Response('ok', { status: 200 })
}
