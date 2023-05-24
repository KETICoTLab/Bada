import { eventBus } from "./../main";

export default {
  name: "navibar",
  props: {
    profileArea: {
      type: Boolean
    }
  },
  data() {
    return {
      user: {
        name: localStorage.name,
        email: localStorage.email
      },
      servertime: "",
      modal: {
        show: false,
        title: "Logout " + localStorage.name
      }
    };
  },
  methods: {
    showProfile() {
      if (this.profileArea === false) {
        eventBus.$emit("profileWindow", true);
      } else {
        eventBus.$emit("profileWindow", false);
      }
    },
    logout() {
      if (localStorage) {
        localStorage.clear();
      }
      this.$router.push("/");
    }
  },
  created() {
    window.addEventListener("scroll", this.closeAllModal);
  },
  destroyed() {
    window.removeEventListener("scroll", this.closeAllModal);
  }
};
