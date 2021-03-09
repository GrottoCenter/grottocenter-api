import {
  LOAD_ENTRY_SUCCESS,
  LOAD_ENTRY_ERROR,
  LOAD_ENTRY_LOADING,
} from '../actions/Entry';

// remove once api give the information
const today = new Date();

const initialState = {
  data: {
    id: 1,
    name: 'Name',
    country: 'Country',
    region: 'Region',
    city: 'City',
    latitude: null,
    longitude: null,
    cave: {
      dateInscription: today.toISOString().substring(0, 10),
    },
    massif: {},
  },
  loading: false,
  error: null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_ENTRY_LOADING:
      return {
        ...state,
        error: null,
        loading: true,
      };
    case LOAD_ENTRY_SUCCESS:
      return {
        ...initialState,
        data: action.data,
      };
    case LOAD_ENTRY_ERROR:
      return {
        ...state,
        loading: true,
        error: action.error,
      };
    default:
      return state;
  }
};

export default reducer;
