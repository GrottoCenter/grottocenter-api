import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import DescriptionIcon from '@material-ui/icons/Description';
import DocumentIcon from '@material-ui/icons/Filter';
import CaveSystem from '../../components/appli/CaveSystem';
import EntriesList from '../../components/appli/CaveSystem/EntriesList';
import { fetchCave } from '../../actions/Cave';
import Content from './Content';
import { getSafeData } from './transformer';

const CaveSystemPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector((state) => state.cave);
  const { formatMessage } = useIntl();

  useEffect(() => {
    dispatch(fetchCave(id));
  }, [id]);

  return (
    <CaveSystem loading={loading || !isNil(error)} data={getSafeData(data)}>
      <>
        <EntriesList />
        <Content
          title={formatMessage({ id: 'Description' })}
          icon={<DescriptionIcon color="primary" />}
        />
        <Content
          title={formatMessage({ id: 'Documents' })}
          icon={<DocumentIcon color="primary" />}
        />
      </>
    </CaveSystem>
  );
};

export default CaveSystemPage;
