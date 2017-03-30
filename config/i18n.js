/**
 * Internationalization / Localization Settings
 * (sails.config.i18n)
 *
 * If your app will touch people from all over the world, i18n (or internationalization)
 * may be an important part of your international strategy.
 *
 *
 * For more informationom i18n in Sails, check out:
 * http://sailsjs.org/#/documentation/concepts/Internationalization
 *
 * For a complete list of i18n options, see:
 * https://github.com/mashpie/i18n-node#list-of-configuration-options
 *
 *
 */

module.exports.i18n = {
  /***************************************************************************
   *                                                                          *
   * Which locales are supported?                                             *
   *                                                                          *
   ***************************************************************************/

  locales: ['ar', 'bg', 'ca', 'de', 'el', 'en', 'es', 'fr', 'he', 'id', 'nl', 'pt'],

  localesText: {
    'ar': 'عربية',
    'bg': 'Български',
    'ca': 'Català',
    'de': 'Deutsch',
    'el': 'Ελληνικός',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'he': 'עברי',
    'id': 'Indonesia',
    'it': 'Italiano',
    'ja': '日本語',
    'nl': 'Nederlands',
    'pt': 'Português'
  },

  /****************************************************************************
   *                                                                           *
   * What is the default locale for the site? Note that this setting will be   *
   * overridden for any request that sends an "Accept-Language" header (i.e.   *
   * most browsers), but it's still useful if you need to localize the         *
   * response for requests made by non-browser clients (e.g. cURL).            *
   *                                                                           *
   ****************************************************************************/

  defaultLocale: 'fr',

  /****************************************************************************
   *                                                                           *
   * Automatically add new keys to locale (translation) files when they are    *
   * encountered during a request?                                             *
   *                                                                           *
   ****************************************************************************/

  // updateFiles: false,

  /****************************************************************************
   *                                                                           *
   * Path (relative to app root) of directory to store locale (translation)    *
   * files in.                                                                 *
   *                                                                           *
   ****************************************************************************/

  // localesDirectory: '/config/locales'
};
