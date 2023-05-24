import Util from './../util';
import { eventBus } from './../main';

export default {
  name: "drawer",
  data() {
    return {};
  },
  methods: {
    toggleSubmenu() {
      let subMenuStyleStatus = this.$refs.subContents.style;

      if (
        subMenuStyleStatus.display === "none" ||
        !subMenuStyleStatus.display
      ) {
        subMenuStyleStatus.display = "block";
      } else {
        subMenuStyleStatus.display = "none";
      }
    },
    toggleStreamSubmenu() {
      let streamSubMenuStyleStatus = this.$refs.streamSubContents.style;

      if (streamSubMenuStyleStatus.display === "none" || !streamSubMenuStyleStatus.display) {
        streamSubMenuStyleStatus.display = "block";
      } else {
        streamSubMenuStyleStatus.display = "none";
      }
    },
    isAdmin() {
      return Util.isAdmin();
    },
    goToPage(routeTo) {
      this.$forceUpdate();
      if (this.$route.path === routeTo) {
        eventBus.$emit(routeTo);
      } else {
        this.$router.push(routeTo);
      }
    }
  }
};