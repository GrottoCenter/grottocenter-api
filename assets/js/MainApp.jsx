import React from 'react';
var MainApp = React.createClass({
  displayName: 'MainApp SPA',

  render: function() {
    return (
      <ReactRouter.Router history={ReactRouter.browserHistory}>
        <ReactRouter.Route path="/auth/" component={LightPage}>
          <ReactRouter.Route path="/auth/signin" component={SigninForm}/>
          <ReactRouter.Route path="/auth/signup" component={SignupForm}/>
        </ReactRouter.Route>
        <ReactRouter.Route path="/" component={StandardPage}>
          <ReactRouter.IndexRoute component={Homepage}/>
          <ReactRouter.Route path="/cavelist" component={FilterableProductTable}/>
        </ReactRouter.Route>
      </ReactRouter.Router>
    );
  }
});

ReactDOM.render(React.createElement(MainApp, null), document.getElementById('homepage_wrapper'));
