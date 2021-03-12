import { propOr, map, pipe, join, reject, isEmpty } from 'ramda';

const makeCustomCellRenders = () => {
  return [
    {
      id: 'groups',
      customRender: pipe(map(propOr('', 'name')), reject(isEmpty), join(', ')),
    },
  ];
};

export default makeCustomCellRenders;
