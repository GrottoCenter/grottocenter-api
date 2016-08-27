var CardSupportingText = React.createClass({
    displayName: 'CardSupportingText',
    render: function() {
        return (
            React.createElement('div', {className: "cardsupportingtext"},
				React.createElement('span', null, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sagittis pellentesque lacus eleifend lacinia..."),
				React.createElement('div', {className: "flexbutton"},
					React.createElement(SimpleButton, {href: "/ui/caver", text: "Cavers management"}),
					React.createElement(SimpleButton, {href: "/ui/entry", text: "Entries management"}),
					React.createElement(SimpleButton, {href: "/ui/cave", text: "Caves management"}),
					React.createElement(SimpleButton, {href: "/ui/file", text: "Files management"})
				)
            )
        );
    }
});