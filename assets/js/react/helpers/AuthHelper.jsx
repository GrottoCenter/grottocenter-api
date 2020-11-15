import { pathOr } from 'ramda';

// =========================================

const hasRole = (authState, roleName) => {
  const groups = pathOr(null, ['authTokenDecoded', 'groups'], authState);
  if (groups === null) return false;
  return groups.some((g) => g.name === roleName);
};

export const isUserAdmin = (authState) => {
  return hasRole(authState, 'Administrator');
};

export const isUserModerator = (authState) => {
  return hasRole(authState, 'Moderator');
};

export const isUser = () => {
  return hasRole('User');
};

export const isAdmin = () => {
  return hasRole('Administrator');
};

export const isModerator = () => {
  return hasRole('Moderator');
};

export const isTokenExpired = (authState) => {
  try {
    if (authState.authTokenDecoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const isUserAuth = (authState) => {
  return authState.authTokenDecoded !== null;
};
