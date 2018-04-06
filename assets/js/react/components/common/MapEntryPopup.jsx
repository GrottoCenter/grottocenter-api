import React, {Component, PropTypes} from 'react';
import {Popup} from 'react-leaflet'
import FlatButton from 'material-ui/FlatButton';
import ImageLoupe from 'material-ui/svg-icons/image/loupe';
import GCLink from './GCLink';
import {entryDetailPath} from '../../conf/Config';
import muiThemeable from 'material-ui/styles/muiThemeable';
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
    const FlatButtonWithContext = withContext(FlatButton, this.context);
    return (
      <Popup autoPan={false}>
        <PopupStl>
          <div>
            <h6>{this.props.entry.name}</h6>
            <div>{this.props.entry.city} ({this.props.entry.region})</div>
          </div>
          {this.props.entry.id &&
          <GCLink internal={true} href={entryDetailPath + this.props.entry.id}>
            <FlatButtonWithContext icon={<ImageLoupe color={this.props.muiTheme.palette.accent1Color} />} />
          </GCLink>}
        </PopupStl>
      </Popup>
    );
  }
}

MapEntryPopup.contextTypes = {
  muiTheme: PropTypes.object.isRequired
};

MapEntryPopup.propTypes = {
  entry: PropTypes.object.isRequired
};

export default muiThemeable()(MapEntryPopup);
