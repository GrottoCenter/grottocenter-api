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
  wikicavesLink = 'http://www.wikicaves.org/',
  contributorsLink = 'https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors',
  facebookLink = 'https://www.facebook.com/GrottoCenter',
  twitterLink = 'https://twitter.com/grottocenter',
  githubLink = 'https://github.com/GrottoCenter',
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
  wikiBatsLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/bats', 'en'),
  rssLinks = generateLinks('http://www.grottocenter.org/html/rss_%s.xml', 'en'),
  legalLinks = generateLinks('https://wiki.grottocenter.org/wiki/GrottoCenter:%s/Legal_and_Privacy_Statement', 'en');


export const
  paypalLink = 'https://www.paypal.com/cgi-bin/webscr',
  paypalImgLink = 'https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif',
  paypalId = 'TJEU7C2TZ356Y';
