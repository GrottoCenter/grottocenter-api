/**
 * TODO Add comment
 */

var HomepageNav = React.createClass({
  displayName: 'HomepageNav',

  render: function() {
    return (
      <div>
        Nav
      </div>
    );
  }
});

var HomepageAside = React.createClass({
  displayName: 'HomepageAside',

  render: function() {
    return (
      <div>
        Aside
      </div>
    );
  }
});

var HomepageArticles = React.createClass({
  displayName: 'HomepageArticles',

  render: function() {
    return (
      <div>
        <div role="section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-12 col-md-6">
                <HomepageCards/>
              </div>
              <div className="col-xs-12 col-md-6">
                <RandomCaveCard/>
              </div>
            </div>
          </div>
        </div>
        <div role="section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-12">
                <PartnerCarousel/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

var Homepage = React.createClass({
  displayName: 'Homepage',

  render: function() {
    return (
      <div>
        <HomepageNav/>
        <HomepageAside/>
        <HomepageArticles/>
      </div>
    );
  }
});
