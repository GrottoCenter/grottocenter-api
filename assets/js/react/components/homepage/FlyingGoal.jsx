import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import styled from 'styled-components';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const GoalText = styled.span`
  display: none !important; // lesshint importantRule: false
`;

const StyledSyncIcon = withStyles(
  (theme) => ({
    root: {
      fill: theme.palette.iconColor,
      transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
      '&:hover': {
        fill: theme.palette.accent1Color,
      },
      [theme.breakpoints.up('550')]: {
        width: '180px',
        height: '180px',
        top: '-57px',
        left: '-26px',
        position: 'absolute',
        opacity: '0.2',
        '&:hover': {
          transform: 'rotate(-135deg) scale(1.2, 1.2)',
          opacity: '0.6',
        },
      },
    },
  }),
  { withTheme: true },
)(SyncIcon);

//
//
// M A I N - C O M P O N E N T
//
//

class Goal extends Component {
  handleMouseOver() {
    const { updateTargetZone, entry } = this.props;
    updateTargetZone(entry.description);
  }

  handleMouseOut() {
    const { updateTargetZone, title } = this.props;
    updateTargetZone(title);
  }

  render() {
    const { className, textColor, entry } = this.props;
    return (
      <div
        className={className}
        onMouseOver={(event) => this.handleMouseOver(event)}
        onMouseOut={(event) => this.handleMouseOut(event)}
        onFocus={(event) => this.handleMouseOver(event)}
        onBlur={(event) => this.handleMouseOut(event)}
      >
        <span style={{ color: textColor }}>{entry.word}</span>
        <StyledSyncIcon />
        <GoalText>{entry.description}</GoalText>
      </div>
    );
  }
}

Goal.propTypes = {
  className: PropTypes.string.isRequired,
  title: PropTypes.element.isRequired,
  entry: PropTypes.shape({
    description: PropTypes.shape({}),
    word: PropTypes.shape({}),
  }).isRequired,
  textColor: PropTypes.string.isRequired,
  updateTargetZone: PropTypes.func.isRequired,
};

export default Goal;
