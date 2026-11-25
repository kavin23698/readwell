// Reads title, author and cover from an EPUB (a zip with an OPF package file), and detects DRM.
import JSZip from 'jszip';

export type EpubMeta = { title?: string; author?: string; cover?: { bytes: Uint8Array; ext: string } };

export class DrmError extends Error {}
export class CorruptError extends Error {}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

function tagText(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<(?:[a-z]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'i'));
  return m ? decode(m[1].replace(/<[^>]+>/g, '')) || undefined : undefined;
}

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
}

function resolve(base: string, href: string): string {
  const parts = (base ? base.split('/') : []).concat(decodeURIComponent(href).split('/'));
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

/** Font obfuscation (IDPF / Adobe) is allowed; any other encrypted resource means DRM. */
function isDrm(encryptionXml: string | null, hasRights: boolean): boolean {
  if (hasRights) return true;
  if (!encryptionXml) return false;
  const algos = [...encryptionXml.matchAll(/EncryptionMethod[^>]*Algorithm\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  if (!algos.length) return /EncryptedData/i.test(encryptionXml);
  return algos.some((a) => !/idpf\.org\/2008\/embedding|ns\.adobe\.com\/pdf\/enc#RC/i.test(a));
}

export async function readEpubMeta(bytes: Uint8Array): Promise<EpubMeta> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new CorruptError('not a zip');
  }
  const encryption = (await zip.file('META-INF/encryption.xml')?.async('string')) ?? null;
  if (isDrm(encryption, !!zip.file('META-INF/rights.xml'))) throw new DrmError('drm');

  const container = await zip.file('META-INF/container.xml')?.async('string');
  const opfPath = container?.match(/full-path\s*=\s*["']([^"']+)["']/i)?.[1];
  const opf = opfPath ? await zip.file(opfPath)?.async('string') : undefined;
  if (!opf || !opfPath) throw new CorruptError('no package file');
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';

  const meta: EpubMeta = { title: tagText(opf, 'title'), author: tagText(opf, 'creator') };

  // Cover: EPUB 3 properties="cover-image", else EPUB 2 <meta name="cover" content="id">.
  const items = [...opf.matchAll(/<(?:[a-z]+:)?item\b[^>]*>/gi)].map((m) => m[0]);
  let coverItem = items.find((t) => /properties\s*=\s*["'][^"']*cover-image/i.test(t));
  if (!coverItem) {
    const coverId = opf.match(/<(?:[a-z]+:)?meta\b[^>]*name\s*=\s*["']cover["'][^>]*>/i)?.[0];
    const id = coverId ? attr(coverId, 'content') : undefined;
    if (id) coverItem = items.find((t) => attr(t, 'id') === id);
  }
  if (!coverItem) coverItem = items.find((t) => /media-type\s*=\s*["']image\//i.test(t) && /cover/i.test(attr(t, 'href') ?? ''));
  const href = coverItem ? attr(coverItem, 'href') : undefined;
  if (href) {
    const file = zip.file(resolve(base, href));
    const type = attr(coverItem!, 'media-type') ?? '';
    if (file && type.startsWith('image/')) {
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
      meta.cover = { bytes: await file.async('uint8array'), ext };
    }
  }
  return meta;
}
