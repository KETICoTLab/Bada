import Util from './../util';

export default {
  name: 'Login',
  data() {
    return {
      user: {
        email : '',
        password: ''
      }
    }
  },
  methods: {
    login() {
      if (Util.emptyStringCheck(this.user.email)) {
        alert('Empty email.');
        return; 
      } else if(!Util.emailStringCheck(this.user.email)) {
        alert('It is not an email format.');
        return;
      } else if (Util.emptyStringCheck(this.user.password)) {
        alert('Empty password.');
        return;
      }
      
      let user = { email: this.user.email, password: this.user.password };

      this.$http.post('/user/login', user)
      .then((result) => {
        localStorage.user = result.data;
        localStorage.token = result.data.token;
        localStorage.name = result.data.name;
        localStorage.email = result.data.email;
        localStorage.department = result.data.department;
        this.$http.defaults.headers['x-access-token'] = localStorage.token;
      })
      .then((text) => {
        this.$router.push('/home/dashboard');
      })
      .catch((err) => {
        console.log(err.response);
        alert(err.response.data);
      })
    },
    autoLogin(email, password) {
      this.user.email = email;
      this.user.password = password;

      let user = { email: this.user.email, password: this.user.password };

      this.$http.post('/user/login', user)
      .then((result) => {
        localStorage.token = result.data.token;
        localStorage.name = result.data.name;
        localStorage.email = result.data.email;
        localStorage.department = result.data.department;
        this.$http.defaults.headers['x-access-token'] = localStorage.token;
      })
      .then((text) => {
        this.$router.push('/home/dashboard');
      })
      .catch((err) => {
        console.log(err.response);
        if(err.response.data) {
          alert(err.response.data);
        }
      })
    },
    animate(event) {
      event.target.parentElement.classList.add("focused");
    },
  },
  mounted() {
    let inputElements = this.$el.querySelectorAll("input");
    inputElements.forEach(element => {
      element.addEventListener("focusout", (event)=> {
        if(Util.emptyStringCheck(event.target.value)) {
          event.target.parentElement.classList.remove("focused");
        }
      });
    });
  }
}