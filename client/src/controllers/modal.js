import Util from './../util';

export default {
  name: 'Modal',
  data() {
    return {
      variants: Util.variants,
      headerBgVariant: "",
      headerTextVariant: "",
      bodyBgVariant: "",
      bodyTextVariant: "",
      okVariant: "",
      handle_ok: "",
      modalContents: ""
    }
  },
  methods: {
    okModal() {
      let signUpModal = this.$refs.modal;

      this.headerBgVariant = this.variants.primary;
      this.bodyBgVariant = this.variants.primary;
      this.okVariant = this.variants.outlinePrimary;
      this.handle_ok = this.profile_update;
      this.modalContents = "Do you really want to register these records?";

      signUpModal.show();
    },
    cancelModal() {
      let signUpModal = this.$refs.modal;

      this.headerBgVariant = this.variants.danger;
      this.bodyBgVariant = this.variants.danger;
      this.okVariant = this.variants.outlineDanger;
      this.handle_ok = this.refresh_status;
      this.modalContents = "Do you really want to reset these input data?"

      signUpModal.show();
    },
    checkPassword() {
      if (Util.emptyStringCheck(this.user.password) || Util.emptyStringCheck(this.user.check_password)) {
        return;
      } else if (Util.emptyStringCheck(this.user.password) && Util.emptyStringCheck(this.user.check_password)) {
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
  }
}