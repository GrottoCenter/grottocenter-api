import React from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormLabel, Switch } from '@material-ui/core';

import Translate from '../../../Translate';

const IsFromBBSSwitch = ({ isFromBbs, onIsFromBbsChange }) => {
  const handleIsFromBbsChange = (event) => {
    onIsFromBbsChange(event.target.checked);
  };

  return (
    <FormControl variant="filled">
      <FormLabel>
        <Switch
          checked={isFromBbs}
          onChange={handleIsFromBbsChange}
          value={isFromBbs}
        />
        <Translate>
          {isFromBbs
            ? 'The document is from the BBS ("Bulletin Bibliographique Spéléologique" in french)'
            : 'The document is not from the BBS ("Bulletin Bibliographique Spéléologique" in french)'}
        </Translate>
      </FormLabel>
    </FormControl>
  );
};

IsFromBBSSwitch.propTypes = {
  isFromBbs: PropTypes.bool.isRequired,
  onIsFromBbsChange: PropTypes.func.isRequired,
};

export default IsFromBBSSwitch;
