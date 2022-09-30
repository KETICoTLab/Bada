import { eventBus } from './../main';

export default {
  name: 'Home',
  data() {
    return {
      profileArea: false,
    }
  },
  methods: {
    closeAllModal() {
      if(this.profileArea === true) {
        this.profileArea = false;
      }
    },
    closeAllPopover() {
      this.$root.$emit('bv::hide::popover');
    },
    initEventListener() {
      const contentsArea = this.$el.querySelector('.contents');
      const drawerArea = this.$el.querySelector('.drawer');
      const dashboardArea = this.$el.querySelector('.dashboard'); 
      const homeArea = this.$el.querySelector('.home');

      if(dashboardArea) {
        this.$el.addEventListener('click', this.closeAllPopover);
      }
      
      contentsArea.addEventListener('click', this.closeAllModal);
      drawerArea.addEventListener('click', this.closeAllModal);
    }
  },
  created() {
    eventBus.$on('profileWindow', (data) => {
      this.profileArea = data;
    })

    window.addEventListener('scroll', this.closeAllModal);
  },
  mounted() {
    this.initEventListener();
  },
  updated() {
    this.initEventListener(); 
  },
  destroyed () {
    window.removeEventListener('scroll', this.closeAllModal);
    this.$el.removeEventListener('click', this.closeAllPopover);
  }
}