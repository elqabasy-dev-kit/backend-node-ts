/**
 * @file src/utils/i18n.ts
 * @description Internationalization utilities i18n for api transations
 *              This file contains also codes that will be returned with the responses, so forntend can use them easily.
 * @author Mahros ALQabasy <mahros.dev>
 */


const CODE_KEYS = {
  rateLimit: {
    tooManyRequests: "rateLimit.tooManyRequests",
  },
  auth: {
    invalidCredentials: "auth.invalidCredentials",
    invalidToken: "auth.invalidToken",

  },
  users: {
    notFound: "users.notFound",
  },
  profile: {
    notFound: "profile.notFound",
  },

};


const Locale = {
  ENGLISH: "en",
  ARABIC: "ar",
} as const;

type Locale = typeof Locale[keyof typeof Locale];

const TRANSLATION_MAPPING: Record<Locale, Partial<Record<string, string>>> = {
  en: {
    [CODE_KEYS.rateLimit.tooManyRequests]: "Too many requests, please try again later.",
    [CODE_KEYS.auth.invalidCredentials]: "Invalid credentials, please check your email and password.",
    [CODE_KEYS.auth.invalidToken]: "Invalid token, please log in again.",
    [CODE_KEYS.users.notFound]: "User not found.",
    [CODE_KEYS.profile.notFound]: "Profile not found.",
  },
  ar: {
    [CODE_KEYS.rateLimit.tooManyRequests]: "عدد كبير من الطلبات، يرجى المحاولة لاحقًا.",
    [CODE_KEYS.auth.invalidCredentials]: "بيانات اعتماد غير صالحة، يرجى التحقق من بريدك الإلكتروني وكلمة المرور.",
    [CODE_KEYS.auth.invalidToken]: "رمز غير صالح، يرجى تسجيل الدخول مرة أخرى.",
    [CODE_KEYS.users.notFound]: "المستخدم غير موجود.",
    [CODE_KEYS.profile.notFound]: "الملف الشخصي غير موجود.",
  },
};


