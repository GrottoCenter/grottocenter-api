import { connect } from 'react-redux';
import AppToolbar from '../components/appli/AppToolbar';

// =====

const mapStateToProps = (state) => ({
  pageTitle: state.pageTitle.pageTitle,
  pageTitleTooltip: state.pageTitle.pageTitleTooltip,
});

export default connect(mapStateToProps)(AppToolbar);
