import Util from "./../util";

export default {
  name: "Signup",
  data() {
    return {
      msg: "Welcome to Your Vue.js App",
      user: {
        email: "",
        name: "",
        department: "",
        password: "",
        check_password: ""
      },
      password_dismatch: "",
      headerBgVariant: "",
      variants: Util.variants,
      headerTextVariant: Util.variants.light,
      bodyBgVariant: "",
      bodyTextVariant: Util.variants.light,
      okVariant: "",
      handle_ok: "",
      handleId: "",
      modalContents: ""
    };
  },
  methods: {
    warningModal(contents, emptyElID) {
      let emptyWarningModal = this.$refs.modal;

      this.headerBgVariant = this.variants.danger;
      this.bodyBgVariant = this.variants.danger;
      this.okVariant = this.variants.outlineDanger;
      this.modalContents = contents;
      this.handleId = "#" + emptyElID;

      emptyWarningModal.show();
    },
    focusIn() {
      console.log(this.$el.querySelector(this.handleId));
      let focusElement = this.$el.querySelector(this.handleId);
      this.$el.querySelector(this.handleId).focus();
    },
    checkPassword() {
      if (
        Util.emptyStringCheck(this.user.password) ||
        Util.emptyStringCheck(this.user.check_password)
      ) {
        return;
      } else if (
        Util.emptyStringCheck(this.user.password) &&
        Util.emptyStringCheck(this.user.check_password)
      ) {
        this.password_dismatch = "none";
        return;
      }

      if (this.user.password === this.user.check_password) {
        this.password_dismatch = false;
      } else {
        this.password_dismatch = true;
      }
    },
    signup() {
      this.checkPassword();

      if (Util.emptyStringCheck(this.user.email)) {
        this.warningModal("Empty email.", "email");
        return;
      } else if (!Util.emailStringCheck(this.user.email)) {
        this.warningModal("It is not a email format.", "email");
        return;
      } else if (Util.emptyStringCheck(this.user.name)) {
        this.warningModal("Empty Name.", "name");
        return;
      } else if (this.password_dismatch) {
        this.warningModal("Wrong password.", "password");
        return;
      }

      this.$http
        .post("/user/signup", this.user)
        .then(result => {
          console.log(result);
        })
        .then(text => {
          this.$router.push("/");
        })
        .catch(err => {
          console.log(err.response);
          alert(err.response.data);
        });
    },
    animate(event) {
      event.target.parentElement.classList.add("focused");
    }
  },
  mounted() {
    let inputElements = this.$el.querySelectorAll("input");
    inputElements.forEach(element => {
      element.addEventListener("focusout", event => {
        if (Util.emptyStringCheck(event.target.value)) {
          event.target.parentElement.classList.remove("focused");
        }
      });
    });
  }
};
