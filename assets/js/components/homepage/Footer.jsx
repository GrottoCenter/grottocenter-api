import React, {Component, PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GiftIcon from 'material-ui/svg-icons/action/card-giftcard';
import FlatButton from 'material-ui/FlatButton';
import GCLink from '../GCLink';
import {licenceLinks, bloggerLinks, bloggerIcons, contactLinks, wikiBatsLinks, rssLinks, legalLinks} from '../../Config';
import {wikicavesLink, contributorsLink, facebookLink, twitterLink, githubLink} from '../../Config';
import {paypalLink, paypalImgLink, paypalId} from '../../Config';

class Footer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale // eslint-disable-line no-undef
    };
  }

  render() {
    let licenceLink = (licenceLinks[this.state.locale] !== undefined) ? licenceLinks[this.state.locale] : licenceLinks['*'];
    let wikiBatsLink = (wikiBatsLinks[this.state.locale] !== undefined) ? wikiBatsLinks[this.state.locale] : wikiBatsLinks['*'];
    let bloggerLink = (bloggerLinks[this.state.locale] !== undefined) ? bloggerLinks[this.state.locale] : bloggerLinks['*'];
    let bloggerIcon = (bloggerIcons[this.state.locale] !== undefined) ? bloggerIcons[this.state.locale] : bloggerIcons['*'];
    let rssLink = (rssLinks[this.state.locale] !== undefined) ? rssLinks[this.state.locale] : rssLinks['*'];
    let contactLink = (contactLinks[this.state.locale] !== undefined) ? contactLinks[this.state.locale] : contactLinks['*'];
    let legalLink = (legalLinks[this.state.locale] !== undefined) ? legalLinks[this.state.locale] : legalLinks['*'];

    return (
      <div>
      <footer style={{backgroundColor: this.props.muiTheme.palette.primary1Color, color: this.props.muiTheme.palette.textIconColor}}>
        <div className="container">
          <div className="row">
            <div className="four columns">
              <div>
                <I18n>Published by</I18n>
              </div>
              <div className="publishedInfo">
                <GCLink href={wikicavesLink}>
                  <img src="/images/logo.svg" alt="logo-wikicaves"/>
                  <br/>
                  <I18n>Wikicaves association</I18n>
                </GCLink>
              </div>
            </div>

            <div className="four columns">
              <ul className="linksText">
                <li>
                  <GCLink internal={true} style={{color: this.props.muiTheme.palette.textIconColor}} href='/ui/faq'>
                    <I18n>FAQ</I18n>
                  </GCLink>
                </li>
                <li>
                  <GCLink style={{color: this.props.muiTheme.palette.textIconColor}} href={contributorsLink}>
                    <I18n>Contributors</I18n>
                  </GCLink>
                </li>
                <li>
                  <GCLink style={{color: this.props.muiTheme.palette.textIconColor}} href={contactLink}>
                    <I18n>Contact</I18n>
                  </GCLink>
                </li>
                <li>
                  <GCLink style={{color: this.props.muiTheme.palette.textIconColor}} href={legalLink}>
                    <I18n>Legal notice</I18n>
                  </GCLink>
                </li>
              </ul>
            </div>

            <div className="four columns">
              <div className="donate">
                <form name='donate' action={paypalLink} method="post" target="_blank">
                  <input type="hidden" name="cmd" value="_s-xclick" />
                  <input type="hidden" name="hosted_button_id" value={paypalId} />
                  <FlatButton
                    href="javascript:document.donate.submit()"
                    label={<I18n>Donate now</I18n>}
                    icon={<GiftIcon/>}
                    backgroundColor={this.props.muiTheme.palette.accent1Color}
                    hoverColor={this.props.muiTheme.palette.accent1Color}
                    style={{color: this.props.muiTheme.palette.textIconColor}}
                  />
                <img alt='' src={paypalImgLink} width='1' height='1' />
                </form>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="twelve columns">
              <ul className="linksIcon">
                <li>
                  <GCLink href={facebookLink}>
                    <img src="/images/icons8/icons8-facebook-filled-100.png" alt="Follow us on Facebook"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink href={rssLink}>
                    <img src="/images/icons8/icons8-rss-filled-100.png" alt="RSS feed"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink href={bloggerLink}>
                    <img src='/images/icons8/icons8-blogger-filled-100.png' alt="Grottocenter blog"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink href={twitterLink}>
                    <img src="/images/icons8/icons8-twitter-filled-100.png" alt="Follow us on Twitter"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink href={githubLink}>
                    <img src="/images/icons8/icons8-github-filled-100.png" alt="Grottocenter3 on GitHub"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink internal={true} href='ui/api'>
                    <img className='apiIcon' src="/images/icons8/icons8-rest-api-filled-100.png" alt="Want to use our API?"/>
                  </GCLink>
                </li>
                <li>
                  <GCLink href={wikiBatsLink}>
                    <img style={{width:'44px', padding:'5px'}} src="/images/icons8/bats.svg" alt="Wiki page for bats"/>
                  </GCLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <div className="footer" style={{color: this.props.muiTheme.palette.fullBlack, backgroundColor: this.props.muiTheme.palette.primary3Color}}>
        <div className="legal">
          <p>
            <I18n>Unless stated otherwise, all text and documents are available under the terms of the Creative Commons Attribution-ShareAlike 30 Unported</I18n>
          </p>
          <p>
            <GCLink className="licenceIcon" href={licenceLink}>
              <img src="/images/CC-BY-SA.png" alt="CC-BY-SA licence"/>
            </GCLink>
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
