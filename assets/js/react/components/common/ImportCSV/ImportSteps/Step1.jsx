import React, { useContext } from 'react';
import ImportKarstlinkInfo from '../ImportKarstlinkInfo';
import { ImportPageContentContext } from '../Provider';

const Step1 = () => {
  const { selectedType } = useContext(ImportPageContentContext);

  return <ImportKarstlinkInfo selectType={selectedType} />;
};
Step1.propTypes = {};

export default Step1;
