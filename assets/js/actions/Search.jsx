export const startSearch = (value) => {
    return {
        type: 'START_SEARCH',
        value: value
    }
}

export const loadCaveSuccess = (data) => {
    return {
        type: 'LOAD_CAVE_SUCCESS',
        data: data
    }
}

export const loadEntrySuccess = (data) => {
    return {
        type: 'LOAD_ENTRY_SUCCESS',
        data: data
    }
}
