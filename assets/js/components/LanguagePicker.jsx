import React, {
    Component
}
from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const languages = [
    <MenuItem key={1} value={"fr"} primaryText="Français" />,
    <MenuItem key={2} value={"en"} primaryText="English" />,
    <MenuItem key={3} value={"de"} primaryText="Deutsch" />,
    <MenuItem key={4} value={"es"} primaryText="Español" />,
    <MenuItem key={5} value={"bg"} primaryText="Български" />,
    <MenuItem key={6} value={"nl"} primaryText="Nederlands" />,
    <MenuItem key={7} value={"ca"} primaryText="Català" />,
    <MenuItem key={8} value={"it"} primaryText="Italiano" />
];
export default class LanguagePicker extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: "fr"
        };
    }
    handleChange(event, index, value) {
        this.setState({
            value
        });
    }

    render() {
        return (
            <SelectField
          value={this.state.value}
          onChange={this.handleChange.bind(this)}
        >
          {languages}
        </SelectField>
        );
    }
}
