"use strict";

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.background,
    border: 0,
    fontSize: 16,
    borderRadius: 3,
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
    color: "white",
    height: 48,
    padding: "0 30px",
  },
}));

function DeepChild() {
  const classes = useStyles();
  return RE.Button({ className: classes.root }, "Theming");
}

const themeInstance = {
  background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
};

const ViewList2 = ({}) => {

  return re(ThemeProvider, {theme: createMuiTheme(themeInstance)},
    re(DeepChild,{})
  );
};

ReactDOM.render(re(ViewList2), document.getElementById("react-container"));
