import _ from 'underscore.string';

export const
  DEFAULT_LANGUAGE = 'fr',
  FR_GC_BLOG = '/api/rss/FR',
  EN_GC_BLOG = '/api/rss/EN';

function generateLinks(link, defaultLang) {
  let resultArray = {};
  localesList.map(function(el) { // eslint-disable-line
    resultArray[el.value] = _.replaceAll(link, '%s', _.capitalize(el.value));
  });
  resultArray['*'] = _.replaceAll(link, '%s', _.capitalize(defaultLang));
  return resultArray;
}

export const
  wikicavesLink = {
    '*': 'http://www.wikicaves.org/'
  },
  contributorsLink = {
    '*': 'https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors'
  },
  facebookLink = {
    '*': 'https://www.facebook.com/GrottoCenter'
  },
  twitterLink = {
    '*': 'https://twitter.com/grottocenter'
  },
  githubLink = {
    '*': 'https://github.com/GrottoCenter'
  },
  licenceLinks = {
    'fr': 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
    'es': 'https://creativecommons.org/licenses/by-sa/3.0/deed.es_ES',
    'ca': 'https://creativecommons.org/licenses/by-sa/3.0/deed.ca',
    'de': 'https://creativecommons.org/licenses/by-sa/3.0/deed.de',
    'pt': 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt_PT',
    'nl': 'https://creativecommons.org/licenses/by-sa/3.0/deed.nl',
    'it': 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
    '*': 'https://creativecommons.org/licenses/by-sa/3.0/'
  },
  bloggerLinks = {
    'fr': 'http://blog-fr.grottocenter.org/',
    '*': 'http://blog-en.grottocenter.org/',
  },
  bloggerIcons = {
    'fr': 'blogger-Fr.svg',
    '*': 'blogger-En.svg'
  },
  contactLinks = {
    'fr': ' http://fr.wikicaves.org/contact',
    '*': 'http://en.wikicaves.org/contact'
  },
  fseLinks = {
    'fr': 'http://eurospeleo.eu/fr/',
    '*': 'http://eurospeleo.eu/en/'
  },
  wikiBatsLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats', 'en'),
  rssLinks = generateLinks('http://www.grottocenter.org/html/rss_%s.xml', 'en'),
  legalLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement', 'en');

export const
  paypalLink = 'https://www.paypal.com/cgi-bin/webscr',
  paypalImgLink = 'https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif',
  paypalId = 'TJEU7C2TZ356Y';

export const
  detailPageV2Links = {
    'fr': 'http://www.grottocenter.org/html/file_Fr.php?lang=Fr',
    'es': 'http://www.grottocenter.org/html/file_Es.php?lang=Es',
    'ca': 'http://www.grottocenter.org/html/file_Ca.php?lang=Ca',
    'de': 'http://www.grottocenter.org/html/file_De.php?lang=De',
    'bg': 'http://www.grottocenter.org/html/file_Bg.php?lang=Bg',
    'nl': 'http://www.grottocenter.org/html/file_Nl.php?lang=Nl',
    'it': 'http://www.grottocenter.org/html/file_It.php?lang=It',
    '*': 'http://www.grottocenter.org/html/file_En.php?lang=En'
  };

export const
  pftGdLink = 'https://docs.google.com/document/d/1SccuusPQcxrZJI3nvWcbUc2dgGyKc4ZJXqQzSPeE9Hg/edit?usp=sharing';

export const
  contributeLinks = {
    'fr': 'http://fr.wikicaves.org/contribute-participer',
    '*': 'http://en.wikicaves.org/contribute-participer'
  };

export const
  restApiLinks = {
    'fr': 'https://fr.wikipedia.org/wiki/Representational_state_transfer',
    '*': 'https://en.wikipedia.org/wiki/Representational_state_transfer'
  };

export const
  DYNAMIC_NUMBER_RELOAD_INTERVAL = 900000;

export const
  dynamicNumbersUrl = {
    'cavers': '/api/caver/count',
    'entries': '/api/entry/count',
    'publicEntries': '/api/v1/entry/publicCount',
    'partners': '/api/grotto/count',
    'officialPartners': '/api/grotto/officialCount'
  };

export const
  DYNAMIC_NEWS_RELOAD_INTERVAL = 3600000;

export const
  findRandomEntryUrl = '/api/entry/findRandom',
  findForCarouselUrl = '/api/partner/findForCarousel',
  quicksearchUrl = '/api/v1/search/findAll',
  findMapBoundsUrl = '/api/v1/geoloc/findByBounds';

export const
  swaggerLinkV1 = '/ui/swagger/?url=/swagger/apiV1.yaml';

export const
  wikiApiLinks = {
    'fr': 'https://fr.wikipedia.org/wiki/Interface_de_programmation',
    '*': 'https://en.wikipedia.org/wiki/Application_programming_interface'
  };

export const
  breadcrumpKeys = {
    'ui': 'Dashboard',
    'faq': 'FAQ',
    'map': 'Map',
    'api': 'API',
    'admin': 'Administration',
    'entries': 'Entries',
    'search': 'Search',
    'add': 'Add'
  };

export const
  defaultCoord = { lat: 0, lng: 0 },
  defaultZoom = 2;

export const
  entryDetailPath = '/ui/entry/';
  
export const
  sideMenuWidth = '215px';

export const
  logoGC = '/images/logo.svg';
