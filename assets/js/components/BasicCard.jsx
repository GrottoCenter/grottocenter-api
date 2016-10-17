"use strict";

var CardMenu = React.createClass({
    displayName: 'CardMenu',
	
    render: function() {
        return (
            <div className="cardmenu">I'm a card menu!</div>
        );
    }
});

var CardActions = React.createClass({
    displayName: 'CardActions',
    render: function() {
        return (
            React.createElement('div', {className: "cardactions"},
				"I'm a card actions!"
            )
        );
    }
});

var CardSupportingText = React.createClass({
    displayName: 'CardSupportingText',
	
    render: function() {
        return (
            <div className="cardsupportingtext">
				<span>{this.props.text}</span>
            </div>
        );
    }
});

var CardTitle = React.createClass({
    displayName: 'CardTitle',
	
    render: function() {
		var styles = "cardtitle " + this.props.image + "Bg";
        return (
            <div className={styles}>{this.props.title}</div>
        );
    }
});

var BasicCard = React.createClass({
    displayName: 'BasicCard',
	
    render: function() {
        return (
            <div className="basicCard">
				<CardTitle title={this.props.title} image={this.props.image}/>
				<CardSupportingText text={this.props.text} />
				<div className="cardsupportingtext">
					{this.props.children}
				</div>
				<CardActions />
				<CardMenu />
            </div>
        );
    }
});