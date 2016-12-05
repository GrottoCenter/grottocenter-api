/**
 * TODO Add comment
 */
import React from 'react';
var HomepageCards = React.createClass({
    displayName: 'HomepageCards',

    render: function() {
        return (
            <div>
              <BasicCard title="Welcome" image="news" text="Welcome to GC3!">
                Content to display
                <div className="flexbutton">
                  <SimpleButton className="btn btn-success" href="/ui/caver"><I18n label="Cavers management"/></SimpleButton>
                  <SimpleButton className="btn btn-success" href="/cavelist"><I18n label="Entries management"/></SimpleButton>
                  <SimpleButton className="btn btn-success" href="/ui/cave"><I18n label="Caves management"/></SimpleButton>
                  <SimpleButton className="btn btn-success" href="/ui/file"><I18n label="Files management"/></SimpleButton>
                </div>
              </BasicCard>
          </div>
        );
    }
});
