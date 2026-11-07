/**
 * Returns the `src` of the first `<img>` tag of an HTML fragment, or null
 * when there is none.
 *
 * Used to pick the featured image of a blog post from its body: Blogger
 * embeds the image at its display size (e.g. `/s320/`), larger than the
 * 72x72 crop of the feed's `<media:thumbnail>`.
 *
 * Only absolute http(s) URLs are returned, so a `data:` or `javascript:`
 * source never reaches a client. `&amp;` is decoded, since the value comes
 * from an HTML attribute.
 *
 * @param {*} html
 * @returns {string|null}
 */
const IMG_SRC = /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

const extractFirstImageUrl = (html) => {
  if (typeof html !== 'string') return null;

  const match = IMG_SRC.exec(html);
  if (!match) return null;

  const url = (match[1] ?? match[2]).trim().replace(/&amp;/g, '&');
  return /^https?:\/\//i.test(url) ? url : null;
};

module.exports = extractFirstImageUrl;
