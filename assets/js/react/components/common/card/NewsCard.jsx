import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardTitle from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import CardText from '@material-ui/core/CardContent';
import {DYNAMIC_NEWS_RELOAD_INTERVAL} from '../../../conf/Config';
import FlatButton from '@material-ui/core/Button';
import ImageLoupe from '@material-ui/icons/Loupe';
import SyncIcon from '@material-ui/icons/Sync';
import SyncKOIcon from '@material-ui/icons/SyncProblem';
import Divider from '@material-ui/core/Divider';
import { withTheme } from '@material-ui/core/styles';
import {DateRibbon} from '../Toolbox';
import GCLink from '../GCLink';
import styled from 'styled-components';

const CardTextStl = styled(CardText)`
    min-height: 150px;
    textAlign: justify !important;
`;

const CardActionsStl = styled(CardActions)`
  text-align: right !important;
`;

const CardStl = styled(Card)`
  :nth-child(n+1) {
    margin-top: 4%;

    @media (min-width: 550px) {
      margin-top: 0;
    }
  }
`;

const ActionCardStl = styled(CardStl)`
  text-align: center !important;
`;

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
        <ActionCardStl>
          <SyncIcon color={this.props.theme.palette.primary3Color} hoverColor={this.props.theme.palette.accent1Color} />
        </ActionCardStl>
      );
    }
    if (!this.props.showSpinner && !this.props.text) {
      return (
        <ActionCardStl>
          <SyncKOIcon color={this.props.theme.palette.primary3Color} hoverColor={this.props.theme.palette.accent1Color} />
        </ActionCardStl>
      );
    }
    return (
      <CardStl>
        <CardMedia>
          <img src='images/homepage/news.jpg' />
        </CardMedia>
        {this.props.day && this.props.month && <DateRibbon day={this.props.day} month={this.props.month}/>}
        <CardTitle title={this.props.title}/>
        <CardTextStl>{this.props.text}</CardTextStl>
        <Divider/>
        {this.props.linkMore && <CardActionsStl>
          <GCLink href={this.props.linkMore}>
            <FlatButton icon={<ImageLoupe color={this.props.theme.palette.accent1Color} />} />
          </GCLink>
        </CardActionsStl>}
      </CardStl>
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
  theme: PropTypes.object.isRequired,
  init: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired
};

export default withTheme()(NewsCard);
