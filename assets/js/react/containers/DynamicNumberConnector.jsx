import { connect } from 'react-redux';
import DynamicNumber from '../components/homepage/DynamicNumber';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapStateToProps = (state, ownProps) => {
  const attributes = state.dynamicNumber[ownProps.numberType];
  if (attributes === undefined) {
    return {
      isFetching: true,
    };
  }

  return {
    isFetching: attributes.isFetching,
    number: attributes.number,
    className: ownProps.className,
  };
};

const DynamicNumberConnector = connect(
  mapStateToProps,
)(DynamicNumber);

export default DynamicNumberConnector;
