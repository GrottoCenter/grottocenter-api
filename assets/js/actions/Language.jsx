export const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE';

export const changeLanguage = (lang) => {
  return {
    type: CHANGE_LANGUAGE,
    lang: lang
  };
};
