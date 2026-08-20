/**
 * Minimal, dependency-free port of `content-disposition@3`'s `create()` for
 * an attachment header with a filename — that's the only shape this app
 * needs. Written in-house (not required from the npm package) because that
 * package is ESM-only (`"type": "module"`) as of v3: Node 22+ can
 * `require()` synchronous ESM natively (why this worked in local testing),
 * but Vercel's runtime throws `ERR_REQUIRE_ESM`, which silently broke the
 * entire require chain for every route module mounted after `/documents`
 * (see routes/index.js's module-load-order comment).
 *
 * Logic ported from https://github.com/jshttp/content-disposition (MIT).
 */

const ENCODE_URL_ATTR_CHAR_REGEXP = /[\x00-\x20"'()*,/:;<=>?@[\\\]{}\x7f]/g; // eslint-disable-line no-control-regex
const NON_ASCII_REGEXP = /[^\x20-\x7e]/g;
const QUOTE_REGEXP = /[\\"]/g;
const INVALID_FILENAME_REGEXP = /%[0-9A-Fa-f]{2}/;
const TEXT_REGEXP = /^[\x20-\x7e\x80-\xff]*$/;
const ASCII_TEXT_REGEXP = /^[\x20-\x7e]*$/;
const TOKEN_REGEXP = /^[!#$%&'*+.0-9A-Z^_`a-z|~-]+$/;

function pencode(char) {
  return '%' + char.charCodeAt(0).toString(16).toUpperCase();
}

function getAscii(val) {
  return val.replace(NON_ASCII_REGEXP, '?');
}

function qstring(str) {
  return '"' + str.replace(QUOTE_REGEXP, '\\$&') + '"';
}

/** RFC 8187 percent-encoding, e.g. "café.pdf" -> "UTF-8''caf%C3%A9.pdf" */
function encodeExtended(str) {
  const encoded = encodeURIComponent(str).replace(ENCODE_URL_ATTR_CHAR_REGEXP, pencode);
  return "UTF-8''" + encoded;
}

function formatParam(param, value) {
  if (TOKEN_REGEXP.test(value)) return '; ' + param + '=' + value;
  if (TEXT_REGEXP.test(value)) return '; ' + param + '=' + qstring(value);
  throw new TypeError('Invalid parameter value: ' + value);
}

/** Builds an `attachment; filename=...` Content-Disposition header value for `filename`. */
function create(filename) {
  let result = 'attachment';
  const useAsciiDirectly = ASCII_TEXT_REGEXP.test(filename) && !INVALID_FILENAME_REGEXP.test(filename);
  if (useAsciiDirectly) {
    result += formatParam('filename', filename);
  } else {
    result += formatParam('filename', getAscii(filename));
    result += formatParam('filename*', encodeExtended(filename));
  }
  return result;
}

module.exports = { create };
