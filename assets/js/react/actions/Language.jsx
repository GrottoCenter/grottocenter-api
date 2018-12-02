//
//
// A C T I O N S
//
//

export const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const changeLanguage = lang => ({
  type: CHANGE_LANGUAGE,
  lang,
});
