import React, {PropTypes} from 'react';
import GrottoAppBar from '../components/homepage/GrottoAppBar';

const LightPage = (props) => (
  <div>
    <GrottoAppBar/>
    {props.children}
  </div>
);

LightPage.propTypes = {
  children: PropTypes.node.isRequired
};

export default LightPage;
