import {combineReducers} from "redux";
import {startSearch, loadCaveSuccess, loadEntrySuccess, loadGrottoSuccess, showMarker} from './../actions/Search';
import {currentLanguage} from './LanguageReducer';

/*
    The marker centered on the Map component
    It represent a Mappable Object, or Object with latlng coordinates
    Has side info to print on popup & to make links to more info
    TODO : markers, a array of Mappable Object markers
*/
const marker = (state = [], action) => {
  switch (action.type) {
    case showMarker().type:// TODO useless mapping > send plain entry object to Map
    return {
          latlng:{
              lat:action.entry.latitude,
              lng:action.entry.longitude
          },
          name:action.entry.name,
          altitude:action.entry.altitude?action.entry.altitude + 'm':'',
          author:action.entry.author.nickname?action.entry.author.nickname:''
    }
    default://TODO no default marker on map
      return {
                latlng:{
                    lat:43.9488581774652,
                    lng:3.68913066801612
                },
                name:"Montméjean (Aven de)"
            }
  }
}

/*
    The list of caves returned by the search
*/
const caves = (state = [], action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return [];
    case 'LOAD_CAVE_SUCCESS':
      return action.data;
    default:
      return state
  }
}

/*
    The list of entries returned by the search
*/
const entries = (state = [], action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return [];
    case 'LOAD_ENTRY_SUCCESS':
      return action.data;
    default:
      return state
  }
}

/*
    The list of grottos returned by the search
*/
const grottos = (state = [], action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return [];
    case 'LOAD_GROTTO_SUCCESS':
      return action.data;
    default:
      return state
  }
}

export const searchReducers = combineReducers({
  caves,
  entries,
  grottos,
  marker,
  currentLanguage
});
export default searchReducers;
