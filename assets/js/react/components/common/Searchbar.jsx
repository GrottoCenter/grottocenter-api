import React, {PropTypes, Component} from 'react';
import {browserHistory} from 'react-router';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import ExploreIcon from 'material-ui/svg-icons/action/explore';
import Translate from '../common/Translate';

//TODO: get grotto icons to a font
// import SvgIcon from 'material-ui/SvgIcon';
// const HomeIcon = (props) => (
//   <SvgIcon {...props}>
//     <rect x="0.5" y="0.5" fill="#FFFFFF" stroke="#1D1D1B" width="79.3" height="49"/>
//   </SvgIcon>
// );

class Searchbar extends Component {
  constructor(props) {
    super(props);
  }

  handleNewRequest(selectedItem) {
    if (selectedItem.isMappable) {
      this.props.setCurrentEntry(selectedItem);
    }
    if (selectedItem.id) {
      browserHistory.push('/ui/map');
    }
  }

  isMappable(obj) { // TODO : move to models ?
    return obj.latitude && obj.longitude?true:false;
  }

  // only search for entries at this time
  /*isCave(obj) {
    // TODO : better when it will be possible
    return obj.temperature;
  }*/

  isEntry(obj) {
    // TODO : better when it will be possible
    return obj.isSensitive !== undefined;
  }

  // only search for entries at this time
  /*isGrotto(obj) {
    // TODO : better when it will be possible
    return obj.isOfficialPartner !== undefined;
  }*/

  foundDataToMenuItemMapping(item) {
    let primaryText = item.name;
    if (this.isEntry(item)) {
      primaryText+=' - ' + item.region;
    }

    let category ='entry';
    let icon = <ExploreIcon />;
    // only search for entries at this time
    /*if (this.isCave(item)) {
      category = 'cave';
      icon = <MapIcon />;
    } else if (this.isGrotto(item)) {
      category = 'grotto';
    }*/

    return {
      id: item.id,
      text: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      altitude: item.altitude,
      author: item.author,
      category:category,
      isMappable:(item) => this.isMappable(item),
      value: (
        <MenuItem
          primaryText={primaryText}
          leftIcon={icon}
        />
      )
    };
  }

  handleUpdateInput(searchText) {
    if (searchText && searchText.length >= 3) {
      this.props.search({name: searchText});
    } else {
      this.props.reset();
    }
  }

  render() {
    let popupStyle = {};
    if (this.props.results && this.props.results.length > 0) {
      popupStyle.style = {
        height: '200px'
      };
    }

    let formatedResults = [];
    if (this.props.results && this.props.results.entries) {
      this.props.results.entries.map((entry, idx) => {
        formatedResults.push(this.foundDataToMenuItemMapping(entry, idx));
      });
    } // TODO message No entry found

    return (
      <AutoComplete
        className={this.props.className}
        textFieldStyle={{padding: '0 10px', width: 'calc(100% - 40px)', whiteSpace: 'nowrap'}}
        floatingLabelText={<Translate>Search for a cave</Translate>}
        dataSource={formatedResults}
        onUpdateInput={(input) => this.handleUpdateInput(input)}
        onNewRequest={(selectedItem) => this.handleNewRequest(selectedItem)}
        fullWidth={true}
        maxSearchResults={50}
        filter={AutoComplete.noFilter}
        popoverProps={popupStyle}
      />
    );
  }
}

Searchbar.propTypes = {
  reset: PropTypes.func.isRequired,
  search: PropTypes.func.isRequired,
  setCurrentEntry: PropTypes.func.isRequired,
  results: PropTypes.object,
  className: PropTypes.string
};

export default Searchbar;
