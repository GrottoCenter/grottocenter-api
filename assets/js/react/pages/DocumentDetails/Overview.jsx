import {
  Card,
  CardContent as MuiCardContent,
  IconButton as MuiIconButton,
  Typography,
  Box,
} from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Skeleton } from '@material-ui/lab';
import { isEmpty } from 'ramda';
import CreateIcon from '@material-ui/icons/Create';
import { isNil } from 'ramda';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled(Typography)`
  align-self: center;
  color: ${({ theme }) => theme.palette.secondary.main};
`;

const SubTitle = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  text-transform: uppercase;
`;

const CardContent = styled(MuiCardContent)`
  display: flex;
  flex-direction: column;
`;

const CreatedByTypography = styled(Typography)`
  display: flex;
  flex-direction: row;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const CreatedBy = ({ name, creationDate }) => {
  const { formatMessage, formatDate, formatTime } = useIntl();

  return (
    <CreatedByTypography
      component="div"
      color="textSecondary"
      variant="caption"
      gutterBottom
    >
      <Box fontWeight="fontWeightLight">
        {`${formatMessage({ id: 'Created by' })}:`}&nbsp;
      </Box>
      <Box fontWeight="fontWeightBold">{`${name} (${formatDate(
        creationDate,
      )} - ${formatTime(creationDate)})`}</Box>
    </CreatedByTypography>
  );
};

const Overview = ({
  createdBy,
  creationDate,
  authors,
  language,
  title,
  summary,
  loading,
  onEdit,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Card>
      <CardContent>
        <Header>
          {loading ? (
            <>
              <Skeleton variant="rect" width={50} />
              <Skeleton variant="rect" width={50} />
            </>
          ) : (
            <>
              <CreatedBy name={createdBy} creationDate={creationDate} />
              <Typography color="textSecondary" variant="caption" gutterBottom>
                {`${formatMessage({
                  id: 'Document language',
                })}: ${formatMessage({ id: language })}`}
              </Typography>
            </>
          )}
        </Header>
        <Title variant="h3" gutterBottom>
          {title}
        </Title>
        {loading ? (
          <Skeleton variant="rect" height={100} />
        ) : (
          <>
            <SubTitle variant="subtitle1" color="textSecondary">
              {formatMessage({ id: 'Summary' })}
            </SubTitle>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {summary}
            </Typography>
            {!isEmpty(authors) && (
              <>
                <SubTitle variant="subtitle1" color="textSecondary">
                  {formatMessage({ id: 'Authors' })}
                </SubTitle>
                <Typography variant="body1">
                  {authors.map(
                    (auth, i) =>
                      `${auth} ${i < authors.length - 1 ? ' - ' : ''}`,
                  )}
                </Typography>
              </>
            )}
          </>
        )}
        <IconButton
          size="small"
          aria-label="edit"
          onClick={onEdit}
          disabled={isNil(onEdit)}
        >
          <CreateIcon/>
        </IconButton>
      </CardContent>
    </Card>
  );
};

export default Overview;

CreatedBy.propTypes = {
  name: PropTypes.string.isRequired,
  creationDate: PropTypes.string.isRequired,
};

Overview.propTypes = {
  loading: PropTypes.bool.isRequired,
  createdBy: PropTypes.string.isRequired,
  creationDate: PropTypes.string.isRequired,
  authors: PropTypes.arrayOf(PropTypes.string).isRequired,
  language: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
};
