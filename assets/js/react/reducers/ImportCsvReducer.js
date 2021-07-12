import {
    CHECK_ROWS_FAILURE,
    CHECK_ROWS_SUCCESS,
    CHECK_ROWS_START,
    IMPORT_ROWS_START,
    IMPORT_ROWS_FAILURE,
    IMPORT_ROWS_SUCCESS,
    RESET_IMPORT_STATE
} from '../actions/ImportCsv';


const initialState = {
    isLoading: false,
    error: null,
    resultCheck: {
        willBeCreated: null,
        wontBeCreated: null,
    },
    resultImport: null,
};

const importCsv = (state = initialState, action) => {
    switch(action.type){
        case CHECK_ROWS_START:
            return {
                ...state,
                isLoading: true,
            };

        case CHECK_ROWS_SUCCESS:
            return {
                ...state,
                isLoading: false,
                resultCheck: action.result,
            };

        case CHECK_ROWS_FAILURE:
            return {
                ...state,
                isLoading: false,
                error: action.error,
            };

        case IMPORT_ROWS_START:
            return {
                ...state,
                isLoading: true,
            };

        case IMPORT_ROWS_SUCCESS:
            return {
                ...initialState,
                resultImport: action.result,
            };

        case IMPORT_ROWS_FAILURE:
            return {
                ...state,
                isLoading: false,
                error: action.error
            };
        case RESET_IMPORT_STATE:
            return {
                ...initialState,
            }

        default:
            return state;
    }
};


export default importCsv;