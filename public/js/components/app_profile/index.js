module.exports = function (jQ) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        fname: '',
        lname: '',
        fullname: '',
        status: '',
        email: '',
        hasPage: '',
        displayWelcome: true,
        showGetStarted: false,
        showEdit: false,
        editFname: '',
        editLname: '',
        editEmail: '',
        confirmPwd: '',
        pixUploadUrl: '/users/profilepix/' + this.userEmail,
        dataUploadURL: '/users/' + this.userEmail +'/edit',
        pwdChangeURL: '/users/' + this.userEmail +'/changepwd',
        showErrMsg: false,
        showProfileEditBtn: true,
        showPwdErrMsg: false,
        showPwdChange: false,
        showPwdEditBtn: true,
        currentPwd: '',
        newPwd: '',
        confirmNewPwd: '',
        showPwdChngErrMsg: false
      };
    },
    computed: {
      showWelcome: function () {
        if(!this.hasPage && this.displayWelcome) {
          return true;
        }
        return false;
      },
      hasPhoto: function () {
        if(this.profilePhoto.trim()) {
          return true;
        }
        return false;
      },
      showProfileInfo: function () {
        if(this.hasPage) {
          return true;
        }
        return false;
      }
    },
    props: ['userProfileInfo'],
    methods: {
      getStarted: function () {
        this.displayWelcome = false;
        return this.$route.router.go({name: 'cr8Hub'});
      },
      editProfile: function () {
        if(this.showPwdChange) {
          this.showPwdChange = false;
        }
        console.log('edit profile button clicked');
        this.showPwdEditBtn = this.showProfileEditBtn = false;
        return this.showEdit = true;
      },
      submitEdit: function () {
        console.log('first name', this.editFname);
        console.log('last name', this.editLname);
        console.log('email', this.editEmail);
        if(this.editFname.trim() || this.editLname.trim() ||
          this.editEmail.trim()) {
            this.showProfileEditBtn = true;
            if(this.$els.newUserPix.value.trim()) {
              this.submitNewPix();
            }
          this.$http.post(this.dataUploadURL, {
            firstName: this.editFname || null,
            lastName: this.editLname || null,
            email: this.editEmail || null
          }).
            then(function (res) {
              console.log('response from edit profile data', res.data);
              return this.showEdit = false;
            }.bind(this), function (info) {
              this.showEdit = false;
              return console.log('info obj', info);
            }.bind(this));
          return this.editFname = this.editLname = this.editEmail = '';
        }
        this.showProfileEditBtn = true;
        this.showErrMsg = true;
        return console.log('submit edit profil buttion clicked!');
      },
      submitNewPix : function () {
        console.log('value of file elem', this.$els.newUserPix.value);
        console.log('file name', this.$els.newUserPix.files[0].name);
        console.log('total file obj', this.$els.newUserPix);
        console.log('file obj sent to server', this.$els.newUserPix.files[0]);
        console.log('upload url', this.pixUploadUrl);
        if(this.$els.newUserPix.value.trim()) {
          var
            xhr = new XMLHttpRequest(),
            form = new FormData();
          //NB 'profilePix' is the form field that holds the uploaded pix
          form.append('profilePix', this.$els.newUserPix.files[0]);
          console.log('upload form data', form);
          xhr.open('POST', this.pixUploadUrl);
          /*xhr.upload.addEventListener('progress', function (e) {
            if(e.lengthComputable) {
              var pcent = Math.round((e.loaded * 100) / e.total);
              $('.file-upload-progress').css('width', (pcent + '%'));
            }
          }.bind(this));*/
          xhr.addEventListener('load', function (res) {//on success
            return console.log('response from profile pix upload', res);
          }.bind(this));
          xhr.addEventListener('error', function (info) {//on error
            return console.log('info obj', info);
          }.bind(this));
          xhr.send(form);
            return this.$els.newUserPix.value = null;
        }
        return this.showErrMsg = true;
      },
      discardEdit: function () {
        console.log('discard edit profile button clicked');
        this.showPwdEditBtn = this.showProfileEditBtn = true;
        return this.showEdit = false;
      },
      editPwd: function () {
        if(this.showEdit) {
          this.showEdit = false;
        }
        console.log('edit pwd button clicked');
        this.showPwdEditBtn = this.showProfileEditBtn = false;
        return this.showPwdChange = true;
      },
      submitPwdChange: function () {
        if(this.currentPwd.trim() && this.newPwd.trim() &&
          this.confirmNewPwd.trim()) {
            if(this.newPwd == this.confirmNewPwd) {
              this.$http.post(this.pwdChangeURL, {
                newPwd: this.newPwd
              }).
                then(function (res) {
                  console.log('response from pwd change', res.data);
                  this.showPwdChange = false;
                  return this.showPwdEditBtn = this.showProfileEditBtn = true;
                }.bind(this), function (info) {
                  this.showPwdErrMsg = true;
                  return console.log('info obj', info);
                }.bind(this));
            }
            this.currentPwd = this.newPwd = this.confirmNewPwd = '';
            return this.showPwdChngErrMsg = true;
          }
        return this.showPwdChngErrMsg = true;
      },
      discardPwdChange: function () {
        console.log('discard pwd change');
        this.showPwdEditBtn = this.showProfileEditBtn = true;
        return this.showPwdChange = false;
      }
    },
    events: {
      "profileCreated": function () {
        this.hasPage = true;
        return this.hasPhoto = true;
      }
    },
    ready: function () {
      this.fname = this.userProfileInfo.fname;
      this.lname = this.userProfileInfo.lname;
      this.fullname = this.userProfileInfo.fname +' '+ this.userProfileInfo.lname;
      this.status = this.userProfileInfo.status;
      this.email = this.userProfileInfo.email;
      this.hasPage = this.userProfileInfo.hasPage;
      var $appLabel = jQ('#app-label');
      $appLabel.text('Socialify | Profile');
    }
  };
};
