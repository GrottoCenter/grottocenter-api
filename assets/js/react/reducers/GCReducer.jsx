import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import cave from './CaveReducer';
import caver from './CaverReducer';
import caverGroups from './CaverGroupsReducer';
import createCaver from './CreateCaver';
import createOrganization from './CreateOrganization';
import document from './DocumentReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import dynamicNumber from './DynamicNumberReducer';
import entry from './EntryReducer';
import error from './ErrorReducer';
import group from './GroupReducer';
import identifierType from './IdentifierTypesReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import login from './LoginReducer';
import map from './Map';
import massif from './MassifReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntry from './RandomEntryReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import subject from './SubjectReducer';

//
//
// M A I N - R E D U C E R
//
//

const GCReducer = combineReducers({
  advancedsearch,
  cave,
  caver,
  caverGroups,
  createCaver,
  createOrganization,
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
  login,
  map,
  massif,
  pageTitle,
  partnersCarousel,
  processDocuments,
  projections,
  quicksearch,
  randomEntry,
  region,
  sideMenu,
  subject,
});

export default GCReducer;
