import {combineReducers} from 'redux';
import {caves, entries, grottos, marker} from './SearchReducer';
import {currentLanguage} from './LanguageReducer';
import {lastBlogNews} from './LastBlogNewsReducer';

const GCReducer = combineReducers({
  currentLanguage,
  caves,
  entries,
  grottos,
  marker,
  lastBlogNews
});

export default GCReducer;
