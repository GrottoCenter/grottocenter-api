import {combineReducers} from 'redux';
import {caves, entries, grottos, marker} from './SearchReducer';
import {currentLanguage} from './LanguageReducer';
import {latestBlogNews} from './LatestBlogNewsReducer';

const GCReducer = combineReducers({
  currentLanguage,
  caves,
  entries,
  grottos,
  marker,
  latestBlogNews
});

export default GCReducer;
