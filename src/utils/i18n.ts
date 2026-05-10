import { Request } from "express";
import { ErrorCode } from "../types/error.type";

export type Locale = "en" | "ar";

const DEFAULT_LOCALE: Locale = "ar";
const SUPPORTED_LOCALES: Locale[] = ["en", "ar"];

const ERROR_TRANSLATIONS: Record<Locale, Partial<Record<ErrorCode, string>>> = {
  en: {},
  ar: {
    [ErrorCode.VALIDATION_ERROR]: "البيانات اللي بعتهالي مش مظبوطة",
    [ErrorCode.NOT_IMPLEMENTED]: "الصفحة دي لسه ما اتعملتش",
    [ErrorCode.NOT_FOUND]: "المورد مش موجود",
    [ErrorCode.UNAUTHORIZED]: "لازم تسجل دخول الأول",
    [ErrorCode.FORBIDDEN]: "مش مسموح",
    [ErrorCode.CONFLICT]: "في تعارض في البيانات",
    [ErrorCode.INTERNAL_ERROR]: "فيه مشكلة في السيرفر",
    [ErrorCode.MISSING_API_KEY]: "مفتاح الـ API ناقص",
    [ErrorCode.FILE_TOO_LARGE]: "الملف كبير زيادة عن اللزوم",
    [ErrorCode.INVALID_FILE_TYPE]: "نوع الملف مش مسموح",
    [ErrorCode.RATE_LIMIT_EXCEEDED]:
      "طلبات كتير جدًا في وقت قصير. حاول تاني بعد شوية",
    [ErrorCode.STORAGE_ERROR]: "حصلت مشكلة في حفظ الملفات",
    [ErrorCode.ATTACHMENT_NOT_FOUND]: "المرفق مش موجود",
    [ErrorCode.MAX_TRANSACTION_ATTACHMENTS_EXCEEDED]:
      "وصلت للحد الأقصى من الملفات المرفوعة",
    [ErrorCode.PROFILE_IMAGE_NOT_FOUND]: "صورة الملف الشخصي غير موجودة",
  },
};

const EXACT_MESSAGE_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {},
  ar: {
    Unauthorized: "لازم تسجل دخول الأول",
    Forbidden: "مش مسموح",
  },
};

const translateDynamicValidation = (
  message: string,
  locale: Locale,
): string | null => {
  if (locale === "en") {
    return null;
  }

  const requiredMatch = message.match(/^(.+) is required$/);
  if (requiredMatch) {
    return `${requiredMatch[1]} مطلوب`;
  }

  const tooShortMatch = message.match(/^(.+) is too short$/);
  if (tooShortMatch) {
    return `${tooShortMatch[1]} قصير شوية`;
  }

  const tooLongMatch = message.match(/^(.+) is too long$/);
  if (tooLongMatch) {
    return `${tooLongMatch[1]} طويل شوية`;
  }

  const fileSizeMatch = message.match(/^Each file must be (\d+)MB or smaller$/);
  if (fileSizeMatch) {
    return `كل ملف لازم يكون ${fileSizeMatch[1]}MB أو أقل`;
  }

  const maxFilesMatch = message.match(
    /^Too many files uploaded\. Maximum is (\d+)\.$/,
  );
  if (maxFilesMatch) {
    return `الحد الأقصى ${maxFilesMatch[1]} ملفات`;
  }

  return null;
};

export const resolveLocale = (req: Pick<Request, "headers">): Locale => {
  const acceptLanguage = req.headers["accept-language"];
  const explicitLocale = req.headers["x-lang"] ?? req.headers["x-locale"];
  const rawAcceptLanguage = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  const rawHeader = Array.isArray(explicitLocale)
    ? explicitLocale[0]
    : explicitLocale;
  const rawValue = rawAcceptLanguage ?? rawHeader;

  if (!rawValue) {
    return DEFAULT_LOCALE;
  }

  const normalized = (
    String(rawValue).toLowerCase().split(",")[0] ?? ""
  ).trim();
  const primary = normalized.split("-")[0] as Locale;

  return SUPPORTED_LOCALES.includes(primary) ? primary : DEFAULT_LOCALE;
};

export const translateApiMessage = (input: {
  locale: Locale;
  code?: ErrorCode;
  message: string;
}): string => {
  const { locale, code, message } = input;

  if (locale === "en") {
    return message;
  }

  if (code) {
    const translatedByCode = ERROR_TRANSLATIONS[locale][code];
    if (translatedByCode) {
      return translatedByCode;
    }
  }

  const exactTranslation = EXACT_MESSAGE_TRANSLATIONS[locale][message];
  if (exactTranslation) {
    return exactTranslation;
  }

  const dynamicTranslation = translateDynamicValidation(message, locale);
  if (dynamicTranslation) {
    return dynamicTranslation;
  }

  return message;
};
