import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Popup} from 'react-leaflet'
import Button from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import GCLink from './GCLink';
import {entryDetailPath} from '../../conf/Config';
import {withStyles, withTheme} from '@material-ui/core/styles';
import { withContext } from '../../helpers/Routing';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledImageLoupe = withStyles(theme => ({
  root: {
    fill: theme.palette.accent1Color,
  }
}), { withTheme: true })(ImageLoupe);

//
//
// M A I N - C O M P O N E N T
//
//

export default class MapEntryPopup extends Component {
  // This make sure you have router in you this.context
  static contextTypes = {
    router: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired
  };

  static propTypes = {
    entry: PropTypes.object.isRequired
  };

  render() {
    const GCLinkWithContext = withContext(GCLink, this.context);
    const ButtonWithContext = withContext(Button, this.context);
    const StyledImageLoupeComponent = <StyledImageLoupe/>;

    return (
      <Popup autoPan={false}>
        <React.Fragment>
          <div>
            <h6>{this.props.entry.name}</h6>
            <div>{this.props.entry.city} ({this.props.entry.region})</div>
          </div>

          {this.props.entry.id && (
            <GCLinkWithContext internal={true} href={entryDetailPath + this.props.entry.id}>
              <ButtonWithContext variant='flat'>
                {StyledImageLoupeComponent}
              </ButtonWithContext>
            </GCLinkWithContext>
          )}
        </React.Fragment>
      </Popup>
    );
  }
}
