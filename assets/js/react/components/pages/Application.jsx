import React, {PropTypes} from 'react';
import BadgeHeader from '../appli/BadgeHeader';
import SideMenu from '../appli/SideMenu';
import Connected from '../appli/Connected';

const Application = (props) => (
  <div id='applicationpage'>
    <div className='header'>
      <BadgeHeader/>
      <Connected/>
    </div>
    <div>
      <SideMenu/>
      Application

      {props.children}
    </div>
  </div>
);

Application.propTypes = {
  children: PropTypes.node.isRequired
};

export default Application;
