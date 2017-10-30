import React, {Component, PropTypes} from 'react';
import {Card, CardMedia, CardTitle, CardText, CardActions} from 'material-ui/Card';
import {DYNAMIC_NEWS_RELOAD_INTERVAL} from '../../../conf/Config';
import FlatButton from 'material-ui/FlatButton';
import ImageLoupe from 'material-ui/svg-icons/image/loupe';
import SyncIcon from 'material-ui/svg-icons/notification/sync';
import SyncKOIcon from 'material-ui/svg-icons/notification/sync-problem';
import Divider from 'material-ui/Divider';
import muiThemeable from 'material-ui/styles/muiThemeable';
import {DateRibbon} from '../Toolbox';
import GCLink from '../GCLink';

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
        <Card style={{'textAlign': 'center'}} className="newsCard">
          <SyncIcon color={this.props.muiTheme.palette.primary3Color} hoverColor={this.props.muiTheme.palette.accent1Color} />
        </Card>
      );
    }
    if (!this.props.showSpinner && !this.props.text) {
      return (
        <Card style={{'textAlign': 'center'}} className="newsCard">
          <SyncKOIcon color={this.props.muiTheme.palette.primary3Color} hoverColor={this.props.muiTheme.palette.accent1Color} />
        </Card>
      );
    }
    return (
      <Card className="newsCard">
        <CardMedia>
          <img src='images/homepage/news.jpg' />
        </CardMedia>
        {this.props.day && this.props.month && <DateRibbon day={this.props.day} month={this.props.month}/>}
        <CardTitle title={this.props.title}/>
        <CardText style={{textAlign: "justify"}}>{this.props.text}</CardText>
        <Divider/>
        {this.props.linkMore && <CardActions style={{'textAlign': 'right'}}>
          <GCLink href={this.props.linkMore}>
            <FlatButton icon={<ImageLoupe color={this.props.muiTheme.palette.accent1Color} />} />
          </GCLink>
        </CardActions>}
      </Card>
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
  muiTheme: PropTypes.object.isRequired,
  init: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired
};

export default muiThemeable()(NewsCard);
