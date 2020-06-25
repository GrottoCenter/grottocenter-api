import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// eslint-disable-next-line import/no-named-as-default
import Bbs from '../components/appli/Bbs';
import { loadBbs } from '../actions/Bbs';

const BbsPage = () => {
  const { bbsId } = useParams();
  const dispatch = useDispatch();
  const { bbs, isFetching } = useSelector((state) => state.bbs);

  useEffect(() => {
    dispatch(loadBbs(bbsId));
  }, [bbsId]);

  return <Bbs isFetching={isFetching} bbs={bbs} />;
};
export default BbsPage;
