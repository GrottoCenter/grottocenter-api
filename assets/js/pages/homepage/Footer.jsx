import React, {Component, PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GiftIcon from 'material-ui/svg-icons/action/card-giftcard';
import FlatButton from 'material-ui/FlatButton';

let licenceLinks = {
  'fr': 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
  'es': 'https://creativecommons.org/licenses/by-sa/3.0/deed.es_ES',
  'ca': 'https://creativecommons.org/licenses/by-sa/3.0/deed.ca',
  'de': 'https://creativecommons.org/licenses/by-sa/3.0/deed.de',
  'pt': 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt_PT',
  'nl': 'https://creativecommons.org/licenses/by-sa/3.0/deed.nl',
  'it': 'https://creativecommons.org/licenses/by-sa/3.0/deed.it'
};

let wikiBatsLinks = {};
localesList.map(function(el) { // eslint-disable-line no-undef
  let language = el.value;
  language = language.substring(0, 1).toUpperCase() + language.substring(1, language.length);
  wikiBatsLinks[el.value] = 'https://wiki.grottocenter.org/wiki/GrottoCenter:' + language + '/bats';
}, this);

let bloggerLinks = {
  'fr': 'http://blog-fr.grottocenter.org/'
};

let bloggerIcons = {
  'fr': 'blogger-Fr.svg'
};

let rssLinks = {};
localesList.map(function(el) { // eslint-disable-line no-undef
  let language = el.value;
  language = language.substring(0, 1).toUpperCase() + language.substring(1, language.length);
  rssLinks[el.value] = 'http://www.grottocenter.org/html/rss_' + language + '.xml';
}, this);

let contactLinks = {
  'fr': ' http://fr.wikicaves.org/contact'
};

let legalLinks = {};
localesList.map(function(el) { // eslint-disable-line no-undef
  let language = el.value;
  language = language.substring(0, 1).toUpperCase() + language.substring(1, language.length);
  legalLinks[el.value] = 'https://wiki.grottocenter.org/wiki/GrottoCenter:' + language + '/Legal_and_Privacy_Statement';
}, this);

class Footer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale // eslint-disable-line no-undef
    };
  }

  render() {
    let licenceLink = (licenceLinks[this.state.locale] !== undefined) ? licenceLinks[this.state.locale] : 'https://creativecommons.org/licenses/by-sa/3.0/';
    let wikiBatsLink = (wikiBatsLinks[this.state.locale] !== undefined) ? wikiBatsLinks[this.state.locale] : 'https://wiki.grottocenter.org/wiki/GrottoCenter:Es/bats';
    let bloggerLink = (bloggerLinks[this.state.locale] !== undefined) ? bloggerLinks[this.state.locale] : 'http://blog-en.grottocenter.org/';
    let bloggerIcon = (bloggerIcons[this.state.locale] !== undefined) ? bloggerIcons[this.state.locale] : 'blogger-En.svg';
    let rssLink = (rssLinks[this.state.locale] !== undefined) ? rssLinks[this.state.locale] : 'http://www.grottocenter.org/html/rss_En.xml';
    let contactLink = (contactLinks[this.state.locale] !== undefined) ? contactLinks[this.state.locale] : 'http://en.wikicaves.org/contact';
    let legalLink = (legalLinks[this.state.locale] !== undefined) ? legalLinks[this.state.locale] : 'https://wiki.grottocenter.org/wiki/GrottoCenter:En/Legal_and_Privacy_Statement';

    return (
      <div>
      <footer style={{backgroundColor: this.props.muiTheme.palette.primary1Color, color: this.props.muiTheme.palette.textIconColor, fontFamily: this.props.muiTheme.fontFamily}}>
        <div className="container">
          <div className="row">
            <div className="four columns">
              <div>
                <I18n>Published by</I18n>
              </div>
              <div className="publishedInfo">
                <a href="http://www.wikicaves.org/" target="_blank">
                  <img src="/images/logo.svg" alt="logo-wikicaves"/>
                  <br/>
                  <I18n>Wikicaves association</I18n>
                </a>
              </div>
            </div>

            <div className="four columns">
              <ul className="linksText">
                <li>
                  <a style={{color: this.props.muiTheme.palette.textIconColor}} href="https://wiki.grottocenter.org/wiki/GrottoCenter:Contributors" target="_blank">
                    <I18n>Contributors</I18n>
                  </a>
                </li>
                <li>
                  <a style={{color: this.props.muiTheme.palette.textIconColor}} href={contactLink} target="_blank">
                    <I18n>Contact</I18n>
                  </a>
                </li>
                <li>
                  <a style={{color: this.props.muiTheme.palette.textIconColor}} href={legalLink} target="_blank">
                    <I18n>Legal notice</I18n>
                  </a>
                </li>
              </ul>
            </div>

            <div className="four columns">
              <div className="donate">
                <form name='donate' action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
                  <input type="hidden" name="cmd" value="_s-xclick" />
                  <input type="hidden" name="hosted_button_id" value="TJEU7C2TZ356Y" />
                  <FlatButton
                    href="javascript:document.donate.submit()"
                    label={<I18n>Donate Now</I18n>}
                    icon={<GiftIcon/>}
                    backgroundColor={this.props.muiTheme.palette.accent1Color}
                    hoverColor={this.props.muiTheme.palette.accent1Color}
                    style={{color: this.props.muiTheme.palette.textIconColor}}
                  />
                <img alt='' src='https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif' width='1' height='1' />
                </form>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="twelve columns">
              <ul className="linksIcon">
                <li>
                  <a href="https://www.facebook.com/GrottoCenter" target="_blank">
                    <img src="/images/facebook.svg" alt="Follow us on Facebook"/>
                  </a>
                </li>
                <li>
                  <a href={rssLink} target="_blank">
                    <img src="/images/rss.png" alt="RSS feed"/>
                  </a>
                </li>
                <li>
                  <a href={bloggerLink} target="_blank">
                    <img src={'/images/' + bloggerIcon} alt="Grottocenter blog"/>
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/grottocenter" target="_blank">
                    <img src="/images/twitter.svg" alt="Follow us on Twitter"/>
                  </a>
                </li>
                <li>
                  <a href="https://github.com/GrottoCenter" target="_blank">
                    <img src="/images/github.png" alt="Grottocenter3 on GitHub"/>
                  </a>
                </li>
                <li>
                  <a href={wikiBatsLink} target="_blank">
                    <img src="/images/bats.svg" alt="Wiki page for bats"/>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <div className="footer" style={{color: this.props.muiTheme.palette.fullBlack, backgroundColor: this.props.muiTheme.palette.primary3Color}}>
        <div className="legal">
          <p>
            <I18n>Unless stated otherwise, all text and documents are available under the terms of the Creative Commons Attribution-ShareAlike 3.0 Unported.</I18n>
          </p>
          <p>
            <a className="licenceIcon" href={licenceLink} target="_blank">
              <img src="/images/CC-BY-SA.png" alt="CC-BY-SA licence"/>
            </a>
          </p>
        </div>
      </div>
    </div>
    );
  }
}

Footer.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Footer);
