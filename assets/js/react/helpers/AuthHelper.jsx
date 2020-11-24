import { decode } from 'jsonwebtoken';
import { identificationTokenName } from '../conf/Config';

// =========================================

export const setAuthToken = (token) => {
  window.localStorage.setItem(identificationTokenName, token);
};

export const getAuthToken = () => {
  return window.localStorage.getItem(identificationTokenName);
};

export const getAuthHTTPHeader = () => {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
  };
};

const hasRole = (roleName) => {
  const authToken = getAuthToken();
  if (authToken === null) return false;
  const decodedToken = decode(authToken);
  return decodedToken.groups.some((g) => g.name === roleName);
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

export const isTokenExpired = () => {
  try {
    const decoded = decode(getAuthToken());
    if (decoded.exp < Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const removeAuthToken = () => {
  window.localStorage.removeItem(identificationTokenName);
};

export default function isAuth() {
  return getAuthToken() != null;
}
