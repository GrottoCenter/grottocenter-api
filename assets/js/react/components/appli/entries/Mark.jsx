import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography/Typography';
import { Star, StarHalf } from '@material-ui/icons/';
//import 'typeface-roboto';

const NameMark = withStyles(
  (theme) => ({
    root: {
      margin: 'auto',
      fontWeight: '400',
      textAlign: 'center',
      color: '#333',
    },
  }),
  { withTheme: true },
)(Typography);

const MarkContainer = withStyles(
  (theme) => ({
    root: {
      minWidth: '120px',
      maxWidth: '30%',
      display: 'inline-block',
      margin: 'auto',
      marginRight: '20px',
    },
  }),
  { withTheme: true },
)(Typography);

const StarContainer = withStyles(
  (theme) => ({
    root: {
      marginTop: '5px',
      fontWeight: '400',
      textAlign: 'center',
      margin: 'auto',
      color: '#333',
    },
  }),
  { withTheme: true },
)(Typography);

const YellowStar = withStyles(
  (theme) => ({
    root: {
      color: '#f39c12',
    },
  }),
  { withTheme: true },
)(Star);

const YellowStarHalf = withStyles(
  (theme) => ({
    root: {
      color: '#f39c12',
    },
  }),
  { withTheme: true },
)(StarHalf);

const GreyStar = withStyles(
  (theme) => ({
    root: {
      color: '#bdc3c7',
    },
  }),
  { withTheme: true },
)(Star);

class Mark extends React.Component {
  componentDidMount() {
    const name = this.props.name;
    const mark = this.props.mark;
    // TODO Get entry details using REST
  }

  render() {
    // Name of the mark for example: "Difficulty" and a mark rated between 0 and 5
    const name = this.props.name;
    const mark = this.props.mark;
    // https://wiki.grottocenter.org/wiki/Fr/0006077

    return (
      <MarkContainer component="div">
        <NameMark component="span">{name}</NameMark>
        <StarContainer component="div">
          <YellowStar />
          <YellowStar />
          <YellowStarHalf />
          <GreyStar />
          <GreyStar />
        </StarContainer>
      </MarkContainer>
    );
  }
}

export default Mark;
