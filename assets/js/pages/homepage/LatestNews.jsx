import React from 'react';
import BasicCard from './../../components/BasicCard';

const LatestNews = () => (
      <div>
        <div role="section"  className="bgGradent">
          <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>UPCOMING EVENTS</h2>
          <div className="container">
            <div className="row">
              <div style={{'textAlign': 'center'}} className="four columns">
                <BasicCard title="A new partner has joined!" image="/images/homepage/build.jpg">
                  The association <a href="#">Speleo Forever</a> has decide to contribute to GC
                </BasicCard>
              </div>
              <div style={{'textAlign': 'center'}} className="four columns">
                <BasicCard title="National caving days" image="/images/homepage/entry.jpg">
                  National caving days will occurs on 4th of October. A great opportunity to discover this "indoor" activity!
                </BasicCard>
              </div>
              <div style={{'textAlign': 'center'}} className="four columns">
                <BasicCard title="Other big event" image="/images/homepage/news.jpg">
                  Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.
                </BasicCard>
              </div>
            </div>
          </div>
        </div>

      </div>
  );

  export default LatestNews;
