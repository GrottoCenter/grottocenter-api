var BasicCard = React.createClass({
    displayName: 'BasicCard',
    render: function() {
        return (
            React.createElement('div', {className: "basicCard"},
				React.createElement(CardTitle),
				React.createElement(CardSupportingText),
				React.createElement(CardActions),
				React.createElement(CardMenu)
            )
        );
    }
});

/*
<MDL.Card style={{width: 517}}>
	<MDL.CardTitle style={{
		height: 140,
		background: "url('img/bg_1.png')",
		color: 'white',
	}}>
		Welcome
	</MDL.CardTitle>
	<MDL.CardSupportingText>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit.
		Mauris sagittis pellentesque lacus eleifend lacinia...
	</MDL.CardSupportingText>
	<MDL.CardActions border>
		<MDL.Button>Get started</MDL.Button>
	</MDL.CardActions>
	<MDL.CardMenu style={{color: 'white'}}>
		<MDL.Button icon="share" />
	</MDL.CardMenu>
</MDL.Card>
*/