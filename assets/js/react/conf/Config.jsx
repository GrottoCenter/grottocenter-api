import _ from 'underscore.string';
import { isEmpty } from 'lodash';

export const apiVersion = 'v1';

export const LEFT_TO_RIGHT = 'LTR';
export const RIGHT_TO_LEFT = 'RTL';

export const DEFAULT_LANGUAGE = 'fr';

export const FR_GC_BLOG = '/api/rss/FR';
export const EN_GC_BLOG = '/api/rss/EN';

function generateLinks(link, defaultLang) {
  const resultArray = {};
  if (typeof localesList === 'undefined' || isEmpty(localesList)) {
    resultArray[0] = { en: 'English' };
  } else {
    Object.keys(localesList).forEach((value) => {
      resultArray[value] = _.replaceAll(link, '%s', _.capitalize(value));
    });
    resultArray['*'] = _.replaceAll(link, '%s', _.capitalize(defaultLang));
  }
  return resultArray;
}

// ===== Misc links
export const bbsLink = {
  '*': 'https://www.ssslib.ch/bbs/',
};

export const wikicavesLink = {
  '*': 'https://www.wikicaves.org/',
};

export const contributorsLink = {
  '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors',
};

export const facebookLink = {
  '*': 'https://www.facebook.com/GrottoCenter',
};

export const twitterLink = {
  '*': 'https://twitter.com/grottocenter',
};

export const githubLink = {
  '*': 'https://github.com/GrottoCenter',
};

export const licenceLinks = {
  fr: 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
  es: 'https://creativecommons.org/licenses/by-sa/3.0/deed.es_ES',
  ca: 'https://creativecommons.org/licenses/by-sa/3.0/deed.ca',
  de: 'https://creativecommons.org/licenses/by-sa/3.0/deed.de',
  pt: 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt_PT',
  nl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.nl',
  it: 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
  '*': 'https://creativecommons.org/licenses/by-sa/3.0/',
};

export const contactLinks = {
  fr: ' https://fr.wikicaves.org/contact',
  '*': 'https://en.wikicaves.org/contact',
};

export const fseLinks = {
  fr: 'https://eurospeleo.eu/fr/',
  '*': 'https://eurospeleo.eu/en/',
};

export const wikiBatsLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats',
  'en',
);
export const wikiBBSLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bbs',
  'en',
);
export const rssLinks = generateLinks(
  'https://www.grottocenter.org/html/rss_%s.xml',
  'en',
);
export const legalLinks = generateLinks(
  'https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement',
  'en',
);

export const detailPageV2Links = {
  fr: 'https://www.grottocenter.org/html/file_Fr.php?lang=Fr',
  es: 'https://www.grottocenter.org/html/file_Es.php?lang=Es',
  ca: 'https://www.grottocenter.org/html/file_Ca.php?lang=Ca',
  de: 'https://www.grottocenter.org/html/file_De.php?lang=De',
  bg: 'https://www.grottocenter.org/html/file_Bg.php?lang=Bg',
  nl: 'https://www.grottocenter.org/html/file_Nl.php?lang=Nl',
  it: 'https://www.grottocenter.org/html/file_It.php?lang=It',
  '*': 'https://www.grottocenter.org/html/file_En.php?lang=En',
};

export const pftGdLink =
  'https://docs.google.com/document/d/1SccuusPQcxrZJI3nvWcbUc2dgGyKc4ZJXqQzSPeE9Hg/edit?usp=sharing';

export const contributeLinks = {
  fr: 'https://fr.wikicaves.org/contribute-participer',
  '*': 'https://en.wikicaves.org/contribute-participer',
};

export const restApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Representational_state_transfer',
  '*': 'https://en.wikipedia.org/wiki/Representational_state_transfer',
};

export const wikiApiLinks = {
  fr: 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
  '*': 'https://en.wikipedia.org/wiki/Application_programming_interface',
};

// ===== Blogger
export const bloggerLinks = {
  fr: 'https://blog-fr.grottocenter.org/',
  '*': 'https://blog-en.grottocenter.org/',
};

export const bloggerIcons = {
  fr: 'blogger-Fr.svg',
  '*': 'blogger-En.svg',
};

// ===== Paypal
export const paypalId = 'TJEU7C2TZ356Y';
export const paypalLink = 'https://www.paypal.com/cgi-bin/webscr';
export const paypalImgLink =
  'https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif';

// ===== Grottocenter API routes

export const dynamicNumbersUrl = {
  documents: `/api/${apiVersion}/documents/count`,
  entrances: `/api/${apiVersion}/entrances/count`,
  officialPartners: `/api/${apiVersion}/partners/count`,
  organizations: `/api/${apiVersion}/organizations/count`,
  publicEntrances: `/api/${apiVersion}/entrances/publicCount`,
  users: `/api/${apiVersion}/cavers/users/count`,
};

