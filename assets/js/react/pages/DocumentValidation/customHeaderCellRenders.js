import { useIntl } from 'react-intl';

const makeCustomHeaderCellRenders = () => {
  const { formatMessage } = useIntl();

  return [
    {
      id: 'titles',
      customRender: () => formatMessage({ id: 'Title' }),
    },
    {
      id: 'descriptions',
      customRender: () => formatMessage({ id: 'Description' }),
    },
    {
      id: 'dateInscription',
      customRender: () => formatMessage({ id: 'Submission date' }),
    },
  ];
};

export default makeCustomHeaderCellRenders;
