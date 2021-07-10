import { useSelector } from 'react-redux';

// eslint-disable-next-line import/prefer-default-export
export function useUserProperties() {
  const authState = useSelector((state) => state.login);
  return authState.authTokenDecoded;
}
