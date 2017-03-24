import React, {Component, PropTypes} from 'react';
import Autocomplete from './../../components/searchBar/Autocomplete';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GCLink from '../GCLink';

let fseLinks = {
  'fr': 'http://eurospeleo.eu/fr/'
};

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale // eslint-disable-line no-undef
    };
  }

  render() {
    let fseLink = (fseLinks[this.state.locale] !== undefined) ? fseLinks[this.state.locale] : 'http://eurospeleo.eu/en/';

    return (
      <header className="header" style={{color: this.props.muiTheme.palette.primaryTextColor, fontFamily: this.props.muiTheme.fontFamily}}>
        <div className="container">
          <div className="row brand bgwhite">
            <div className="twelve columns">
              <GCLink blank={false} href="" className="logo">
                <img src="/images/logo.svg" alt="logo-wikicaves"/>
              </GCLink>
              <h1 className="sitename">Grottocenter</h1>
              <span className="slogan">
                  <I18n>The Wiki database made by cavers for cavers</I18n>
              </span>
            </div>
          </div>

          <div className="row bgwhite">
            <div className="twelve columns">
              <span className="gc-fse-info">
                <GCLink href={fseLink} alt="Link to FSE">
                  <img className="logofse" src="/images/FSE.svg" alt="logo-fse"/>
                </GCLink>
                <I18n>Grottocenter is supported by the FSE</I18n>
              </span>
            </div>
          </div>

          <div className="row searchbar">
            <div className="twelve columns">
              <Autocomplete/>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

Header.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Header);
