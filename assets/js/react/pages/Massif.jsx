import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Massif from '../components/appli/Massif';
import { loadMassif } from '../actions/Massif';

const MassifPage = () => {
  const { massifId } = useParams();
  const dispatch = useDispatch();
  const { massif, isFetching } = useSelector((state) => state.massif);

  useEffect(() => {
    dispatch(loadMassif(massifId));
  }, [massifId]);

  return <Massif isFetching={isFetching} massif={massif} />;
};
export default MassifPage;
