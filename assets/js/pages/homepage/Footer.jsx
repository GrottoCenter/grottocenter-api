import React, {Component} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';

let licenceLinks = {
  'fr': 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
  'es': 'https://creativecommons.org/licenses/by-sa/3.0/deed.es_ES',
  'ca': 'https://creativecommons.org/licenses/by-sa/3.0/deed.ca',
  'de': 'https://creativecommons.org/licenses/by-sa/3.0/deed.de',
  'pt': 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt_PT',
  'nl': 'https://creativecommons.org/licenses/by-sa/3.0/deed.nl',
  'it': 'https://creativecommons.org/licenses/by-sa/3.0/deed.it',
};

class LicenceLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale // eslint-disable-line no-undef
    };
  }

  render() {
    let computedLink = (licenceLinks[this.state.locale] !== undefined) ? licenceLinks[this.state.locale] : 'https://creativecommons.org/licenses/by-sa/3.0/';
    return (
      <a href={computedLink} target="_blank">
        <img height="24px" src="/images/CC-BY-SA.png" alt=""/>
      </a>
    );
  }
}

const Footer = (props) => (
  <footer style={{backgroundColor: props.muiTheme.palette.primary1Color, color: props.muiTheme.palette.textIconColor}}>
    <div className="container">
      <div className="row">
        <div className="three columns">
          <div>
            <I18n>Published by</I18n>
          </div>
          <img height="48" src="/images/logoGC.png"/>
          <a href="http://www.wikicaves.org/" target="_blank"><I18n>Wikicaves association</I18n></a>
        </div>
        <div className="three columns social">
          <a href="https://www.facebook.com/GrottoCenter" target="_blank"><img src="/images/facebook.svg" alt=""/></a>
          <a href="http://www.grottocenter.org/html/rss_Es.xml" target="_blank"><img src="/images/rss.png" alt=""/></a>
          <a href="http://blog-fr.grottocenter.org/" target="_blank"><img src="/images/blog.png" alt=""/></a>
          <a href="https://twitter.com/grottocenter" target="_blank"><img src="/images/twitter.png" alt=""/></a>
        </div>
        <div className="three columns infos">
          <a href="https://github.com/GrottoCenter" target="_blank"><img src="/images/github.png" alt=""/></a>
          <a href="modal-mail.html" data-target="#mail" data-toggle="modal" role="dialog" aria-labelledby="mail" aria-hidden="true"><img src="/images/icon/ic_contact_mail_black_48px.png" alt=""/></a>
          <a href="http://www.grottocenter.org//html/legal_and_privacy_En.php"><img src="/images/ic_info_black_48px.png" alt=""/></a>
          <a href="http://www.grottocenter.org//html/bats_Fr.php"><img src="/images/bats.svg" alt=""/></a>
        </div>
        <div className="three columns donate">
          <div className="centered bigger">
            <I18n>Wikicaves association</I18n>
          </div>
          <div><img src="/images/btn_donateCC_LG.gif" alt="Donate"/></div>
        </div>
      </div>
      <div className="row">
        <div className="twelve columns legal">
          <div>
            <LicenceLink/>
          </div>
          <p>
            <I18n>Unless stated otherwise, all text and documents are available under the terms of the Creative Commons Attribution-ShareAlike 3.0 Unported.</I18n>
          </p>
        </div>
      </div>
      <div className="row">
        <div className="twelve columns legal">
          <p>
            <I18n>This site, although it may contain detailed information on caves, was not designed to facilitate the visit for none caver people. Dangers are not necessarily reported and information mentioned is not everytime verified. Caving is a discipline with many facets: cultural, science and sports. In the latter capacity, it often requires a physical commitment. It is also not free of risks, and even major risks. These risks, if they can not be completely eliminated, are at least greatly reduced by a practice in the rules, practice which is fully understood when under a caving club (grotto). In any case GROTTOCENTER and its team can not be held liable for a bad practice of caving. The novice who would engage in underground exploration is urged to contact a caving club. The names and contact information can be obtained among other to the IUS (International Union of Speleology), to GROTTOCENTER or to his national federation.</I18n>
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default muiThemeable()(Footer);
