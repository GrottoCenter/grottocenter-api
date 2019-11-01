import { connect } from 'react-redux';
import AppToolbar from '../components/appli/AppToolbar';

// =====

const mapStateToProps = (state) => ({
  pageTitle: state.pageTitle.pageTitle,
});

export default connect(mapStateToProps)(AppToolbar);
