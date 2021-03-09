import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import Provider, { detailsType, EntryContext } from './Provider';
import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntryMap from './EntryMap';
import Properties from './Properties';

const EntryProperties = () => (
  <>
    <EntryMap />
    <Properties />
  </>
);

export const Entry = ({ children }) => {
  const { formatMessage } = useIntl();
  const {
    state: {
      details: { name, author, creationDate, lastEditor, editionDate },
    },
  } = useContext(EntryContext);

  const footer = `${formatMessage({ id: 'Created by' })}
        ${author} (${creationDate})
        ${lastEditor &&
          editionDate &&
          ` - ${formatMessage({
            id: 'Last modification by',
          })} - ${lastEditor} (
          ${editionDate})`}`;

  return (
    <Layout
      fixedContent={
        <FixedContent
          title={name || ''}
          content={<EntryProperties />}
          footer={footer}
          icon={<CustomIcon type="entry" />}
        />
      }
    >
      {children}
    </Layout>
  );
};

const HydratedEntry = ({ children, ...props }) => (
  <Provider {...props}>
    <Entry>{children}</Entry>
  </Provider>
);

Entry.propTypes = {
  children: PropTypes.node.isRequired,
};

HydratedEntry.propTypes = {
  details: detailsType.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default HydratedEntry;
