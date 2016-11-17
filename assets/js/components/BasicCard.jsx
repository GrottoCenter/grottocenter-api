var BasicCard = React.createClass({
    displayName: 'BasicCard',

    render: function() {
        return (
          <div className="basicCard">
            <figure>
              <img src={this.props.image} alt="" />
            </figure>
            <div>
              <h3>{this.props.title}</h3>
            </div>
            <div>
              <p>{this.props.children}</p>
            </div>
            <div>
              <a href="#">Read More</a>
            </div>
          </div>
        );
    }
});
