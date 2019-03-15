import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import CaveListItem from './CaveListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
  },
})(List);

const CavesList = (props) => {
  const {
    caves,
    title,
    emptyMessage,
  } = props;

  return (
    <div>
      { caves.length > 0
        ? (
          <React.Fragment>
            <strong>{title}</strong>
            <StyledList>
              { caves
                .sort((a, b) => a.name > b.name)
                .map(cave => (
                  <CaveListItem key={cave.id} cave={cave} />
                )) }
            </StyledList>
          </React.Fragment>
        ) : (
          <em>{emptyMessage}</em>
        )
     }
    </div>
  );
};

CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.node,
  emptyMessage: PropTypes.node,
};

CavesList.defaultProps = {
  caves: undefined,
  title: <Translate>Caves list</Translate>,
  emptyMessage: <Translate>Empty list</Translate>,
};

export default CavesList;
