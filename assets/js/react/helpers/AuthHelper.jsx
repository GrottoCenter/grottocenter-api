import { identificationTokenName } from '../conf/Config';

export default function isAuth() {
  // Just check if there is a token
  return window.localStorage.getItem(identificationTokenName) != null;
}
