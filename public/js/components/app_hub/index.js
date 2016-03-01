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
        taggedFriendsList: [],
        postTagInfo: {},
        newPostsURL: '/users/posts/newposts',
        postCommentsURL: '/users/posts/comments',
        postLikesURLprefix: '/users/posts/',
        postLikesURLsuffix: '/likes',
        postTagURLprefix: '/users/posts/',
        postTagURLsuffix: '/tag',
        postCommentsLikesURLprefix: '/users/posts/comments/',
        postCommentsLikesURLsuffix: '/likes',
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
        showTagErrMsg: false,
        showTagSuccessMsg: false,
        showTagWarning: false,
        showPostOwnerWarning: false
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
              this.$dispatch('userStatusChanged');
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
            imgName,
            postTitle = this.newPostTitle;
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
              var postID = res.data;
              console.log('post id for new post', postID);
              this.showNewPostForm = false;
              this.showPostSuccessMsg = true;
              this.$dispatch('newPostCreated', postTitle);
              return socket.emit('newPostCreated', this.userProfileInfo.email, postTitle, postID);//required to update feed
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
        var
          postLikesURL = this.postLikesURLprefix + item.postID + this.postLikesURLsuffix,
          postTitle = item.title,
          postID = item.postID;
        this.$http.post(postLikesURL).
          then(function (res) {
            console.log('response from increatse like', res);
            console.log('successfully increased like count of ', item.title);
            item.likes += 1;
            this.$dispatch('likedPost', postTitle);
            socket.emit('likedPost', postTitle, postID);
            return console.log('new like count ', item.likes);
          }.bind(this), function (info) {
            console.log('info obj', info);
            console.log('failed to increase like count of ', item.title);
            return this.showLikeErrMsg = true;
          }.bind(this));
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
        return console.log('info for post to be commented on', this.commentInfo);
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
            postTitle = this.commentInfo.title,
            postID = this.commentInfo.postID;
          console.log('comment data to be sent to backend', data);
          this.$http.post(this.postCommentsURL, {
            data: data
          }).
            then(function (res) {
              console.log('response from new comment submission', res);
              var commentID = res.data;
              this.newPostComment = '';
              this.showCommentSuccessMsg = true;
              console.log('postID', self.commentInfo.postID);
              socket.emit('getUserPostsCommentsInfo', self.userPageInfo.userPosts);
              socket.emit('madeComment', postTitle, postID, commentID)//required to update feed
              this.$dispatch('commentOnPost', postTitle);
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
      likeComment: function (comment) {
        console.log('like comment btn clicked');
        console.log('liked comment ID', comment.commentID);
        console.log('initial comments like count', comment.likes);
        var
          postCommentsLikesURL = this.postCommentsLikesURLprefix +
            comment.commentID + this.postCommentsLikesURLsuffix,
          commentAuthor = comment.author,
          commentID = comment.commentID,
          postID = comment.postID;
        console.log('post comments likes url', postCommentsLikesURL);
        this.$http.post(postCommentsLikesURL).
          then(function (res) {
            console.log('response from increatse like', res);
            console.log('successfully increased like count of ', comment.commentID);
            comment.likes += 1;
            this.$dispatch('likedComment', commentAuthor);
            socket.emit('likedComment', commentAuthor, postID, commentID);
            return console.log('new like count ', comment.likes);
          }.bind(this), function (info) {
            console.log('info obj', info);
            console.log('failed to increase like count of ', comment.commentID);
            return this.showLikeErrMsg = true;
          }.bind(this));
      },
      tagFriend: function (friend, e) {
        if(e.target.checked === true) {
          console.log('initial tagged friends list', this.taggedFriendsList);
          console.log('friend to be tagged is', friend);
          if(this.taggedFriendsList.indexOf(friend) == -1) {
            this.taggedFriendsList.push(friend);
          }
          return console.log('updated tagged friends list', this.taggedFriendsList);
        }
        if(e.target.checked === false) {
          console.log('about to remove friend from list if present');
          if(this.taggedFriendsList.indexOf(friend) != -1) {
            console.log('initial tagged friends list', this.taggedFriendsList);
            console.log('friend to be removed is', friend);
            this.taggedFriendsList.splice(this.taggedFriendsList.indexOf(friend), 1);
            return console.log('updated tagged friends list', this.taggedFriendsList);
          }
        }
        return null;
      },
      tagAllFriends: function () {
        if(this.$els.tagAllFriendsBtn.textContent == 'Tag all your friends') {
          console.log('tag all friends btn clicked');
          console.log('initial tagged friends list via taggallfriends', this.taggedFriendsList);
          this.userProfileInfo.friendsList.forEach(function (friend) {
            if(this.taggedFriendsList.indexOf(friend) == -1) {
               return this.taggedFriendsList.push(friend);
            }
          }.bind(this));
          this.$els.tagAllFriendsBtn.textContent = 'Untag all friends';
          console.log('final tagged friends list via taggallfriends', this.taggedFriendsList);
          return jQ('#tagFriends input[type="checkbox"]').each(function () {
            //access each elem in the preceding selection and then click on the checkbox
            return jQ(this).click();
          });
        }
        if(this.$els.tagAllFriendsBtn.textContent == 'Untag all friends') {
          console.log('untag all friends btn clicked');
          console.log('initial tagged friends list via taggallfriends', this.taggedFriendsList);
          this.taggedFriendsList = [];
          console.log('final tagged friends list via taggallfriends', this.taggedFriendsList);
          this.$els.tagAllFriendsBtn.textContent = 'Tag all your friends';
          return jQ('#tagFriends input[type="checkbox"]').each(function () {
            //access each elem in the preceding selection and then click on the checkbox
            return jQ(this).click();
          });
        }
      },
      tagDetails: function (post) {
        console.log('details of post to be tagged', post.postID);
        //1st empty the postTagInfo object
        this.postTagInfo = {};
        //then rehydrate with updated info
        return this.postTagInfo = {
          sourcePost: post,
          owner: post.owner,
          postID: post.postID,
          title: post.title
        };
      },
      submitTag: function () {
        var self = this;
        console.log('tag friends btn clicked!');
        console.log('tagged friends list is an array', Array.isArray(this.taggedFriendsList));
        if(this .userProfileInfo.email == this.postTagInfo.owner) {
          if(this.showPostOwnerWarning) {
            this.showPostOwnerWarning = false;
          }
          if(this.taggedFriendsList.length > 0) {
            if(this.showTagWarning) {
              this.showTagWarning = false;
            }
            var
              postID = this.postTagInfo.postID,
              postTagURL = this.postTagURLprefix + postID + this.postTagURLsuffix,
              data = {
                taggedFriendsList: this.taggedFriendsList
              },
              taggedFriendsList = this.taggedFriendsList,
              postTitle = this.postTagInfo.title;
            this.$http.post(postTagURL, data).
              then(function (res) {
                console.log('response from tagged friends', res.data);
                var sourcePost = this.postTagInfo.sourcePost;
                sourcePost.taggedFriends = [];
                console.log('postID of source post is', sourcePost.postID);
                console.log('source post tagged friends list', sourcePost.taggedFriends);
                console.log('updated post tagged friends list', res.data);
                res.data.forEach(function (friend) {
                  return sourcePost.taggedFriends.push(friend);
                });
                socket.emit('taggedFriends', postID, postTitle, taggedFriendsList);
                this.$dispatch('taggedFriends', postTitle, taggedFriendsList);
                return console.log('successfully tagged friends for post ', postID);
              }.bind(this), function (info) {
                console.log('info obj', info);
                console.log('failed to tag friends for post ', postID);
                return this.showTagErrMsg = true;
              }.bind(this));
              this.taggedFriendsList = [];
              jQ('#tagFriends input[type="checkbox"]').attr('checked', false);
              this.$els.tagAllFriendsBtn.textContent = 'Tag all your friends';
              return jQ('#closeTagModal').trigger('click');
          }
          return this.showTagWarning = true;
        }
        return this.showPostOwnerWarning = true;
      },
      discardTag: function () {
        this.taggedFriendsList = [];
        jQ('#tagFriends input[type="checkbox"]').attr('checked', false);
        jQ('#closeTagModal').trigger('click');
        return console.log('discard tag btn clicked!');
      }
    },
    events: {
      /*'updateUserPosts': function () {
        console.log('received updateUserPosts req from activity feed');
        return socket.emit('getUserPostsCommentsInfo', this.userPageInfo.userPosts);
      }*/
    },
    ready: function () {
      //when users status changes
      socket.on('updateStatus', function (data) {
        console.log('status change info', data.status);
        return this.userPageInfo.pageMetaData.status = data.status;
      }.bind(this));
    },
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
          pgtitle = title.textContent,
          $appLabel = jQ('#app-label');
        console.log('current page title', pgtitle);
        console.log('user has page', data);
        console.log('the appLabel is ', $appLabel.text());
        this.userPageInfo.pageMetaData.status = this.userProfileInfo.status;
        this.userPageInfo.pageMetaData.title = data.title;
        this.userPageInfo.pageMetaData.description = data.description;
        title.textContent = data.title;
        $appLabel.text('Socialify | Hub');
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
