module.exports = {
  emptyStringCheck : (input) => {
    let output = '';

    if(input === null || input === undefined || input === "") {
      output = true;
    } else {
      output = false;
    }

    return output;
  },
  emailStringCheck: (input) => {
    const email_regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let output = '';

    if(email_regExp.test(input)) {
      output = true;
    } else {
      output = false;
    }

    return output;
  },
  variants: {
    primary: 'primary',
    secondary: 'secondary', 
    success: 'success', 
    warning: 'warning', 
    danger: 'danger', 
    info: 'info', 
    light: 'light', 
    dark: 'dark',
    outlinePrimary: 'outline-primary',
    outlineSecondary: 'outline-secondary',
    outlineSuccess: 'outline-success',
    outlineWarning: 'outline-warning',
    outlineDanger: 'outline-danger',
    outlineInfo: 'outline-info',
    outlineLight: 'outline-light',
    outlineDark: 'outline-dark'
  },
  setStringToDate : (input) => {
    if(typeof input !== 'string') return;

    let formatchange = input.substring(0, 4) + "-" + input.substring(4, 6) + "-" + input.substring(6, 8) + "T" + input.substring(9, 11) + ":"+ input.substring(11, 13) + ":"+ input.substring(13, 15) + "Z";
    let modifiedDate = new Date(formatchange);

    return modifiedDate;
  },
  isAdmin: () => {
    let answer = false;
    if(localStorage.name === "admin") {
      answer = true;
    }

    return answer;
  }
}