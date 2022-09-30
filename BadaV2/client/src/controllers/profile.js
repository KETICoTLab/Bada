import Util from './../util';

export default {
  name: 'Profile',
  data() {
    return {
      msg: 'Welcome to Your Profile Page',
      user: {
        email: localStorage.email,
        name: localStorage.name,
        department: localStorage.department,
        password: "",
        new_password: "",
        check_password: ""
      },
      password_dismatch: 'none',
      variants: Util.variants,
      headerBgVariant: "",
      headerTextVariant: Util.variants.light,
      bodyBgVariant: "",
      bodyTextVariant: Util.variants.light,
      okVariant: "",
      handle_ok: "",
      modalContents: ""
    }
  },
  methods: {
    signUpModal() {
      let signUpModal = this.$refs.modal;

      this.headerBgVariant = this.variants.primary;
      this.bodyBgVariant = this.variants.primary;
      this.okVariant = this.variants.outlinePrimary;
      this.handle_ok = this.profileUpdate;
      this.modalContents = "Do you really want to register these records?";

      signUpModal.show();
    },
    cancelModal() {
      let signUpModal = this.$refs.modal;

      this.headerBgVariant = this.variants.danger;
      this.bodyBgVariant = this.variants.danger;
      this.okVariant = this.variants.outlineDanger;
      this.handle_ok = this.refreshStatus;
      this.modalContents = "Do you really want to reset these input data?"

      signUpModal.show();
    },
    checkPassword() {
      if (Util.emptyStringCheck(this.user.new_password) || Util.emptyStringCheck(this.user.check_password)) {
        return;
      } else if (Util.emptyStringCheck(this.user.new_password) && Util.emptyStringCheck(this.user.check_password)) {
        this.password_dismatch = "none";
        return;
      }

      if(this.user.new_password === this.user.check_password) {
        this.password_dismatch = false;
      } else {
        this.password_dismatch = true;
      }
    },
    profileUpdate() {
      this.$http.put('/user/signup', this.user)
      .then((result) => {
        localStorage.email = this.user.email;
        localStorage.name = this.user.name;
        localStorage.department = this.user.department;

        this.$parent.$router.go(0);
      })
      .catch((err) => {
        console.log(err.response);
        alert(err.response.data);
      })
    },
    refreshStatus() {
      this.user.name = localStorage.name;
      this.user.department = localStorage.department;
      this.user.password = '';
      this.user.new_password = '';
      this.user.check_password = '';
      this.password_dismatch = 'none';
    }
  },
  created() {
    this.$http.get('/user', { params: { email: localStorage.email}})
      .then((result) => {
        this.user.email = result.data.email;
        this.user.name = result.data.name;
        this.user.department = result.data.department;
      })
      .catch((err) => {
        console.log(err.response);
        alert(err.response.data);
      })
  },
  mounted() {
    let new_password_element = this.$el.querySelector("#new_password");
    let check_password_element = this.$el.querySelector("#check_password");

    new_password_element.addEventListener("focusout", (event)=> {
      this.checkPassword();
    });
    check_password_element.addEventListener("focusout", (event)=> {
      this.checkPassword();
    });
  }
}