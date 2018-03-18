import React, {PropTypes} from 'React';

const Details = (props) => (
  <div>Détails de l'entrée : {props.params.id}</div>
);

Details.propTypes = {
  params: PropTypes.object.isRequired
};

export default Details;
