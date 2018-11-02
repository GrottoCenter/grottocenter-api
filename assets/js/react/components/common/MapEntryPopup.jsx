import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Popup} from 'react-leaflet'
import FlatButton from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import GCLink from './GCLink';
import {entryDetailPath} from '../../conf/Config';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

const PopupStl = styled.div`
`;

function withContext(WrappedComponent, context){
  class ContextProvider extends Component {
    getChildContext() {
      return context;
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

  ContextProvider.childContextTypes = {};

  Object.keys(context).forEach(key => {
    ContextProvider.childContextTypes[key] = PropTypes.any.isRequired;
  });

  return ContextProvider;
}

class MapEntryPopup extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const GCLinkWithContext = withContext(GCLink, this.context);
    const FlatButtonWithContext = withContext(FlatButton, this.context);
    return (
      <Popup autoPan={false}>
        <PopupStl>
          <div>
            <h6>{this.props.entry.name}</h6>
            <div>{this.props.entry.city} ({this.props.entry.region})</div>
          </div>
          {this.props.entry.id &&
          <GCLinkWithContext internal={true} href={entryDetailPath + this.props.entry.id}>
            <FlatButtonWithContext icon={<ImageLoupe color={this.props.theme.palette.accent1Color} />} />
          </GCLinkWithContext>}
        </PopupStl>
      </Popup>
    );
  }
}

MapEntryPopup.contextTypes = {
  theme: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  entry: PropTypes.object.isRequired
};

export default withTheme()(MapEntryPopup);
