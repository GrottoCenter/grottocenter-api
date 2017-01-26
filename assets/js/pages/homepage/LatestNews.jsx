import React, {PropTypes} from 'react';
import {Card, CardMedia, CardTitle, CardText, CardActions} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import ImageLoupe from 'material-ui/svg-icons/image/loupe';
import Divider from 'material-ui/Divider';
import muiThemeable from 'material-ui/styles/muiThemeable';
import I18n from 'react-ghost-i18n';
import DateRibbon from '../../widgets/DateRibbon';

const LatestNews = (props) => (
  <div>
    <div role="section" className="lastNews" style={{fontFamily: props.muiTheme.fontFamily}}>
      <h3><I18n>News</I18n></h3>
      <div className="container">
        <div className="row">
          <div className="six columns">
            <Card className="newsCard">
              <CardMedia>
                <img src="https://2.bp.blogspot.com/-i_UrbimyRqg/WA7pEX7xFRI/AAAAAAAAYa0/_KbHQTfhvbk59aTgP3QKZFKcm0BqQnYeQCLcB/s1600/sidney.PNG" />
              </CardMedia>
              <DateRibbon day="25" month="Oct"/>
              <CardTitle>Speleo 2017 à Sidney</CardTitle>
              <CardText>Alors que l'IUS prépare un programme scientifique de très haut niveau sur des thèmes de recherche liés au monde souterrain, l'Australian Speleological Federation Inc (ASF)...</CardText>
              <Divider/>
              <CardActions style={{'textAlign': 'right'}}>
                <FlatButton icon={<ImageLoupe color={props.muiTheme.palette.accent1Color} />} href="http://blog-fr.grottocenter.org/2016/10/speleo-2017a-sidney.html"/>
              </CardActions>
            </Card>
          </div>
          <div className="six columns">
            <Card className="newsCard">
              <CardMedia>
                <img src="https://4.bp.blogspot.com/-kdKjJclWCuw/V9wH7ywdFsI/AAAAAAAAYRU/GhVfUEmwtfcOKUKjkQjhtZAsJDJLMdTvQCLcB/s320/header.png" />
              </CardMedia>
              <DateRibbon day="16" month="Sep"/>
              <CardTitle>STRISCIANDO-MAJELLA 2016</CardTitle>
              <CardText>Vous êtes invités à participer aux Rencontre Nationale de Spéléologie italien qui se tiennent sous le patronage de la Fédération Spéléologique Européenne FSE.</CardText>
              <Divider/>
              <CardActions style={{'textAlign': 'right'}}>
                <FlatButton icon={<ImageLoupe color={props.muiTheme.palette.accent1Color} />} href="http://blog-fr.grottocenter.org/2016/09/strisciando-majella-2016.html"/>
              </CardActions>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);

LatestNews.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(LatestNews);
