import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';
import muiThemeable from 'material-ui/styles/muiThemeable';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import {Card, CardTitle, CardText} from 'material-ui/Card';
import GCLink from './GCLink';
import {pftGdLink, contributorsLink, contributeLinks} from '../Config';

const Faq = (props) => (
  <div className='collapsible_faq' style={{color: props.muiTheme.palette.textIconColor}}>
    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>I would like to share some of  my work but some caves should remain protected How  are you planning to protect them ?</I18n>
      </CardTitle >

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <I18n>Here   is the procedure that  will be implemented in next version of Grottocenter  Is that acceptable for you?</I18n>
        <br/>
        <GCLink href={pftGdLink} alt='Link to google document'>
          {pftGdLink}
        </GCLink>
      </CardText>
    </Card>

    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>How can you guarantee the quality of the data  on Grottocenter ?</I18n>
      </CardTitle>

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <I18n>The Wikicaves association has signed partnership with clubs and federations which provide data and which are informed of all the actions carried out besides we  have routine programmes that  regularly  check the quality of the data</I18n>
      </CardText>
    </Card>

    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>I find your project interesting:  How  can I  help ?</I18n>
      </CardTitle>

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <ul className="listing">
          <li>
            <CheckIcon color={props.muiTheme.palette.accent1Color}/>
            <I18n>You can show your support by  joining  Grottocenter <GCLink href={contributeLinks} alt='Link to become a member'>as active member</GCLink></I18n>
          </li>
          <li>
            <CheckIcon color={props.muiTheme.palette.accent1Color}/>
              <I18n>Here is another way: In order to share with the greatest number, we are  always  <GCLink href={contributeLinks} alt='Link to become a translator'>looking for translators</GCLink></I18n>
          </li>
          <li>
            <CheckIcon color={props.muiTheme.palette.accent1Color}/>
              <I18n>If you have programming skills how about  <GCLink href={contributeLinks} alt='Link to become a developer'>joining our team of developpers</GCLink></I18n>
          </li>
          <li>
            <CheckIcon color={props.muiTheme.palette.accent1Color}/>
              <I18n>As a group, a club or  federation,  <GCLink href={contributeLinks} alt='Link to become a partner'>you can be  one of our partners</GCLink> : The project will move on thanks to  organizations such as yours</I18n>
          </li>
        </ul>
      </CardText>
    </Card>

    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>One of my caving  buddies  told me I should NOT  post anything at  all on Grottocenter That sometimes makes it  hard to contribute !</I18n>
      </CardTitle>

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <I18n>Yes, it may be  very difficult!!!!  But perhaps  we should all  be aware that  the world  is  changing</I18n>
      </CardText>
    </Card>

    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>Who are  you  at  Grottocenter ?</I18n>
      </CardTitle>

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <I18n>We have our  wiki:  this is where you can find us</I18n>
        <br/>
        <GCLink href={contributorsLink} alt='Link to contribution page'>
          {contributorsLink}
        </GCLink>
      </CardText>
    </Card>

    <Card className="faqCard" style={{backgroundColor: props.muiTheme.palette.secondary1Color}}>
      <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: props.muiTheme.palette.textIconColor}}>
        <I18n>I want to share my data only with fellow cavers Is it possible on Grottocenter?</I18n>
      </CardTitle>

      <CardText expandable={true} style={{backgroundColor: props.muiTheme.palette.textIconColor}}>
        <I18n>I want to share my data only with fellow cavers Is it possible on Grottocenter?</I18n>
        <br/>
        <I18n>Data, on Grottocenter,  is placed under free licence, it is accessible to all those who may need  it</I18n>
      </CardText>
    </Card>
  </div>
);

Faq.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Faq);
