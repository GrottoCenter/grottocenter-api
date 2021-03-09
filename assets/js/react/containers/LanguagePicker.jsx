import { connect } from 'react-redux';
import LanguageSelector from '../components/common/LanguageSelector';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const LanguagePicker = connect()(LanguageSelector);

export default LanguagePicker;
