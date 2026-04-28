import { readFileSync } from "node:fs";

export type Locale = "vi" | "en";

type Dictionary = Record<string, string>;

interface SeoEntry {
  canonical: string;
  descriptionEn: string;
  descriptionVi: string;
  schemaTypes: string[];
  titleEn: string;
  titleVi: string;
}

const dictionaries: Record<Locale, Dictionary> = {
  en: loadDictionary("../../../content/en.json"),
  vi: loadDictionary("../../../content/vi.json")
};

const rootSeoEntry = loadSeoEntry("iai.one");

export const defaultLocale: Locale = "vi";
export const supportedLocales: Locale[] = ["vi", "en"];

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

export function resolveLocale(url: URL, acceptLanguage?: string | null): Locale {
  return (
    parseLocale(url.searchParams.get("lang")) ??
    detectLocaleFromAcceptLanguage(acceptLanguage) ??
    defaultLocale
  );
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

export function buildLocalizedPath(path: string, locale: Locale): string {
  const url = new URL(path, rootSeoEntry.canonical);

  if (locale === defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function localizeExternalUrl(rawUrl: string, locale: Locale): string {
  const url = new URL(rawUrl);

  if (locale === defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  return url.toString();
}

export function getPageMetadata(path: string, locale: Locale, pageTitle?: string) {
  const seoTitle = locale === "vi" ? rootSeoEntry.titleVi : rootSeoEntry.titleEn;
  const description = locale === "vi" ? rootSeoEntry.descriptionVi : rootSeoEntry.descriptionEn;
  const title = path === "/" && !pageTitle ? seoTitle : `${pageTitle ?? seoTitle} | ${seoTitle}`;
  return {
    alternates: {
      en: new URL(buildLocalizedPath(path, "en"), rootSeoEntry.canonical).toString(),
      vi: new URL(buildLocalizedPath(path, "vi"), rootSeoEntry.canonical).toString(),
      xDefault: new URL(buildLocalizedPath(path, defaultLocale), rootSeoEntry.canonical).toString()
    },
    canonical: new URL(buildLocalizedPath(path, locale), rootSeoEntry.canonical).toString(),
    description,
    htmlLang: localeMeta[locale].htmlLang,
    socialImage: buildSurfaceSocialImageUrl({
      description,
      locale,
      surface: "iai.one",
      title
    }),
    schemaTypes: rootSeoEntry.schemaTypes,
    title
  };
}

function detectLocaleFromAcceptLanguage(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  for (const part of value.split(",")) {
    const detected = parseLocale(part);
    if (detected) {
      return detected;
    }
  }

  return null;
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

  return {
    canonical: parts.at(-1) ?? "",
    descriptionEn: middle.slice(0, titleViIndex).join(",").trim(),
    descriptionVi: middle.slice(titleViIndex + 1).join(",").trim(),
    schemaTypes: (parts.at(-2) ?? "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean),
    titleEn: parts[2] ?? "",
    titleVi: middle[titleViIndex]?.trim() ?? ""
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
