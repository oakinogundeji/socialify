module.exports = function ($, socket) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        hubTitle: '',
        hubDescription: '',
        userStatus: '',
        pwdRecoveryEmail: '',
        showErrMsg: false,
        formUrl: '/users/newpage/' + this.userEmail,
        showUpload: false,
        showForm: true
      };
    },
    props: ['userEmail'],
    methods: {
      submitData: function () {
        if(this.hubTitle.trim() && this.hubDescription.trim() &&
        this.userStatus.trim() && this.pwdRecoveryEmail.trim()) {
        this.$http.post(this.formUrl, {
          title: this.hubTitle,
          description: this.hubDescription,
          status: this.userStatus,
          pwdRecoveryEmail: this.pwdRecoveryEmail
        }).
          then(function (res) {
            console.log('response from form submission', res);
            this.showForm = false;
            this.$dispatch('newPageCreated');
            return this.$route.router.go({name: 'uploadPix'});
          }).
          catch(function (info, status, req) {
            this.showForm = false;
            console.log('info obj', info);
            console.log('status obj', status);
            return console.log('original req obj',req);
          });
          return this.hubTitle = this.hubDescription =
            this.userStatus = this.pwdRecoveryEmail = null;
        }
        return this.showErrMsg = true;
      }
    }
  };
};
