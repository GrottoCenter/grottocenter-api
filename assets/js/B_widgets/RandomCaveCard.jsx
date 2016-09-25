"use strict";

var RandomCaveCard = React.createClass({
    displayName: 'RandomCaveCard',
	
	getInitialState: function() {
		return {
		  ramdomCave: []
		};
	},
	
	componentWillMount: function () {
		this.fetchData({});
	},
	
	fetchData: function (filters) {
		var _this = this;
		var url = "/cave/findRandom";
		
		$.get(url, function (data) {
			_this.setState({
			  ramdomCave: data[0]
			});
		});
	},
	
    render: function() {
		console.log(this.state.ramdomCave);
        return (
            <div>
                <BasicCard title={this.state.ramdomCave.name} 
					image="entry" 
					text="This is a cave random card" >
					
					Description cave + img
				</BasicCard>
            </div>
        );
    }
});