import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import auth from './AuthReducer';
import bbs from './BbsReducer';
import cave from './CaveReducer';
import caver from './CaverReducer';
import caverGroups from './CaverGroupsReducer';
import document from './DocumentReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import dynamicNumber from './DynamicNumberReducer';
import entry from './EntryReducer';
import group from './GroupReducer';
import identifierType from './IdentifierTypesReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import map from './MapReducer';
import massif from './MassifReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import processDocuments from './ProcessDocumentsReducer';
import quicksearch from './QuicksearchReducer';
import randomEntry from './RandomEntryReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import subject from './SubjectReducer';
import error from './ErrorReducer';

//
//
// M A I N - R E D U C E R
//
//

const GCReducer = combineReducers({
  advancedsearch,
  auth,
  bbs,
  cave,
  caver,
  caverGroups,
  document,
  documentDetails,
  documents,
  documentType,
  dynamicNumber,
  entry,
  error,
  group,
  identifierType,
  language,
  latestBlogNews,
  map,
  massif,
  pageTitle,
  partnersCarousel,
  processDocuments,
  quicksearch,
  randomEntry,
  region,
  sideMenu,
  subject,
});

export default GCReducer;
