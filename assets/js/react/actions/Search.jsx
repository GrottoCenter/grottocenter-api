export const startSearch = (value) => {
    return {
        type: 'START_SEARCH',
        value: value
    }
};

export const loadCaveSuccess = (data) => {
    return {
        type: 'LOAD_CAVE_SUCCESS',
        data: data
    }
};

export const loadEntrySuccess = (data) => {
    return {
        type: 'LOAD_ENTRY_SUCCESS',
        data: data
    }
};

export const loadGrottoSuccess = (data) => {
    return {
        type: 'LOAD_GROTTO_SUCCESS',
        data: data
    }
};

export const showMarker = (entry) => {
    return {
        type: 'SHOW_MARKER',
        entry: entry
    }
};
