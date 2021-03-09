import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import FlyingGoal from './FlyingGoal';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FlyingGoals = styled.div`
  display: none;
  margin-top: 50px;

  @media (min-width: 550px) {
    display: block;
    height: 450px;
    margin-top: -160px;
  }
`;

const CenteredText = styled.div`
  display: none;
  text-align: center;
  font-weight: 300;

  :before {
    content: '';
    display: inline-block;
    height: 100%;
    vertical-align: middle;
  }

  span {
    display: inline-block;
    vertical-align: middle;
  }

  @media (min-width: 550px) {
    display: inline-block;
    position: relative;
    top: 140px;
    left: ~'calc((100% - 200px) / 2)';
    width: 200px;
    height: 150px;
    font-size: 1.05em;
  }
`;

const GoalWrapper = styled(FlyingGoal)`
  @media (min-width: 550px) {
    position: absolute;
    width: 129px;
    text-align: center;
    float: left;
    font-size: 1.3em;
    font-weight: 400;

    & > span {
      display: block;
      padding: 20px 0;
      text-align: center;
    }

    & > span:first-child {
      white-space: nowrap;
    }

    &:nth-child(1) {
      left: calc(((100% - 120px) / 2) - 100px);
      bottom: 25px;
    }

    &:nth-child(2) {
      left: calc(((100% - 180px) / 2) - 160px);
      bottom: 230px;
    }

    &:nth-child(3) {
      left: calc((100% - 120px) / 2);
      bottom: 350px;
    }

    &:nth-child(4) {
      left: calc(((100% - 70px) / 2) + 160px);
      bottom: 230px;
    }

    &:nth-child(5) {
      left: calc(((100% - 120px) / 2) + 100px);
      bottom: 25px;
    }
  }
`;

//
//
// M A I N - C O M P O N E N T
//
//

class AssociationFlyingGoals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      targetZone: this.props.title,
    };
  }

  render() {
    return (
      <div>
        <CenteredText>
          <span
            ref={(element) => {
              this.targetZone = element;
            }}
          >
            {this.state.targetZone}
          </span>
        </CenteredText>
        <FlyingGoals>
          {this.props.entries.map((entry, i) => (
            <GoalWrapper
              key={i}
              entry={entry}
              updateTargetZone={(text) => {
                this.setState({ targetZone: text });
              }}
              {...this.props}
            />
          ))}
        </FlyingGoals>
      </div>
    );
  }
}

AssociationFlyingGoals.propTypes = {
  entries: PropTypes.array.isRequired,
  title: PropTypes.element.isRequired,
};

export default AssociationFlyingGoals;
