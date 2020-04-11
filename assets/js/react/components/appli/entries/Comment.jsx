import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography/Typography';
import { DirectionsWalk, FilterHdr } from '@material-ui/icons/';
import Divider from '@material-ui/core/Divider';

const BoldText = withStyles(
  (theme) => ({
    root: {
      fontSize: '14px',
      color: '#795548',
      fontWeight: 'bold',
      display: 'block',
      marginTop: '-5px',
    },
  }),
  { withTheme: true },
)(Typography);

const DetailContainer = withStyles(
  (theme) => ({
    root: {
      marginLeft: '15px',
      display: 'inline-block',
      maxWidth: '80%',
      paddingRight: '20px',
      marginBottom: '20px',
    },
  }),
  { withTheme: true },
)(Typography);

const CommentTitle = withStyles({
  title: {
    display: 'block',
    color: '#795548 !important',
    fontSize: '18px !important',
    fontWeight: 'bold !important',
  },
})(Typography);

const Content = withStyles(
  (theme) => ({
    root: {
      marginBottom: '20px',
      display: 'inline-block',
    },
  }),
  { withTheme: true },
)(Typography);

const CommentContainer = withStyles(
  (theme) => ({
    root: {
      margin: 'auto',
      color: '#333',
      margin: 'auto',
      display: 'block',
    },
  }),
  { withTheme: true },
)(Typography);

const Hiker = withStyles(
  (theme) => ({
    root: {
      color: '#795548',
    },
  }),
  { withTheme: true },
)(DirectionsWalk);

const Mountain = withStyles(
  (theme) => ({
    root: {
      color: '#795548',
    },
  }),
  { withTheme: true },
)(FilterHdr);

function Comment() {
  return (
    <CommentContainer component="div">
      <Content component="div">
        <CommentTitle component="span">Titre du commentaire - Auteur</CommentTitle>

        <Typography component="span" style={{ display: 'block' }}>
          Je suis le texte expliquant le commentaire
        </Typography>
      </Content>

      <div style={{ display: 'block', margin: 'auto' }}>
        <DetailContainer component="div">
          <Hiker alt="Temps d'approche" />
          <BoldText component="span">00:30</BoldText>
        </DetailContainer>

        <DetailContainer component="div">
          <Mountain alt="Temps passé sous terre" />
          <BoldText component="span">05:00</BoldText>
        </DetailContainer>
      </div>
      <Divider />
    </CommentContainer>
  );
}

export default Comment;
