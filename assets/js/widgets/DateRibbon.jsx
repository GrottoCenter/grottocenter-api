import React from 'react';

const DateRibbon = (props) => (
  <div className="ribbon date">
    <div className="top ribbon-piece">{props.month}</div>
    <div className="bottom ribbon-piece">{props.day}</div>
    <div className="tail">
      <div className="left ribbon-piece"></div>
      <div className="right ribbon-piece"></div>
    </div>
  </div>
);

DateRibbon.propTypes = {
  month: React.PropTypes.string,
  day: React.PropTypes.string
};

export default DateRibbon;
