module.exports = function ($, socket) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        showErrMsg: false,
        pixUploadUrl: '/users/profilepix/' + this.userEmail,
        showUpload: false,
        showInput: true
      };
    },
    props: ['userEmail'],
    methods: {
      uploadPix: function () {
        console.log('value of file elem', this.$els.userPix.value);
        console.log('file name', this.$els.userPix.files[0].name);
        console.log('total file obj', this.$els.userPix);
        console.log('file obj sent to server', this.$els.userPix.files[0]);
        console.log('upload url', this.pixUploadUrl);
        if(this.$els.userPix.value.trim()) {
          var
            xhr = new XMLHttpRequest(),
            form = new FormData();
          //NB 'profilePix' is the form field that holds the uploaded pix
          form.append('profilePix', this.$els.userPix.files[0]);
          console.log('upload form data', form);
          xhr.open('POST', this.pixUploadUrl);
          /*xhr.upload.addEventListener('progress', function (e) {
            if(e.lengthComputable) {
              var pcent = Math.round((e.loaded * 100) / e.total);
              $('.file-upload-progress').css('width', (pcent + '%'));
            }
          }.bind(this));*/
          xhr.addEventListener('load', function (res) {//on success
            console.log('response from profile pix upload', res);
            this.showInput = false;
            this.$dispatch('profileCreated');
            return socket.emit('userPhotoUploaded');
          }.bind(this));
          xhr.addEventListener('error', function (info) {//on error
            this.showInput = false;
            return console.log('info obj', info);
          }.bind(this));
          xhr.send(form);
            return this.$els.userPix.value = null;
        }
        return this.showErrMsg = true;
      }
    }
  };
};
