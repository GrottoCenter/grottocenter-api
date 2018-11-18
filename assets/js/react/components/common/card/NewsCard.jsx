import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import {DYNAMIC_NEWS_RELOAD_INTERVAL} from '../../../conf/Config';
import Button from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import SyncIcon from '@material-ui/icons/Sync';
import SyncKOIcon from '@material-ui/icons/SyncProblem';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import {DateRibbon} from '../Toolbox';
import GCLink from '../GCLink';
import styled from 'styled-components';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledCardMedia = withStyles({
  root: {
    height: '150px'
  }
})(CardMedia);

const StyledCardContent = withStyles({
  root: {
    minHeight: '150px',
    textAlign: 'justify'
  }
})(CardContent);

const StyledCardActions = withStyles({
  root: {
    justifyContent: 'flex-end'
  }
})(CardActions);

const StyledCard = withStyles(theme => ({
  root: {
    '&:nth-child(n+1)': {
      marginTop: '4%',
      [theme.breakpoints.up('550')]: {
        marginTop: '0'
      }
    }
  }
}), { withTheme: true })(Card);

const StyledActionCard = styled(StyledCard)`
  text-align: center !important;
`;

const StyledSyncIcon = withStyles(theme => ({
  root: {
    '&:hover': {
      fill: theme.palette.accent1Color
    },
    fill: theme.palette.primary3Color
  }
}), { withTheme: true })(SyncIcon);

const StyledSyncKOIcon = withStyles(theme => ({
  root: {
    '&:hover': {
      fill: theme.palette.accent1Color
    },
    fill: theme.palette.primary3Color
  }
}), { withTheme: true })(SyncKOIcon);

const StyledImageLoupe = withStyles(theme => ({
  root: {
    fill: theme.palette.accent1Color
  }
}), { withTheme: true })(ImageLoupe);

const StyledTitleTypography = withStyles({
  root: {
    fontSize: '24px',
    minHeight: '60px'
  }
})(Typography);

const StyledBodyTypography = withStyles({
  root: {
    fontSize: '14px',
    textAlign: 'justify'
  }
})(Typography);

//
//
// M A I N - C O M P O N E N T
//
//

class NewsCard extends Component {
  constructor(props) {
    super(props);
    props.init();
    props.refresh()
  }

  componentDidMount() {
    this.interval = setInterval(() => this.props.refresh(), DYNAMIC_NEWS_RELOAD_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    if (this.props.showSpinner && !this.props.text) {
      return (
        <StyledActionCard>
          <StyledSyncIcon />
        </StyledActionCard>
      );
    }

    if (!this.props.showSpinner && !this.props.text) {
      return (
        <StyledActionCard>
          <StyledSyncKOIcon />
        </StyledActionCard>
      );
    }

    return (
      <StyledCard>
        <StyledCardMedia image='images/homepage/news.jpg' />
        {this.props.day && this.props.month && <DateRibbon day={this.props.day} month={this.props.month}/>}
        <StyledCardContent>
          <StyledTitleTypography gutterBottom component="h3">
            {this.props.title}
            </StyledTitleTypography>
          <StyledBodyTypography component="p">
            {this.props.text}
            </StyledBodyTypography>
        </StyledCardContent>
        <Divider/>
        {this.props.linkMore && (
          <StyledCardActions>
            <GCLink href={this.props.linkMore}>
              <Button>
                <StyledImageLoupe />
              </Button>
            </GCLink>
          </StyledCardActions>
        )}
      </StyledCard>
    );
  }
}

NewsCard.propTypes = {
  showSpinner: PropTypes.bool,
  day: PropTypes.any,
  month: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  linkMore: PropTypes.string,
  init: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired
};

export default NewsCard;
