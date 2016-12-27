import React from 'react';
import RandomEntryCard from './../../widgets/RandomEntryCard';

const RandomEntry = () => (
    <div>
      <div role="section" className="randomEntryBg randomEntry">
        <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>RANDOM ENTRY</h2>
        <div className="container">
          <RandomEntryCard/>
        </div>
      </div>
    </div>
);

export default RandomEntry;
