import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import GCLink from './GCLink';
import {swaggerLinkV1, restApiLinks} from '../Config';

const Api = (props) => (
  <div>
    <div role="section">
      <div className="container">
        <div className="row">
          <div className="four columns">
            <img style={{width: '100%'}} src="/images/network.png"/>
          </div>
          <div className="eight columns">
            <h3 style={{color: props.muiTheme.palette.accent1Color}}>
              <I18n>Grottocenter API</I18n>
            </h3>
            <p><I18n>You need to manipulate worldwide speleology data on your website? Trust Grottocenter to manage it for you!</I18n></p>
            <p><I18n>We offer you a set of <GCLink href={restApiLinks} alt='Link to rest API documentation'>Rest API endpoints</GCLink> that you can easily insert in your pages to access this data.</I18n></p>
            <p></p>
            <h5><I18n>Available versions:</I18n></h5>
            <p>
              <CheckIcon style={{color: props.muiTheme.palette.accent1Color, position: 'relative', top: '6px', marginRight: '10px'}} />
              <GCLink style={{textDecoration: 'none', fontWeight: '600', color: props.muiTheme.palette.accent1Color}} internal={true} href={swaggerLinkV1}><I18n>Version 1</I18n></GCLink>
            </p>
            <p>
              <I18n>Not familiar with Swagger? Need support? <GCLink href='https://grottocenter.slack.com/messages/C858CHARY/'>Contact us!</GCLink></I18n>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

Api.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Api);
