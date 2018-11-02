import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SyncIcon from '@material-ui/icons/Sync';
import styled from 'styled-components';

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

const GoalText = styled.span`
  display: none !important; // lesshint importantRule: false
`;

class Goal extends Component {
  constructor(props) {
    super(props);
  }

  handleMouseOver() {
    this.props.updateTargetZone(this.props.entry.description);
  }

  handleMouseOut() {
    this.props.updateTargetZone(this.props.title);
  }

  render() {
    return (
      <div className={this.props.className}
        onMouseOver={(event) => this.handleMouseOver(event)}
        onMouseOut={(event) => this.handleMouseOut(event)}>
        <span style={{color: this.props.textColor}}>
          {this.props.entry.word}
        </span>
        <SyncIcon color={this.props.iconColor} hoverColor={this.props.iconHoverColor} />
        <GoalText>
          {this.props.entry.description}
        </GoalText>
      </div>
    );
  }
}

Goal.propTypes = {
  className: PropTypes.string.isRequired,
  title: PropTypes.element.isRequired,
  entry: PropTypes.object.isRequired,
  textColor: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  iconHoverColor: PropTypes.string.isRequired,
  updateTargetZone: PropTypes.func.isRequired
};

const GoalWrapper = styled(Goal)`
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

    svg {
      width: 180px !important; // lesshint importantRule: false
      height: 180px !important; // lesshint importantRule: false
      top: -57px;
      left: -26px;
      position: absolute;
      opacity: 0.2;
    }

    svg:hover {
      transform: rotate(-135deg) scale(1.2, 1.2);
      opacity: 0.6;
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

class AssociationFlyingGoals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      targetZone: this.props.title
    };
  }

  render () {
    return (
      <div>
        <CenteredText>
          <span ref={(element) => {this.targetZone = element;}} >
            {this.state.targetZone}
          </span>
        </CenteredText>
        <FlyingGoals>
          {this.props.entries.map((entry, i) => {
            return (
              <GoalWrapper
                key={i}
                entry={entry}
                updateTargetZone={(text) => {this.setState({targetZone: text});}}
                {...this.props} />
            );
          })}
        </FlyingGoals>
      </div>
    );
  }
}

AssociationFlyingGoals.propTypes = {
  entries: PropTypes.array.isRequired,
  title: PropTypes.element.isRequired
};

export default AssociationFlyingGoals;
