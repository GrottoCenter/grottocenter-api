import { connect } from 'react-redux';
import { loadGroup } from '../actions/Group';
import Group from './../components/appli/Group';

const mapDispatchToProps = (dispatch) => {
  return {
    fetch: dispatch(loadGroup())
  };
}

const mapStateToProps = (state) => {
  return {
    // group: state.group

    // TODO : currently working with fake data, use real one (see above)
    group: {
      "Id": "3",
      "Locked": "NO",
      "{{3}}')": null,
      "Id_author": "16",
      "Id_reviewer": "50",
      "Id_locker": "50",
      "Name": "CLPA",
      "Country": "FR",
      "Village": null,
      "County": "Hérault",
      "Region": "Occitanie",
      "City": "Montpellier",
      "Postal_code": "34000",
      "Address": "9, rue de la Poésie",
      "Contact": "clpa@wanadoo.fr",
      "Year_birth": "1967",
      "Date_inscription": "2008-07-29 12:00:48",
      "Date_reviewed": "2016-03-26 01:30:58",
      "Date_locked": "2016-03-26 01:30:42",
      "Id_president": null,
      "Id_vice_president": "314",
      "Id_treasurer": "519",
      "Id_secretary": null,
      "Latitude": "43.61734339229920000000",
      "Longitude": "3.88173580169677730000",
      "Custom_message": "http://speleoclpa.free.fr",
      "Picture_file_name": "clpa-3.jpg",
      "Is_official_partner": null
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);
