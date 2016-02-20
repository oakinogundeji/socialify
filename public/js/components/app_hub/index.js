module.exports = function (jQ, socket, generateRandomFileName) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        userPageInfo: {
          pageMetaData: {
            status: '',
            title: '',
            description: ''
          },
          userPosts: [],
          postComments: []
        },
        newPostsURL: '/users/posts/newposts',
        postCommentsURL: '/users/posts/comments',
        postLikesURLprefix: '/users/posts/',
        postLikesURLsuffix: '/likes',
        postsImgsURLprefix: '/users/posts/newposts/',
        postsImgsURLsuffix: '/imgs',
        statusUpdateURL: '/users/status',
        showNewPostForm: false,
        newPostTitle: '',
        newPostContent: '',
        showErrMsg: false,
        showPostSuccessMsg: false,
        showPostErrMsg: false,
        changeStatus: false,
        newStatus: '',
        chngStatusBtn: true,
        showStatusErrMsg: false,
        showStatusSuccessMsg: false,
        showStatusWarnMsg: false,
        showCommentsForm: false,
        newPostComment: '',
        showCommentsWarning: false,
        commentInfo: {},
        showCommentSuccessMsg: false,
        showCommentErrMsg: false,
        showLikeErrMsg: false,
        showShareErrMsg: false,
        showShareSuccessMsg: false,
        showTagErrMsg: false,
        showTagSuccessMsg: false
      };
    },
    computed: {
      showHubPosts: function () {
        if(this.userPageInfo.userPosts.length > 0) {
          return true;
        }
        return false;
      }
    },
    props: ['userProfileInfo'],
    methods: {
      cr8Post: function () {
        return this.showNewPostForm = true;
      },
      editStatus: function () {
        console.log('edit status btn clicked');
        this.chngStatusBtn = false;
        return this.changeStatus = true;
      },
      submitStatus: function () {
        if(this.newStatus.trim()) {
          this.$http.post(this.statusUpdateURL, {
            status: this.newStatus
          }).
            then(function (res) {
              console.log('response from new post submission', res);
              this.newStatus = '';
              this.changeStatus = false;
              this.chngStatusBtn = true;
              this.showStatusSuccessMsg = true;
              return socket.emit('userStatusChanged');//required to update feed
            }.bind(this), function (info) {
              this.newStatus = '';
              this.changeStatus = false;
              this.chngStatusBtn = true;
              console.log('info obj', info);
              return this.showStatusErrMsg = true;
            }.bind(this));
        }
        return this.showStatusWarnMsg
      },
      discardStatus: function () {
        this.newStatus = '';
        this.changeStatus = false;
        return this.chngStatusBtn = true;
      },
      sendPostImg: function (title) {
        console.log('file to be uploaded', this.$els.postImg.files[0]);
        var
            imgUploadUrl = this.postsImgsURLprefix + title + this.postsImgsURLsuffix,
            xhr = new XMLHttpRequest(),
            form = new FormData();
          form.append('img', this.$els.postImg.files[0]);

          xhr.open('POST', imgUploadUrl);
          xhr.addEventListener('load', function (res) {
            console.log('response from new post img submission', res);
            this.showNewPostForm = false;
            return this.showPostSuccessMsg = true;
          }.bind(this));
          xhr.addEventListener('error', function (info) {
            this.showNewPostForm = false;
            this.showPostErrMsg = true;
            return console.log('info obj', info);
          }.bind(this));
          xhr.send(form);
        return console.log('data sent', form);
      },
      submitPost: function () {
        var self = this;
        if(this.newPostTitle.trim() &&
        (this.newPostContent.trim() || this.$els.postImg.value.trim())) {
          console.log('new post title', this.newPostTitle);
          console.log('new post content', this.newPostContent);
          console.log('new post img value', this.$els.postImg.value);
          var
            data = {
              owner: this.userProfileInfo.email,
              title: this.newPostTitle,
              text: this.newPostContent || '',
              img: '',
              via: ''
            },
            imgName;
          if(this.$els.postImg.value.trim()) {
            imgName = this.$els.postImg.value.split('\\')[2];
            data.img = imgName;
            this.sendPostImg(data.title);
          }
          this.$http.post(this.newPostsURL, {
            data: data
          }).
            then(function (res) {
              console.log('response from new post submission', res);
              this.showNewPostForm = false;
              this.showPostSuccessMsg = true;
              return socket.emit('newPostCreated', self.userProfileInfo.email);//required to update feed
            }.bind(this), function (info) {
              this.showNewPostForm = false;
              console.log('info obj', info);
              return this.showPostErrMsg = true;
            }.bind(this));
          //reset input fields
          this.newPostTitle = this.newPostContent = this.$els.postImg.value = '';
          return console.log('new post data sent to server', data);
        }
        return this.showErrMsg = true;
      },
      discardPost: function () {
        this.newPostTitle = this.newPostContent = this.$els.postImg.value = '';
        return this.showNewPostForm = false;
      },
      likePost: function (item) {
        console.log('like posts btn clicked');
        console.log(item.title +' was liked one time');
        console.log('add 1 to like count for post with ID', item.postID);
        console.log('intial like count of ' + item.title +' is ' + item.likes);
        var postLikesURL = this.postLikesURLprefix + item.postID + this.postLikesURLsuffix;
        this.$http.post(postLikesURL).
          then(function (res) {
            console.log('response from increatse like', res);
            console.log('successfully increased like count of ', item.title);
            item.likes += 1;
            return console.log('new like count ', item.likes);
          }.bind(this), function (info) {
            console.log('info obj', info);
            console.log('failed to increase like count of ', item.title);
            return this.showLikeErrMsg = true;
          }.bind(this));
      },
      sharePost: function () {
        return console.log('share post btn clicked');
      },
      tagFriends: function () {
        return console.log('tag friends btn clicked');
      },
      commentDetails: function (post) {
        console.log('title of post on which comment to be made', post.title);
        //first clear any existing data
        this.commentInfo = {};
        //then rehydrate with new data
        this.commentInfo = {
          title: post.title,
          owner: post.owner,
          author: this.userProfileInfo.email,
          postID: post.postID
        };
        return console.log('info for post to be commented on', this.postInfo);
      },
      submitComment: function () {
        var self = this;
        if(this.newPostComment.trim()) {
          var
            data = {
              postTitle: this.commentInfo.title,
              postOwner: this.commentInfo.owner,
              postID: this.commentInfo.postID,
              author: this.commentInfo.author,
              comment: this.newPostComment
            },
            imgName;
          console.log('comment data to be sent to backend', data);
          this.$http.post(this.postCommentsURL, {
            data: data
          }).
            then(function (res) {
              console.log('response from new comment submission', res);
              this.newPostComment = '';
              this.showCommentSuccessMsg = true;
              console.log('postID', self.commentInfo.postID);
              socket.emit('getUserPostsCommentsInfo', self.userPageInfo.userPosts);//required to update feed
              return self.commentInfo = {};
            }.bind(this), function (info) {
              this.newPostComment = '';
              console.log('info obj', info);
              return this.showCommentErrMsg = true;
            }.bind(this));
          jQ('#closeModal').trigger('click');
          return console.log('submit comments btn clicked');
        }
        return this.showCommentsWarning = true;
      },
      discardComment: function () {
        this.newPostComment = '';
        jQ('#closeModal').trigger('click');
        return console.log('discard comments btn clicked');
      },
      likeComment: function () {
        return console.log('like comment btn clicked');
      },
      shareComment: function () {
        return console.log('share comment btn clicked');
      },
      tagComment: function () {
        return console.log('tag comment btn clicked');
      }
    },
    events: {},
    created: function () {
      var self = this;
      //get user page info
      if(!this.userPageInfo.pageMetaData.title.trim()) {
        //console.log('user email to be sent to backend fro page info req', self.userProfileInfo.email);
        socket.emit('getUserPageInfo');
      }
      socket.on('userPageInfo', function (data) {
        var
          title = document.getElementsByTagName("title")[0],
          pgtitle = title.textContent;
        console.log('current page title', pgtitle);
        console.log('user has page', data);
        this.userPageInfo.pageMetaData.status = this.userProfileInfo.status;
        this.userPageInfo.pageMetaData.title = data.title;
        this.userPageInfo.pageMetaData.description = data.description;
        title.textContent = data.title;
        console.log('requesting for user posts info from created socket hook');
        return socket.emit('getUserPostsInfo', self.userProfileInfo.email);
      }.bind(this));
      //get user posts data
      socket.on('noPostsInfo', function () {
        console.log('user has no posts up for now');
        return this.$route.router.go({name: 'hub'});
      }.bind(this));

      socket.on('userPostsInfo', function (posts) {
          console.log('user has posts', posts);
          //TODO update userPosts
          console.log('the updated users', posts);
          //on receipt of new posts 1st empty the array
          self.userPageInfo.userPosts = [];
          //then repopulate with new data
          posts.forEach(function (post) {
            return self.userPageInfo.userPosts.push(post);
        });
        return socket.emit('getUserPostsCommentsInfo', posts);
      });
      //get comments for user posts
      socket.on('noUserPostsCommentsInfo', function () {
        return this.$route.router.go({name: 'hub'});
      }.bind(this));

      socket.on('userPostsCommentsInfo', function (data) {
        self.userPageInfo.postComments = [];
        //TODO update postComments
        var commentsGrps = data.length;
        console.log('number of comments groups', commentsGrps);
        data.forEach(function (arr) {
          var
            pid = arr[0].postID,
            parentPost = self.userPageInfo.userPosts.filter(function (post) {
              return post.postID == pid;
            });
          console.log('parent post for ' + pid + ' has title of ' + parentPost[0].title);
          //1st empty the postsComments array
          parentPost[0].postsComments = [];
          //then rehydrate with new data
          return parentPost[0].postsComments = arr;
        });
        return this.$route.router.go({name: 'hub'});
      }.bind(this));
      //get updates for posts
      socket.on('userPostsUpdate', function (posts) {
        console.log('the updated posts', posts);
        //on receipt of new posts 1st empty the array
        self.userPageInfo.userPosts = [];
        //then repopulate with new data
        posts.forEach(function (post) {
          return self.userPageInfo.userPosts.push(post);
        });
      });
      socket.on('getUserPostsUpdate', function () {
        console.log('get user posts update received from backend in response to new img post');
        return socket.emit('getUserPostsInfo', self.userProfileInfo.email);
      })
    }//end of 'created'
  };//end of 'return {}'
};//end of module.exports
