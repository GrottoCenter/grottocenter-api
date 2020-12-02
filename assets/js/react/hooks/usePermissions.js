import { useSelector } from 'react-redux';

import { pathOr } from 'ramda';

// =========================================

const isTokenExpired = (authState) => {
  try {
    if (authState.authTokenDecoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

const hasRole = (authState, roleName) => {
  const groups = pathOr(null, ['authTokenDecoded', 'groups'], authState);
  if (groups === null) return false;
  return groups.some((g) => g.name === roleName);
};

// eslint-disable-next-line import/prefer-default-export
export function usePermissions() {
  const authState = useSelector((state) => state.auth);
  return {
    isAdmin: hasRole(authState, 'Administrator'),
    isAuth: authState.authTokenDecoded !== null && !isTokenExpired(),
    isModerator: hasRole(authState, 'Moderator'),
    isTokenExpired: isTokenExpired(),
    isUser: hasRole(authState, 'User'),
  };
}
