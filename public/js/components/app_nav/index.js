module.exports = {
  template: require('./template.html'),
  props: ['hasPage'],
  computed: {
    showHub: function () {
      if(this.hasPage) {
        return true;
      }
      return false;
    }
  }
};
