import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil } from 'ramda';
// eslint-disable-next-line import/no-named-as-default
import Organization from '../components/appli/Organization';
import { loadOrganization } from '../actions/Organization';
import { setPageTitle } from '../actions/PageTitle';

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const { organization, error, isFetching } = useSelector(
    (state) => state.organization,
  );

  useEffect(() => {
    dispatch(loadOrganization(organizationId));
    dispatch(setPageTitle('Organization'));
  }, [organizationId]);

  return (
    <Organization
      isFetching={isFetching || !isNil(error)}
      organization={organization}
    />
  );
};
export default OrganizationPage;
