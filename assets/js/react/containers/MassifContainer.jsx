import { connect } from 'react-redux';
import { loadMassif } from '../actions/Massif';
import Massif from '../components/appli/Massif';

const mapDispatchToProps = (dispatch) => {
  return {
    fetch: dispatch(loadMassif())
  };
}

const mapStateToProps = (state) => {
  return {
    // massif: state.massif

    // TODO : currently working with fake data, use real one (see above)
    massif: {
      "Id": "1",
      "Locked": "NO",
      "{{3}}')": null,
      "Id_author": "1",
      "Id_reviewer": "514",
      "Id_locker": "688",
      "Name": "Vercors (plateau du)",
      "Date_inscription": "2008-08-04 13:48:48",
      "Date_reviewed": "2011-02-20 20:03:27",
      "Date_locked": "2018-07-24 02:52:18"
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Massif);
