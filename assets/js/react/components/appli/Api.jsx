import React, {Component, PropTypes} from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {swaggerLinkV1, restApiLinks, wikiApiLinks, contactLinks} from '../../conf/Config';
import Translate from '../common/Translate';

class Api extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale // eslint-disable-line no-undef
    };
  }

  render() {
    let restApiLink = (restApiLinks[this.state.locale] !== undefined) ? restApiLinks[this.state.locale] : restApiLinks['*'];

    return (
      <div>
        <div role="section">
          <div className="container">
            <div className="row">
              <div className="four columns">
                <img style={{width: '100%'}} src="/images/network.png"/>
              </div>
              <div className="eight columns">
                <h3 style={{color: this.props.muiTheme.palette.accent1Color}}>
                  <Translate id="Grottocenter API" />
                </h3>
                <p>
                  <Translate id="You need to manipulate worldwide speleology data on your website? Trust Grottocenter to manage it for you!" />
                </p>
                <p>
                  <Translate
                    id="We offer you a set of {0} that you can easily insert in your pages to access this data"
                    values={{
                      0: <GCLink href={restApiLink} alt='Link to rest API documentation'><Translate id="Rest API endpoints" /></GCLink>
                    }}
                  />
                </p>
                <p>
                  <Translate
                    id="To use them, you just need an {0} key, and few lines of code!"
                    values={{
                      0: <InternationalizedLink links={wikiApiLinks} alt='What is an API?'><Translate id="API" /></InternationalizedLink>
                    }}
                  />
                  &nbsp;
                  <Translate
                    id="And to get your own API key, send us an email using the {0}"
                    values={{
                      0: <InternationalizedLink links={contactLinks} alt='Contact form'><Translate id="contact form" /></InternationalizedLink>
                    }}
                  />
                </p>
                <p></p>
                <h5>
                  <Translate id="Available versions:" />
                </h5>
                <p>
                  <CheckIcon style={{color: this.props.muiTheme.palette.accent1Color, position: 'relative', top: '6px', marginRight: '10px'}} />
                  <GCLink style={{textDecoration: 'none', fontWeight: '600', color: this.props.muiTheme.palette.accent1Color}} internal={true} href={swaggerLinkV1}><Translate id="Version 1" /></GCLink>
                </p>
                <p>
                  <Translate
                    id="Not familiar with Swagger? Need support? {0}"
                    values={{
                      0: <GCLink href='https://grottocenter.slack.com/messages/C858CHARY/'><Translate id="Contact us!" /></GCLink>
                    }}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Api.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Api);
