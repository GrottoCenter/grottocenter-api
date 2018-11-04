import React, {PropTypes} from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import {Card, CardTitle, CardText} from 'material-ui/Card';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {pftGdLink, contributorsLink, contributeLinks} from '../../conf/Config';
import Translate from "../common/Translate";

const Faq = ({ muiTheme }) => {
  const contributeLink = (contributeLinks[locale] !== undefined) ? contributeLinks[locale] : contributeLinks['*'];

  return (
    <div className='collapsible_faq' style={{color: muiTheme.palette.textIconColor}}>
      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="I would like to share some of  my work but some caves should remain protected How  are you planning to protect them ?" />
        </CardTitle >

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <Translate id="Here   is the procedure that  will be implemented in next version of Grottocenter  Is that acceptable for you?" />
          <br/>
          <GCLink href={pftGdLink} alt='Link to google document'>
            {pftGdLink}
          </GCLink>
        </CardText>
      </Card>

      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="How can you guarantee the quality of the data  on Grottocenter ?" />
        </CardTitle>

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <Translate id="The Wikicaves association has signed partnership with clubs and federations which provide data and which are informed of all the actions carried out besides we  have routine programmes that  regularly  check the quality of the data" />
        </CardText>
      </Card>

      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="I find your project interesting:  How  can I  help ?" />
        </CardTitle>

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <ul className="listing">
            <li>
              <CheckIcon color={muiTheme.palette.accent1Color}/>
              <Translate
                id="You can show your support by  joining  Grottocenter {0}"
                values={{
                  0: <GCLink href={contributeLink} alt='Link to become a member'><Translate id="as active member" /></GCLink>
                }}
              />
            </li>
            <li>
              <CheckIcon color={muiTheme.palette.accent1Color}/>
                <Translate
                  id="Here is another way: In order to share with the greatest number, we are  always  {0}"
                  values={{
                    0: <GCLink href={contributeLink} alt='Link to become a translator'><Translate id="looking for translators" /></GCLink>
                  }}
                />
            </li>
            <li>
              <CheckIcon color={muiTheme.palette.accent1Color}/>
              <Translate
                id="If you have programming skills how about  {0}"
                values={{
                  0: <GCLink href={contributeLink} alt='Link to become a developer'><Translate id="joining our team of developpers" /></GCLink>
                }}
              />
            </li>
            <li>
              <CheckIcon color={muiTheme.palette.accent1Color}/>
              <Translate
                id="As a group, a club or  federation,  {0} : The project will move on thanks to  organizations such as yours"
                values={{
                  0: <GCLink href={contributeLink} alt='Link to become a partner'><Translate id="you can be  one of our partners" /></GCLink>
                }}
              />
            </li>
          </ul>
        </CardText>
      </Card>

      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="One of my caving  buddies  told me I should NOT  post anything at  all on Grottocenter That sometimes makes it  hard to contribute !" />
        </CardTitle>

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <Translate id="Yes, it may be  very difficult!!!!  But perhaps  we should all  be aware that  the world  is  changing" />
        </CardText>
      </Card>

      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="Who are  you  at  Grottocenter ?" />
        </CardTitle>

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <Translate id="We have our  wiki:  this is where you can find us" />
          <br/>
          <InternationalizedLink links={contributorsLink} alt='Link to contribution page' />
        </CardText>
      </Card>

      <Card className="faqCard" style={{backgroundColor: muiTheme.palette.secondary1Color}}>
        <CardTitle className='faqCardTitle' actAsExpander={true} showExpandableButton={true} style={{color: muiTheme.palette.textIconColor}}>
          <Translate id="I want to share my data only with fellow cavers Is it possible on Grottocenter?" />
        </CardTitle>

        <CardText expandable={true} style={{backgroundColor: muiTheme.palette.textIconColor}}>
          <Translate id="Data, on Grottocenter,  is placed under free licence, it is accessible to all those who may need  it" />
        </CardText>
      </Card>
    </div>
  );
};

Faq.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(Faq);
