export const SET_ERROR = 'SET_ERROR';
export const CLEAN_ERROR = 'CLEAN_ERROR';

export const setError = (error) => ({
  type: SET_ERROR,
  error,
});

export const cleanError = () => ({
  type: CLEAN_ERROR,
});
