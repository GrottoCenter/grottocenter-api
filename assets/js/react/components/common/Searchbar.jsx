import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Async from 'react-select/lib/Async';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import NoSsr from '@material-ui/core/NoSsr';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import CancelIcon from '@material-ui/icons/Cancel';
import Translate from './Translate';
import { entityOptionForSelector } from '../../helpers/Entity';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: '72px',
  },
  input: {
    display: 'flex',
    padding: 0,
    fontSize: 16,
    lineHeight: '72px',
  },
  valueContainer: {
    height: '72px',
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
    fontSize: 16,
  },
  chipFocused: {
    backgroundColor: theme.palette.primary3Color,
  },
  noOptionsMessage: {
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
    fontSize: 16,
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
    color: theme.palette.primary2Color,
    fontWeight: '100',
    fontStyle: 'italic',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
    width: 'calc(100% - 37px)',
  },
  option: {
    fontSize: 16,
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
});

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      <Translate>No results to display (type at least 3 characters)</Translate>
    </Typography>
  );
}

function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}

function Control(props) {
  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        disableUnderline: true,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}

function Option(props) {
  let { children: toDisplay } = props;
  const {
    data, isFocused, selectProps, isSelected,
  } = props;
  if (data && data.type) {
    toDisplay = entityOptionForSelector(data);
  }

  return (
    <MenuItem
      selected={isFocused}
      className={selectProps.classes.option}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {toDisplay}
    </MenuItem>
  );
}

function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}

function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}

function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

function Menu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

//
//
// M A I N - C O M P O N E N T
//
//

class Searchbar extends React.Component {
  state = {
    selected: null,
  };

  handleChange = (value) => {
    this.setState({
      selected: value,
    });
    if (this.props.handleSelection) {
      this.props.handleSelection(value);
    }
  };

  getDatasource = filter => (
    this.props.startSearch(filter)
      .then(() => {
        const datasource = this.props.results.map(result => ({
          value: result,
          label: result.name,
          highlights: result.highlights,
          type: result.type,
        }));
        return Promise.resolve(datasource);
      })
      .catch(() => Promise.resolve([]))
  );

  render() {
    const { classes, theme } = this.props;

    const selectStyles = {
      input: base => ({
        ...base,
        color: theme.palette.text.primary,
        '& input': {
          font: 'inherit',
        },
      }),
    };

    return (
      <div className={classes.root}>
        <NoSsr>
          <Async
            classes={classes}
            styles={selectStyles}
            loadOptions={this.getDatasource}
            components={{
              Control,
              Menu,
              MultiValue,
              NoOptionsMessage,
              Option,
              Placeholder,
              SingleValue,
              ValueContainer,
            }}
            value={this.props.value}
            onChange={this.handleChange}
            placeholder={(
              <React.Fragment>
                <Translate>Search for a cave, massif, group</Translate>
                <span>...</span>
              </React.Fragment>
            )}
            closeMenuOnScroll
            isMulti
          />
        </NoSsr>
      </div>
    );
  }
}

Searchbar.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  theme: PropTypes.shape({}).isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  startSearch: PropTypes.func.isRequired,
  handleSelection: PropTypes.func,
};

export default withStyles(styles, { withTheme: true })(Searchbar);
