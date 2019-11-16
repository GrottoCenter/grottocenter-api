import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import quicksearch from './QuicksearchReducer';
import map from './MapReducer';
import currentLanguage from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import dynamicNumber from './DynamicNumberReducer';
import sideMenu from './SideMenuReducer';
import randomEntry from './RandomEntryReducer';
import partnersCarousel from './PartnersCarouselReducer';
import group from './GroupReducer';
import massif from './MassifReducer';
import bbs from './BbsReducer';
import subtheme from './SubthemeReducer';
import pageTitle from './PageTitleReducer';

//
//
// M A I N - R E D U C E R
//
//

const GCReducer = combineReducers({
  currentLanguage,
  advancedsearch,
  quicksearch,
  map,
  latestBlogNews,
  dynamicNumber,
  sideMenu,
  randomEntry,
  partnersCarousel,
  group,
  massif,
  bbs,
  subtheme,
  pageTitle
});

export default GCReducer;
