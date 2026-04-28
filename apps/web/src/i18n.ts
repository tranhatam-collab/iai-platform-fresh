import { readFileSync } from "node:fs";

export type Locale = "vi" | "en";
export interface LocaleContract {
  defaultLocale: Locale;
  fallbackLocale: Locale;
  supportedLocales: Locale[];
}

type Dictionary = Record<string, string>;

interface SeoEntry {
  canonical: string;
  descriptionEn: string;
  descriptionVi: string;
  role: string;
  schemaType: string;
  surface: string;
  titleEn: string;
  titleVi: string;
}

const dictionaries: Record<Locale, Dictionary> = {
  en: loadDictionary("../../../content/en.json"),
  vi: loadDictionary("../../../content/vi.json")
};

const webSeoEntry = loadSeoEntry("web.iai.one");

export const defaultLocaleContract: LocaleContract = {
  defaultLocale: "en",
  fallbackLocale: "en",
  supportedLocales: ["en", "vi"]
};
export const defaultLocale: Locale = defaultLocaleContract.defaultLocale;
export const supportedLocales: Locale[] = defaultLocaleContract.supportedLocales;

export const localeMeta: Record<Locale, { htmlLang: string }> = {
  en: { htmlLang: "en" },
  vi: { htmlLang: "vi" }
};

export function parseLocale(value: string | null | undefined): Locale | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("vi")) {
    return "vi";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return null;
}

export function resolveLocale(
  url: URL,
  acceptLanguage?: string | null,
  localeContract: LocaleContract = defaultLocaleContract
): Locale {
  const requestedRaw = url.searchParams.get("lang");
  const requested = parseLocale(requestedRaw);
  const detected = detectLocaleFromAcceptLanguage(acceptLanguage, localeContract);

  if (requestedRaw && !requested) {
    return localeContract.fallbackLocale;
  }

  if (requested && localeContract.supportedLocales.includes(requested)) {
    return requested;
  }

  return detected ?? localeContract.defaultLocale;
}

export function t(
  locale: Locale,
  key: string,
  replacements: Record<string, number | string> = {}
): string {
  const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  return Object.entries(replacements).reduce((value, [token, replacement]) => {
    return value.replaceAll(`{{${token}}}`, String(replacement));
  }, template);
}

export function hasTranslationKey(key: string): boolean {
  const normalized = key.trim();
  if (!normalized) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(dictionaries.en, normalized) &&
    Object.prototype.hasOwnProperty.call(dictionaries.vi, normalized)
  );
}

