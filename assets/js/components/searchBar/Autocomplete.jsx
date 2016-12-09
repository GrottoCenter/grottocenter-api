import React from 'react'
import { connect } from 'react-redux'
import { showMarker } from './../../actions/Search'

import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import Map from 'material-ui/svg-icons/maps/map';

import {cyan500} from 'material-ui/styles/colors';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

//TODO: get grotto icons to a font
// import SvgIcon from 'material-ui/SvgIcon';
// const HomeIcon = (props) => (
//   <SvgIcon {...props}>
//     <rect x="0.5" y="0.5" fill="#FFFFFF" stroke="#1D1D1B" width="79.3" height="49"/>
//   </SvgIcon>
// );

const muiTheme = getMuiTheme({
  palette: {
    textColor: cyan500,
  },
});
class Autocomplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }
  onNewRequest(chosenRequest,index) {
    if ( chosenRequest.isMappable ) {
        this.props.dispatch(showMarker(chosenRequest))
    }
    if ( chosenRequest.id )
      window.open('http://www.grottocenter.org/html/file_En.php?lang=En&check_lang_auto=false&category=entry&id='+chosenRequest.id,'caveWindow');
 }
 isMappable(obj) {// TODO : move to models
     return obj.latitude && obj.longitude?true:false;
 }
 foundDataToMenuItemMapping(item, i) {
   return {
     id:item.id,
     text: item.name,
     latitude: item.latitude,
     longitude: item.longitude,
     altitude: item.altitude,
    author: item.author,
    isMappable:this.isMappable(item),
    value: (
      <MenuItem
        primaryText={item.name + ' (' + item.region + ')'}
         leftIcon={<Map />}
      />
    )
  }
 }
  onUpdateInput(searchText) {
    $.ajax({
    url: "/entry/findAll?name=" +searchText,//TODO:needs a new optimized service for autocomplete
    dataType: 'json',
    success: function(data) {
        this.setState({
          dataSource: data.map(this.foundDataToMenuItemMapping.bind(this))
        });
    }.bind(this)
  });
 }
  render() {
    return (
        <MuiThemeProvider muiTheme={muiTheme}>
              <AutoComplete
              floatingLabelText="Rechercher une cavité, un club..."
              dataSource={this.state.dataSource}
              onUpdateInput={this.onUpdateInput.bind(this)}
              onNewRequest={this.onNewRequest.bind(this)}
              textFieldStyle={{color: 'cyan500'}}
              listStyle={{color: 'cyan500'}}
              hintStyle={{color: 'white'}}
              fullWidth={true}
              maxSearchResults={8}
              filter={AutoComplete.noFilter}
              />
        </MuiThemeProvider>
    )
  }
}
Autocomplete = connect()(Autocomplete);
export default Autocomplete
