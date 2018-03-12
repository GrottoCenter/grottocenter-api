import {combineReducers} from 'redux';
import {quicksearch} from './QuicksearchReducer';
import {map} from './MapReducer';
import {currentLanguage} from './LanguageReducer';
import {latestBlogNews} from './LatestBlogNewsReducer';
import {dynamicNumber} from './DynamicNumberReducer';
import {sideMenu} from './SideMenuReducer';
import {randomEntry} from './RandomEntryReducer';
import {partnersCarousel} from './PartnersCarouselReducer';

const GCReducer = combineReducers({
  currentLanguage,
  quicksearch,
  map,
  latestBlogNews,
  dynamicNumber,
  sideMenu,
  randomEntry,
  partnersCarousel
});

export default GCReducer;
