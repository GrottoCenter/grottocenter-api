var MainApp = React.createClass({
  displayName: 'MainApp SPA',

  render: function() {
    return (
      <ReactRouter.Router history={ReactRouter.browserHistory}>
        <ReactRouter.Route path="/" component={StandardPage}>
          <ReactRouter.IndexRoute component={Homepage}/>
          <ReactRouter.Route path="/cavelist" component={FilterableProductTable}/>
        </ReactRouter.Route>
      </ReactRouter.Router>
    );
  }
});

ReactDOM.render(React.createElement(MainApp, null), document.getElementById('homepage_wrapper'));