export function buildLocalizedPath(
  path: string,
  locale: Locale,
  localeContract: LocaleContract = defaultLocaleContract
): string {
  const url = new URL(path, webSeoEntry.canonical);
  const normalizedLocale = normalizeToSupportedLocale(locale, localeContract);

  if (normalizedLocale === localeContract.defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", normalizedLocale);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildAbsoluteLocalizedUrl(
  path: string,
  locale: Locale,
  localeContract: LocaleContract = defaultLocaleContract
): string {
  return new URL(buildLocalizedPath(path, locale, localeContract), webSeoEntry.canonical).toString();
}

export function getPageMetadata(
  path: string,
  locale: Locale,
  localeContract: LocaleContract = defaultLocaleContract
) {
  const normalizedLocale = normalizeToSupportedLocale(locale, localeContract);
  const description = normalizedLocale === "vi" ? webSeoEntry.descriptionVi : webSeoEntry.descriptionEn;
  const title = normalizedLocale === "vi" ? webSeoEntry.titleVi : webSeoEntry.titleEn;

  return {
    alternates: {
      en: buildAbsoluteLocalizedUrl(path, "en", localeContract),
      vi: buildAbsoluteLocalizedUrl(path, "vi", localeContract),
      xDefault: buildAbsoluteLocalizedUrl(path, localeContract.defaultLocale, localeContract)
    },
    canonical: buildAbsoluteLocalizedUrl(path, normalizedLocale, localeContract),
    description,
    htmlLang: localeMeta[normalizedLocale].htmlLang,
    socialImage: buildSurfaceSocialImageUrl({
      description,
      locale: normalizedLocale,
      surface: "web.iai.one",
      title
    }),
    schemaType: webSeoEntry.schemaType,
    title
  };
}

function detectLocaleFromAcceptLanguage(
  value: string | null | undefined,
  localeContract: LocaleContract
): Locale | null {
  if (!value) {
    return null;
  }

  const parts = value.split(",");
  for (const part of parts) {
    const detected = parseLocale(part);
    if (detected && localeContract.supportedLocales.includes(detected)) {
      return detected;
    }
  }

  return null;
}

function normalizeToSupportedLocale(
  locale: Locale,
  localeContract: LocaleContract
): Locale {
  if (localeContract.supportedLocales.includes(locale)) {
    return locale;
  }

  return localeContract.fallbackLocale;
}

export function normalizeLocaleContract(
  contract:
    | Partial<LocaleContract>
    | {
        defaultLocale?: string;
        fallbackLocale?: string;
        supportedLocales?: string[];
      }
): LocaleContract {
  const parsedDefault = parseLocale(contract.defaultLocale);
  const parsedFallback = parseLocale(contract.fallbackLocale);
  const parsedSupported = (contract.supportedLocales ?? [])
    .map((locale) => parseLocale(locale))
    .filter((locale): locale is Locale => Boolean(locale));

  const supported = parsedSupported.length > 0
    ? Array.from(new Set(parsedSupported))
    : [...defaultLocaleContract.supportedLocales];
  const defaultLocale = parsedDefault && supported.includes(parsedDefault)
    ? parsedDefault
    : defaultLocaleContract.defaultLocale;
  const fallbackLocale = parsedFallback && supported.includes(parsedFallback)
    ? parsedFallback
    : defaultLocaleContract.fallbackLocale;

  return {
    defaultLocale,
    fallbackLocale,
    supportedLocales: supported
  };
}

export function localeContractFromPayload(payload: {
  defaultLocale?: string;
  fallbackLocale?: string;
  supportedLocales?: string[];
}): LocaleContract {
  return normalizeLocaleContract(payload);
}

function loadDictionary(relativePath: string): Dictionary {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  return JSON.parse(source) as Dictionary;
}

function loadSeoEntry(surface: string): SeoEntry {
  const source = readFileSync(new URL("../../../content/seo-registry.csv", import.meta.url), "utf8")
    .trim()
    .split(/\r?\n/);
  const row = source.find((line) => line.startsWith(`${surface},`));

  if (!row) {
    throw new Error(`Missing SEO registry row for ${surface}.`);
  }

  const parts = row.split(",");
  if (parts.length < 8) {
    throw new Error(`Unexpected SEO registry format for ${surface}.`);
  }

  const middle = parts.slice(3, -2);
  const titleViIndex = middle.findIndex((part) => part.trim().startsWith("IAI "));

  if (titleViIndex === -1) {
    throw new Error(`Unable to resolve title_vi column for ${surface}.`);
  }

  const entrySurface = parts[0];
  const role = parts[1];
  const titleEn = parts[2];
  const descriptionEn = middle.slice(0, titleViIndex).join(",").trim();
  const titleVi = middle[titleViIndex]?.trim() ?? "";
  const descriptionVi = middle.slice(titleViIndex + 1).join(",").trim();
  const schemaType = parts.at(-2);
  const canonical = parts.at(-1);

  return {
    canonical: canonical ?? "",
    descriptionEn: descriptionEn ?? "",
    descriptionVi: descriptionVi ?? "",
    role: role ?? "",
    schemaType: schemaType ?? "",
    surface: entrySurface ?? "",
    titleEn: titleEn ?? "",
    titleVi: titleVi ?? ""
  };
}

function buildSurfaceSocialImageUrl(payload: {
  description: string;
  locale: Locale;
  surface: string;
  title: string;
}): string {
  const url = new URL("https://iai.one/og.svg");
  url.searchParams.set("surface", payload.surface);
  url.searchParams.set("lang", payload.locale);
  url.searchParams.set("title", truncateForSocialImage(payload.title, 110));
  url.searchParams.set("description", truncateForSocialImage(payload.description, 180));
  return url.toString();
}

function truncateForSocialImage(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}
