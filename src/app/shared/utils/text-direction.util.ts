export function detectTextDir(text: string | null | undefined): 'rtl' | 'ltr' {
  if (!text) return 'ltr';
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicPattern.test(text) ? 'rtl' : 'ltr';
}
