export default {
  name: 'Resource',
  created() {
    window.addEventListener('scroll', this.closeAllModal);
  },
  destroyed () {
    window.removeEventListener('scroll', this.closeAllModal);
  }
}