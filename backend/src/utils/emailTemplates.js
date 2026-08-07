/**
 * Table-based, inline-styled HTML shell for outbound email — email clients
 * (Outlook especially) ignore <style> blocks and modern CSS, so everything
 * here is deliberately old-school: tables for layout, inline style
 * attributes, no flexbox/grid. Matches the app's brand green (see
 * frontend/tailwind.config.js's `brand` palette).
 */
const BRAND_DARK = '#166534'; // brand-800
const BRAND = '#15803d'; // brand-700
const BG = '#f4f4f5';
const TEXT = '#27272a';
const MUTED = '#71717a';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a paragraph of plain text as HTML paragraphs, splitting on blank
 * lines the way the existing callers already format their message strings.
 */
function paragraphsHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT};">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`
    )
    .join('');
}

function buttonHtml(label, url) {
  if (!url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td style="border-radius:8px;background:${BRAND};">
          <a href="${url}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * @param {string} title - heading shown at the top of the card
 * @param {string} bodyText - plain-text body (existing callers already build
 *   this); rendered as paragraphs above/below the optional CTA button
 * @param {{ label: string, url: string }} [cta] - optional call-to-action button
 * @param {string} [preheader] - hidden preview text shown in inbox lists
 */
function renderEmail({ title, bodyText, cta, preheader }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};font-family:${FONT};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND_DARK};padding:22px 28px;">
                <span style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">STACconnect</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:${TEXT};">${escapeHtml(title)}</h1>
                ${paragraphsHtml(bodyText)}
                ${cta ? buttonHtml(cta.label, cta.url) : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 26px;border-top:1px solid #e4e4e7;">
                <p style="margin:16px 0 0;font-size:12px;color:${MUTED};">
                  STACconnect — Management System. This is an automated message; please don't reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = { renderEmail };
