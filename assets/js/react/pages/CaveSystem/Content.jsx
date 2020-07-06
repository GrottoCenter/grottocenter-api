import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import { Typography } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import ScrollableContent from '../../components/common/Layouts/Fixed/ScrollableContent';

const Content = ({ title, children }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({ id: title })}
      content={
        isNil(children) ? (
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            mattis pretium massa. Aliquam erat volutpat. Nulla facilisi. Donec
            vulputate interdum sollicitudin. Nunc lacinia auctor quam sed
            pellentesque. Aliquam dui mauris, mattis quis lacus id, pellentesque
            lobortis odio.
          </Typography>
        ) : (
          children
        )
      }
    />
  );
};

Content.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Content;
