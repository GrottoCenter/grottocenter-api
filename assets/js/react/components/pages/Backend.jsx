import React from 'react';
import BadgeHeader from '../backend/BadgeHeader';
import SideMenu from '../backend/SideMenu';
import Connected from '../backend/Connected';

const Backend = () => (
  <div className='backend'>
    <div className='header'>
      <BadgeHeader/>
      <Connected/>
    </div>
    <div>
      <SideMenu/>
      Backend
    </div>

  </div>
);

export default Backend;
