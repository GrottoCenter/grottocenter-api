import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import Translate from '../components/common/Translate';

//
//
// H E L P E R - F U N C T I O N S
//
//

export const isMappable = entry => entry.latitude && entry.longitude;

const EntityIcon = styled.img`
  height: 30px;
  margin-right: 10px;
  width: 30px;
`;

const EntityLabel = styled.span`
  font-size: 1.5rem;
`;

// The hightlighted words are inside <em> tags.
const HighlightText = withTheme()(styled.span`
  color: #888;
  font-size: 1.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: baseline;
  white-space: nowrap;
  em {
    background-color: ${props => props.theme.palette.accent1Color};
    color: white;
    font-style: normal;
    font-weight: bold;
  }
`);

const HighlightTextKey = withTheme()(styled.span`
  color: #888;
  font-size: 1.1rem;
  font-weight: bold;
  margin-left: 10px;
  margin-right: 2px;
  vertical-align: baseline;
  white-space: nowrap;
`);

export const entityOptionForSelector = (option) => {
  const highlights = [];
  Object.keys(option.highlights).forEach((key) => {
    highlights.push({ [key]: option.highlights[key].join(' [...] ') });
  });

  return (
    <React.Fragment>
      {option.type === 'entry' ? <EntityIcon src="/images/entry.svg" alt="Entry icon" /> : ''}
      {option.type === 'grotto' ? <EntityIcon src="/images/club.svg" alt="Group icon" /> : '' }
      {option.type === 'massif' ? <EntityIcon src="/images/entry-cluster.svg" alt="Entry cluster icon" /> : '' }

      <EntityLabel>{option.label}</EntityLabel>
      {highlights.map((hl) => {
        const key = Object.keys(hl)[0];
        return (
          <React.Fragment key={key}>
            <HighlightTextKey>
              <Translate>{key}</Translate>
              {':'}
            </HighlightTextKey>
            <HighlightText
              dangerouslySetInnerHTML={{
                __html:
                `${hl[key]}`,
              }}
            />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
