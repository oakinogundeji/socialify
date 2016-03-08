module.exports = function (jQ, socket) {
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
        pixUploadURL: '/users/profilepix/',
        profileUpdateURLPrefix: '/users/',
        profileUpdateURLSuffix: '/edit',
        pwdChangeURL: '/users/' + this.userEmail +'/changepwd',
        showErrMsg: false,
        showProfileEditBtn: true,
        showPwdErrMsg: false,
        showPwdChange: false,
        showPwdEditBtn: true,
        currentPwd: '',
        newPwd: '',
        confirmNewPwd: '',
        showPwdChngErrMsg: false,
        showWarningMsg: false,
        showPwdChngSuccessMsg: false
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
        //this.showPwdEditBtn = this.showProfileEditBtn = false;
        return jQ('#edit-profile-details-Modal-Btn').trigger('click');
      },
      submitEdit: function () {
        console.log('first name', this.editFname);
        console.log('last name', this.editLname);
        console.log('email', this.editEmail);
        if(this.$els.newUserPix.value.trim() &&
      (!(this.editFname.trim() || this.editLname.trim()))) {
          return this.submitNewPix();
        }
        if(this.editFname.trim() || this.editLname.trim() ||
          this.editEmail.trim()) {
            //this.showProfileEditBtn = true;
            if(this.$els.newUserPix.value.trim()) {
              this.submitNewPix();
            }
            var URL = this.profileUpdateURLPrefix + this.email +
             this.profileUpdateURLSuffix;
          this.$http.post(URL, {
            firstName: this.editFname || null,
            lastName: this.editLname || null,
            email: this.editEmail || null
          }).
            then(function (res) {
              console.log('response from edit profile data', res.data);
              return jQ('#close-edit-profile-details-Modal-btn').trigger('click');
            }.bind(this), function (info) {
              console.log('info obj', info);
              jQ('#show-err-msg').hide();
              this.showErrMsg = true;
              return jQ('#show-err-msg').fadeIn(200).fadeOut(3000);
            }.bind(this));
          return this.editFname = this.editLname = this.editEmail = '';
        }
        else {
          //this.showProfileEditBtn = true;
          jQ('#show-warning-msg').hide();
          this.showWarningMsg = true;
          return jQ('#show-warning-msg').fadeIn(200).fadeOut(3000);
        }
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
            form = new FormData(),
            URL = this.pixUploadURL + this.email;
          //NB 'profilePix' is the form field that holds the uploaded pix
          form.append('profilePix', this.$els.newUserPix.files[0]);
          console.log('upload form data', form);
          xhr.open('POST', URL);
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
            this.$els.newUserPix.value = null;
            return jQ('#close-edit-profile-details-Modal-btn').trigger('click');
        }
        else {
          jQ('#show-err-msg').hide();
          this.showErrMsg = true;
          return jQ('#show-err-msg').fadeIn(200).fadeOut(3000);
        }
      },
      discardEdit: function () {
        console.log('discard edit profile button clicked');
        this.showPwdEditBtn = this.showProfileEditBtn = true;
        return jQ('#close-edit-profile-details-Modal-btn').trigger('click');
      },
      editPwd: function () {
        if(this.showEdit) {
          this.showEdit = false;
        }
        console.log('edit pwd button clicked');
        //this.showPwdEditBtn = this.showProfileEditBtn = false;
        return jQ('#chng-pwd-Modal-Btn').trigger('click');
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
                  //this.showPwdChange = false;
                  jQ('#close-chng-pwd-Modal-btn').trigger('click');
                  jQ('#show-pwd-chng-success-msg').hide();
                  this.showPwdChngSuccessMsg = true;
                  return jQ('#show-pwd-chng-success-msg').fadeIn(200).fadeOut(3000);
                }.bind(this), function (info) {
                  console.log('info obj', info);
                  jQ('#show-pwd-err-msg').hide();
                  this.showPwdErrMsg = true;
                  return jQ('#show-pwd-err-msg').fadeIn(200).fadeOut(3000);
                }.bind(this));
            }
            else {
              this.currentPwd = this.newPwd = this.confirmNewPwd = '';
              jQ('#show-pwd-chng-err-msg').hide();
              this.showPwdChngErrMsg = true;
              return jQ('#show-pwd-chng-err-msg').fadeIn(200).fadeOut(3000);
            }
          }
          else {
            jQ('#show-pwd-chng-err-msg').hide();
            this.showPwdChngErrMsg = true;
            return jQ('#show-pwd-chng-err-msg').fadeIn(200).fadeOut(3000);
          }
      },
      discardPwdChange: function () {
        console.log('discard pwd change');
        this.showPwdEditBtn = this.showProfileEditBtn = true;
        return jQ('#close-chng-pwd-Modal-btn').trigger('click');
      }
    },
    events: {
      "profileCreated": function () {
        this.hasPage = true;
        return this.hasPhoto = true;
      },
      'updateProfileInfo': function (data) {
        this.fname = data.fname;
        this.lname = data.lname;
        this.fullname = data.fname +' '+ data.lname;
        this.status = data.status;
        this.email = data.email;
        this.hasPage = data.hasPage;
      }
    },
    ready: function () {
      socket.on('updatedUserProfile', function () {
        console.log('profile has been updated');
        return this.$dispatch('getUpdateDProfile');//require for realtime profile update
      }.bind(this));
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
