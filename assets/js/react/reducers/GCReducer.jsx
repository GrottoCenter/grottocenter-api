import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import quicksearch from './QuicksearchReducer';
import map from './MapReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import dynamicNumber from './DynamicNumberReducer';
import sideMenu from './SideMenuReducer';
import randomEntry from './RandomEntryReducer';
import partnersCarousel from './PartnersCarouselReducer';
import group from './GroupReducer';
import massif from './MassifReducer';
import bbs from './BbsReducer';
import subject from './SubjectReducer';
import pageTitle from './PageTitleReducer';
import entry from './EntryReducer';
import cave from './CaveReducer';
import auth from './AuthReducer';
import document from './DocumentReducer';
import region from './RegionReducer';
import identifierType from './IdentifierTypesReducer';
import documentType from './DocumentTypeReducer';
import caver from './CaverReducer';

//
//
// M A I N - R E D U C E R
//
//

const GCReducer = combineReducers({
  language,
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
  subject,
  pageTitle,
  auth,
  entry,
  cave,
  document,
  region,
  identifierType,
  documentType,
  caver,
});

export default GCReducer;
