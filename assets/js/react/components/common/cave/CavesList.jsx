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
  const { caves, title, emptyMessageComponent } = props;

  return (
    <div>
      {caves.length > 0 ? (
        <>
          {title}
          <StyledList>
            {caves
              .sort((a, b) => a.name > b.name)
              .map((cave) => (
                <CaveListItem key={cave.id} cave={cave} />
              ))}
          </StyledList>
        </>
      ) : (
        <>
          {title}
          <br />
          <em>{emptyMessageComponent}</em>
        </>
      )}
    </div>
  );
};

CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
};

CavesList.defaultProps = {
  caves: undefined,
  title: (
    <strong>
      <Translate>Caves list</Translate>
    </strong>
  ),
  emptyMessageComponent: <Translate>Empty list</Translate>,
};

export default CavesList;
