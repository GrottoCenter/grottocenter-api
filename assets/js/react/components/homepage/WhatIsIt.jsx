import React, {Component} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import GCLink from '../GCLink';
import DynamicNumberConnector from '../../containers/DynamicNumberConnector';

class WhatIsIt extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div role="section" className="numbers">
        <h3>
          <I18n>Grottocenter numbers</I18n>
          <span className="icon icon-gc-bat" style={{'verticalAlign': 'super'}}></span><br/>
        </h3>
        <div className="container">
          <div className="row">
            <div className="six columns">
              <span className="icon icon-gc-entries"></span>
              <DynamicNumberConnector className="number" numberType='publicEntries'/><br/>
              <I18n>caves are freely accessible from the following page (</I18n><DynamicNumberConnector numberType='entries'/> <I18n>by logging on</I18n> <GCLink href='http://www.grottocenter.org'>Grotto v2</GCLink>)
            </div>
            <div className="six columns">
              <span className="icon icon-gc-club"></span>
              <DynamicNumberConnector className="number" numberType='officialPartners'/><br/>
              <I18n>organizations who take part in the project by  funding, providing data,communicating on the interest and benefits of  cavers to share data</I18n>
            </div>
          </div>
          <div className="row">
            <div className="six columns">
              <span className="icon icon-gc-speleo"></span>
              <DynamicNumberConnector className="number" numberType='cavers'/><br/>
              <I18n>cavers take part, day after day, in improving and expanding the database</I18n>
            </div>
            <div className="six columns">
              <span className="icon icon-gc-expe"></span>
              <DynamicNumberConnector className="number" numberType='partners'/><br/>
              <I18n>organizations are registered on the site</I18n>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default muiThemeable()(WhatIsIt);