export const fetchConvert = '/api/convert';
export const findRandomEntryUrl = `/api/${apiVersion}/entrances/findRandom`;
export const findForCarouselUrl = `/api/${apiVersion}/partners/findForCarousel`;
export const getMapCavesUrl = `/api/${apiVersion}/geoloc/caves`;
export const getMapCavesCoordinatesUrl = `/api/${apiVersion}/geoloc/cavesCoordinates`;
export const getMapEntrancesUrl = `/api/${apiVersion}/geoloc/entrances`;
export const getMapEntrancesCoordinatesUrl = `/api/${apiVersion}/geoloc/entrancesCoordinates`;
export const getMapGrottosUrl = `/api/${apiVersion}/geoloc/grottos`;
export const getCaversDocumentsUrl = (caverId) =>
  `/api/${apiVersion}/cavers/${caverId}/documents`;
/**
 * @deprecated
 */
export const findMapBoundsUrl = `/api/${apiVersion}/geoloc/TO_REMOVE`;
export const findMassifUrl = `/api/${apiVersion}/massifs/`;
export const findOrganizationUrl = `/api/${apiVersion}/organizations/`;
export const advancedsearchUrl = `/api/${apiVersion}/advanced-search`;
export const quicksearchUrl = `/api/${apiVersion}/search`;
export const subjectsUrl = `/api/${apiVersion}/documents/subjects`;
export const subjectsSearchUrl = `/api/${apiVersion}/documents/subjects/search/logical/or`;
export const getDocumentTypesUrl = `/api/${apiVersion}/documents/types`;
export const getDocuments = `/api/${apiVersion}/documents`;
export const processDocumentIds = `/api/${apiVersion}/documents/validate`;
export const getDocumentDetailsUrl = `/api/${apiVersion}/documents/`;
export const getEntryUrl = `/api/${apiVersion}/entrances/`;
export const getCaveUrl = `/api/${apiVersion}/caves/`;
export const postCaveUrl = `/api/${apiVersion}/caves/`;
export const getLanguagesUrl = `/api/${apiVersion}/languages`;
export const postCaverUrl = `/api/${apiVersion}/cavers`;
export const postDocumentUrl = `/api/${apiVersion}/documents`;
export const postEntryUrl = `/api/${apiVersion}/entrances`;
export const putDocumentUrl = (documentId) =>
  `/api/${apiVersion}/documents/${documentId}`;
export const postOrganizationUrl = `/api/${apiVersion}/organizations`;
export const regionsSearchUrl = `/api/${apiVersion}/regions/search/logical/or`;
export const identifierTypesUrl = `/api/${apiVersion}/documents/identifierTypes`;
export const getAdminsUrl = `/api/${apiVersion}/cavers/admins`;
export const getModeratorsUrl = `/api/${apiVersion}/cavers/moderators`;
export const postCaverGroupsUrl = (userId) =>
  `/api/${apiVersion}/cavers/${userId}/groups`;

// ===== ImportCSV url
export const checkRowsBddUrl = `/api/${apiVersion}/importCsv/checkRows`;
export const importRowsUrl = `/api/${apiVersion}/importCsv/importRows`;

// ===== Auth url
export const loginUrl = `/api/${apiVersion}/login`;
export const logoutUrl = `/api/${apiVersion}/logout`;
export const signUpUrl = `/api/${apiVersion}/signup`;

// ===== Grottocenter Client routes
export const swaggerLinkV1 = '/ui/swagger/1';
export const entryDetailPath = `/api/${apiVersion}/entrances/`;

// ===== Misc config values
export const emailRegexp = /\S+@\S+/; // simple regexp TODO: use another one more robust
export const PASSWORD_MIN_LENGTH = 8;

export const DYNAMIC_NUMBER_RELOAD_INTERVAL = 900000;
export const DYNAMIC_NEWS_RELOAD_INTERVAL = 3600000;

export const breadcrumpKeys = {
  add: 'Add',
  admin: 'Administration',
  api: 'API',
  bbs: 'BBS',
  documents: 'Documents',
  entries: 'Entries',
  faq: 'FAQ',
  'import-csv': 'Import',
  manage: 'Manage',
  map: 'Map',
  massifs: 'Massifs',
  organizations: 'Organizations',
  search: 'Search',
  swagger: 'Browse API',
  users: 'Users',
};

export const defaultCoord = { lat: 0, lng: 0 };
export const defaultZoom = 3;
export const focusZoom = 13;
export const sideMenuWidth = '215px';
export const logoGC = '/images/logo.svg';

export const authTokenName = 'grottocenter_token';
