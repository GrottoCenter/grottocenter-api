import {connect} from 'react-redux';
import LanguageSelector from '../components/common/LanguageSelector';

const LanguagePicker = connect()(LanguageSelector);

export default LanguagePicker;
