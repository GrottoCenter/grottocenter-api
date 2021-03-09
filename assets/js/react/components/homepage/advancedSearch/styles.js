const styles = (theme) => ({
  fieldset: {
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
    width: '100%',
  },
  formPartContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
  },
  legend: {
    padding: '0 5px',
  },
  formContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  formElement: {
    flex: 1,
    maxWidth: '30rem',
    margin: theme.spacing(1),
    minWidth: '15rem',
  },
  formLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default styles;
