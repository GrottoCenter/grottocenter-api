import React from 'react';
import { withStyles, withTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import styled from 'styled-components';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {
  swaggerLinkV1,
  restApiLinks,
  wikiApiLinks,
  contactLinks,
} from '../../conf/Config';
import Translate from '../common/Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledH3 = withTheme(styled.h3`
  color: ${(props) => props.theme.palette.accent1Color};
`);

const StyledImage = styled.img`
  width: 100%;
`;

const StyledLinkToVersion = withTheme(styled(GCLink)`
  text-decoration: none;
  font-weight: 600;
  color: ${(props) => props.theme.palette.accent1Color};
`);

const StyledCheckIcon = withStyles(
  (theme) => ({
    root: {
      fill: theme.palette.accent1Color,
      position: 'relative',
      top: '6px',
      marginRight: '10px',
    },
  }),
  { withTheme: true },
)(CheckIcon);

//
//
// M A I N - C O M P O N E N T
//
//

const Api = () => {
  const restApiLink =
    restApiLinks[locale] !== undefined // eslint-disable-line no-undef
      ? restApiLinks[locale] // eslint-disable-line no-undef
      : restApiLinks['*'];

  return (
    <div>
      <div>
        <div className="container">
          <div className="row">
            <div className="four columns">
              <StyledImage src="/images/network.png" />
            </div>
            <div className="eight columns">
              <StyledH3>
                <Translate id="Grottocenter API" />
              </StyledH3>
              <p>
                <Translate id="You need to manipulate worldwide speleology data on your website? Trust Grottocenter to manage it for you!" />
              </p>
              <p>
                <Translate
                  id="We offer you a set of {0} that you can easily insert in your pages to access this data"
                  values={{
                    0: (
                      <GCLink
                        href={restApiLink}
                        alt="Link to rest API documentation"
                      >
                        <Translate id="Rest API endpoints" />
                      </GCLink>
                    ),
                  }}
                />
              </p>
              <p>
                <Translate
                  id="To use them, you just need an {0} key, and few lines of code!"
                  values={{
                    0: (
                      <InternationalizedLink
                        links={wikiApiLinks}
                        alt="What is an API?"
                      >
                        <Translate id="API" />
                      </InternationalizedLink>
                    ),
                  }}
                />
                &nbsp;
                <Translate
                  id="And to get your own API key, send us an email using the {0}"
                  values={{
                    0: (
                      <InternationalizedLink
                        links={contactLinks}
                        alt="Contact form"
                      >
                        <Translate id="contact form" />
                      </InternationalizedLink>
                    ),
                  }}
                />
              </p>
              <p />
              <h5>
                <Translate id="Available versions:" />
              </h5>
              <p>
                <StyledCheckIcon />
                <StyledLinkToVersion internal href={swaggerLinkV1}>
                  <Translate id="Version 1" />
                </StyledLinkToVersion>
              </p>
              <p>
                <Translate
                  id="Not familiar with Swagger? Need support? {0}"
                  values={{
                    0: (
                      <GCLink href="https://grottocenter.slack.com/messages/C858CHARY/">
                        <Translate id="Contact us!" />
                      </GCLink>
                    ),
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Api;
