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
  ];
};

export default makeCustomHeaderCellRenders;
