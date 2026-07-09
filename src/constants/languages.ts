interface LanguageMap {
  [key: string]: string;
}

export const languages: LanguageMap = {
  en: 'English',
  es: 'Spanish'
}

export function formatCourseNameWithLanguage(fullCourseName: string, language: string): string {
  if (language === "en" || !languages[language]) {
    return fullCourseName
  }

  return `${fullCourseName} (${languages[language]})`
}
