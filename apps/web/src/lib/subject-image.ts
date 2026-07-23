/**
 * Subject Illustration Resolver
 *
 * Resolves the illustration for a subject by its master code or display name.
 * Images live in the shared assets folder (`apps/assets/images/subjects`) and are
 * named by the subject master code (e.g. ENG.png, MATH.png, LAB.png).
 *
 * Returns `null` when no illustration exists so callers can fall back to an icon.
 */

// Eagerly bundle every subject illustration, keyed by its file path.
const subjectImages = import.meta.glob('../../../assets/images/subjects/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// Map uppercased subject code -> bundled image url (e.g. "ENG" -> "/assets/ENG-xyz.png").
const IMAGE_BY_CODE: Record<string, string> = {};
for (const [filePath, url] of Object.entries(subjectImages)) {
  const fileName = filePath.split('/').pop() ?? '';
  const code = fileName.replace(/\.png$/i, '').toUpperCase();
  IMAGE_BY_CODE[code] = url;
}

// Ordered name keywords -> subject code. First match wins.
const KEYWORD_TO_CODE: ReadonlyArray<readonly [string, string]> = [
  ['english', 'ENG'],
  ['math', 'MATH'],
  ['social', 'SST'],
  ['physics', 'PHY'],
  ['chemistry', 'CHEM'],
  ['hindi', 'HIN'],
  ['kannada', 'KAN'],
  ['telugu', 'TEL'],
  ['tamil', 'TAM'],
  ['library', 'LIB'],
];

// Two generic lab illustrations exist; spread subjects across them deterministically.
function pickLabImage(name: string): string | null {
  const primary = IMAGE_BY_CODE.LAB ?? null;
  const alternate = IMAGE_BY_CODE.LAB_2 ?? null;
  if (!primary) {
    return alternate;
  }
  if (!alternate) {
    return primary;
  }
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) {
    sum += name.charCodeAt(i);
  }
  return sum % 2 === 0 ? primary : alternate;
}

/**
 * Get the illustration url for a subject.
 * Prefers an explicit master code, then falls back to matching the display name.
 */
export function getSubjectImageUrl(name?: string | null, code?: string | null): string | null {
  if (code) {
    const byCode = IMAGE_BY_CODE[code.toUpperCase()];
    if (byCode) {
      return byCode;
    }
  }

  if (!name) {
    return null;
  }

  const normalized = name.toLowerCase().trim();

  // Any lab subject shares the generic lab illustration.
  if (normalized.includes('lab')) {
    return pickLabImage(normalized);
  }

  for (const [keyword, subjectCode] of KEYWORD_TO_CODE) {
    if (normalized.includes(keyword) && IMAGE_BY_CODE[subjectCode]) {
      return IMAGE_BY_CODE[subjectCode];
    }
  }

  // "science" is matched last and skips subjects that only borrow the word.
  if (normalized.includes('science')) {
    if (normalized.includes('computer') || normalized.includes('political')) {
      return null;
    }
    return IMAGE_BY_CODE.SCI ?? null;
  }

  return null;
}
