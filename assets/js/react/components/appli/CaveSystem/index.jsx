import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntriesMap from './EntriesMap';
import Provider, { CaveContext, caveTypes } from './Provider';
import Properties from './Properties';

const Content = () => (
  <>
    <EntriesMap />
    <Properties />
  </>
);

export const CaveSystem = ({ children }) => {
  const { formatMessage } = useIntl();
  const {
    state: {
      cave: { name, author, creationDate, lastEditor, editionDate },
    },
  } = useContext(CaveContext);

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
          content={<Content />}
          footer={footer}
          icon={<CustomIcon type="cave_system" />}
        />
      }
    >
      {children}
    </Layout>
  );
};

const HydratedCaveSystem = ({ children, ...props }) => (
  <Provider {...props}>
    <CaveSystem>{children}</CaveSystem>
  </Provider>
);

CaveSystem.propTypes = {
  children: PropTypes.node.isRequired,
};

HydratedCaveSystem.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default HydratedCaveSystem;
