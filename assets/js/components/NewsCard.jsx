import React, {Component, PropTypes} from 'react';
import {Card, CardMedia, CardTitle, CardText, CardActions} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import ImageLoupe from 'material-ui/svg-icons/image/loupe';
import SyncIcon from 'material-ui/svg-icons/notification/sync';
import SyncKOIcon from 'material-ui/svg-icons/notification/sync-problem';
import Divider from 'material-ui/Divider';
import muiThemeable from 'material-ui/styles/muiThemeable';
import {DateRibbon} from './Toolbox';
import GCLink from './GCLink';

class NewsCard extends Component {
  constructor(props) {
    super(props);
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
        <CardTitle>{this.props.title}</CardTitle>
        <CardText>{this.props.text}</CardText>
        <Divider/>
        {this.props.linkMore && <CardActions style={{'textAlign': 'right'}}>
          <FlatButton>
            <GCLink href={this.props.linkMore}>
              <ImageLoupe color={this.props.muiTheme.palette.accent1Color} />
            </GCLink>
          </FlatButton>
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
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(NewsCard);
