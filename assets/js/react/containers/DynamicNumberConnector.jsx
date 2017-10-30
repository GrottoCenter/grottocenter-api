import {connect} from 'react-redux';
import DynamicNumber from './../components/homepage/DynamicNumber';

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  let attributes = state.dynamicNumber[ownProps.numberType];
  if (attributes === undefined) {
    return {
      isFetching: true
    };
  }

  return {
    isFetching: attributes.isFetching,
    number: attributes.number,
    className: ownProps.className
  };
};

const DynamicNumberConnector = connect(
  mapStateToProps
)(DynamicNumber);

export default DynamicNumberConnector;
