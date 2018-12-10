import _ from 'underscore.string';

export const
  LEFT_TO_RIGHT = 'LTR';


export const RIGHT_TO_LEFT = 'RTL';

export const
  DEFAULT_LANGUAGE = 'fr';


export const FR_GC_BLOG = '/api/rss/FR';


export const EN_GC_BLOG = '/api/rss/EN';

function generateLinks(link, defaultLang) {
  const resultArray = {};
  Object.keys(localesList).forEach(function(el) { // eslint-disable-line
    resultArray[el.value] = _.replaceAll(link, '%s', _.capitalize(el.value));
  });
  resultArray['*'] = _.replaceAll(link, '%s', _.capitalize(defaultLang));
  return resultArray;
}

export const
  wikicavesLink = {
    '*': 'http://www.wikicaves.org/',
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


export const bloggerLinks = {
  fr: 'http://blog-fr.grottocenter.org/',
  '*': 'http://blog-en.grottocenter.org/',
};


export const bloggerIcons = {
  fr: 'blogger-Fr.svg',
  '*': 'blogger-En.svg',
};


export const contactLinks = {
  fr: ' http://fr.wikicaves.org/contact',
  '*': 'http://en.wikicaves.org/contact',
};


export const fseLinks = {
  fr: 'http://eurospeleo.eu/fr/',
  '*': 'http://eurospeleo.eu/en/',
};


export const wikiBatsLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats', 'en');


export const rssLinks = generateLinks('http://www.grottocenter.org/html/rss_%s.xml', 'en');


export const legalLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement', 'en');

export const
  paypalLink = 'https://www.paypal.com/cgi-bin/webscr';


export const paypalImgLink = 'https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif';


export const paypalId = 'TJEU7C2TZ356Y';

export const
  detailPageV2Links = {
    fr: 'http://www.grottocenter.org/html/file_Fr.php?lang=Fr',
    es: 'http://www.grottocenter.org/html/file_Es.php?lang=Es',
    ca: 'http://www.grottocenter.org/html/file_Ca.php?lang=Ca',
    de: 'http://www.grottocenter.org/html/file_De.php?lang=De',
    bg: 'http://www.grottocenter.org/html/file_Bg.php?lang=Bg',
    nl: 'http://www.grottocenter.org/html/file_Nl.php?lang=Nl',
    it: 'http://www.grottocenter.org/html/file_It.php?lang=It',
    '*': 'http://www.grottocenter.org/html/file_En.php?lang=En',
  };

export const
  pftGdLink = 'https://docs.google.com/document/d/1SccuusPQcxrZJI3nvWcbUc2dgGyKc4ZJXqQzSPeE9Hg/edit?usp=sharing';

export const
  contributeLinks = {
    fr: 'http://fr.wikicaves.org/contribute-participer',
    '*': 'http://en.wikicaves.org/contribute-participer',
  };

export const
  restApiLinks = {
    fr: 'https://fr.wikipedia.org/wiki/Representational_state_transfer',
    '*': 'https://en.wikipedia.org/wiki/Representational_state_transfer',
  };

export const
  DYNAMIC_NUMBER_RELOAD_INTERVAL = 900000;

export const
  dynamicNumbersUrl = {
    cavers: '/api/caver/count',
    entries: '/api/entry/count',
    publicEntries: '/api/v1/entry/publicCount',
    partners: '/api/grotto/count',
    officialPartners: '/api/grotto/officialCount',
  };

export const
  DYNAMIC_NEWS_RELOAD_INTERVAL = 3600000;

export const findRandomEntryUrl = '/api/entry/findRandom';
export const findForCarouselUrl = '/api/partner/findForCarousel';
export const quicksearchUrl = '/api/v1/search/findAll';
export const findMapBoundsUrl = '/api/v1/geoloc/findByBounds';
export const findMassifUrl = '/api/massifs/';
export const findGroupUrl = '/api/grotto/';

export const
  swaggerLinkV1 = '/ui/swagger/1';

export const
  wikiApiLinks = {
    fr: 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
    '*': 'https://en.wikipedia.org/wiki/Application_programming_interface',
  };

export const
  breadcrumpKeys = {
    ui: 'Dashboard',
    faq: 'FAQ',
    map: 'Map',
    api: 'API',
    admin: 'Administration',
    entries: 'Entries',
    search: 'Search',
    add: 'Add',
    swagger: 'Browse API',
    massifs: 'Massifs',
    groups: 'Groups',
  };

export const
  defaultCoord = { lat: 0, lng: 0 };


export const defaultZoom = 2;


export const focusZoom = 13;

export const
  entryDetailPath = '/ui/entry/';

export const
  sideMenuWidth = '215px';

export const
  logoGC = '/images/logo.svg';
