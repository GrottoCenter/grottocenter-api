/**
 * TODO Add comment
 */

var HomepageCards = React.createClass({
    displayName: 'HomepageCards',

    render: function() {
        return (
            <div>
                <BasicCard title="Welcome" image="news" text="Welcome to GC3!">
					Content to display
					<div className="flexbutton">
						<SimpleButton href="/ui/caver" text="Cavers management" />
						<SimpleButton href="/ui/entry" text="Entries management" />
						<SimpleButton href="/ui/cave" text="Caves management" />
						<SimpleButton href="/ui/file" text="Files management" />
					</div>
				</BasicCard>
            </div>
        );
    }
});
