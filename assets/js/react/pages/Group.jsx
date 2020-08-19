import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// eslint-disable-next-line import/no-named-as-default
import Group from '../components/appli/Group';
import { loadGroup } from '../actions/Group';
import { setPageTitle } from '../actions/PageTitle';

const EntryPage = () => {
  const { groupId } = useParams();
  const dispatch = useDispatch();
  const { group, isFetching } = useSelector((state) => state.group);

  useEffect(() => {
    dispatch(loadGroup(groupId));
    dispatch(setPageTitle('Organization'));
  }, [groupId]);

  return <Group isFetching={isFetching} group={group} />;
};
export default EntryPage;
