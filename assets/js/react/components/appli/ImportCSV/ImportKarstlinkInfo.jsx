import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, makeStyles } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import DownloadIcon from '@material-ui/icons/GetApp';
import { useIntl } from 'react-intl';

const useStyles = makeStyles({
  karstlinkFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 'auto',
  },

  karstlinkButton: {
    width: 'fit-content',
    margin: '0 0 0 1rem',
  },
});

const KarstlinkLogo = styled.img`
  width: 15%;
  height: 15%;
  border-radius: 0.5rem;
`;

const KarstlinkParagraph = styled.p`
  text-align: justify;
  font-weight: 300;
  font-size: large;
`;

const ImportKarstlinkInfo = ({ selectType }) => {
  const { formatMessage } = useIntl();
  const classes = useStyles();

  return (
    <>
      <div>
        <KarstlinkParagraph>
          {formatMessage({
            id:
              'You have probably wondered how to find data on caves? How to connect the caves to the documents that mention them? How to create links between scientific observations, the measurements made by the sensors and the cavities in which these observations and measurements were carried out? This is some of what the KarstLink project offers.',
          })}
        </KarstlinkParagraph>
      </div>
      <div className={classes.karstlinkFooter}>
        <KarstlinkLogo src="/images/importCSV/KarstlinkLogo.png" />
        <div>
          <Button
            target="_blank"
            href="https://ontology.uis-speleo.org/ontology/"
            className={classes.karstlinkButton}
            variant="contained"
          >
            <InfoIcon />
            {formatMessage({
              id: 'Find out',
            })}
          </Button>
          <Button
            target="_blank"
            href={
              selectType === 0
                ? 'https://ontology.uis-speleo.org/example/V4.csv'
                : 'https://ontology.uis-speleo.org/example/Prospection.csv'
            }
            className={classes.karstlinkButton}
            variant="contained"
          >
            <DownloadIcon />
            {formatMessage({
              id:
                selectType === 0 ? 'Example - Entrance' : 'Example - Document',
            })}
          </Button>
        </div>
      </div>
    </>
  );
};
ImportKarstlinkInfo.propTypes = {
  selectType: PropTypes.number.isRequired,
};

export default ImportKarstlinkInfo;
