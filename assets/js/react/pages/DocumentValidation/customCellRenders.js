import { useIntl } from 'react-intl';
import { propOr, map, pipe, join, head, isNil, reject, isEmpty } from 'ramda';

const makeCustomCellRenders = () => {
  const { formatDate, formatMessage, formatTime } = useIntl();
  return [
    {
      id: 'dateInscription',
      customRender: (date) =>
        date
          ? `${formatDate(new Date(date))} ${formatTime(new Date(date))}`
          : null,
    },
    {
      id: 'dateValidation',
      customRender: (date) => (date ? formatDate(new Date(date)) : null),
    },
    {
      id: 'authors',
      customRender: pipe(
        map(propOr('', 'nickname')),
        reject(isEmpty),
        join(' - '),
      ),
    },
    {
      id: 'author',
      customRender: propOr('', 'nickname'),
    },
    {
      id: 'identifierType',
      customRender: propOr('', 'text'),
    },
    {
      id: 'license',
      customRender: propOr('', 'text'),
    },
    {
      id: 'regions',
      customRender: pipe(map(propOr('', 'code')), reject(isEmpty), join('; ')),
    },
    {
      id: 'subjects',
      customRender: pipe(map(propOr('', 'code')), reject(isEmpty), join('; ')),
    },
    {
      id: 'library',
      customRender: propOr('', 'name'),
    },
    {
      id: 'editor',
      customRender: propOr('', 'name'),
    },
    {
      id: 'type',
      customRender: propOr('', 'name'),
    },
    {
      id: 'entrance',
      customRender: (entrance) =>
        `${formatMessage({ id: 'City' })}: ${propOr('', 'city', entrance)}`,
    },
    {
      id: 'descriptions',
      customRender: pipe(head, propOr('', 'text')),
    },
    {
      id: 'titles',
      customRender: pipe(head, propOr('', 'text')),
    },
    {
      id: 'parent',
      customRender: (parent) =>
        !isNil(parent) &&
        !isNil(parent.refBbs) &&
        `${formatMessage({ id: 'BBS Reference' })}: ${propOr(
          '',
          'refBbs',
          parent,
        )}`,
    },
  ];
};

export default makeCustomCellRenders;
