module.exports = function (jQ, socket, userActivityData) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        feedModalContent: {},
        friendStatusChangeURL: '/users/status',
        friendPostChangeURL: '/users/posts',
        postCommentsURL: '/users/posts/comments',
        friendCommentURLPrefix: '/users/',
        friendCommentURLSuffix: '/comments',
        taggedFriendURLPrefix: '/users/posts/',
        taggedFriendURLSuffix: '/tag',
        friendLikeCommentURL: '/users/posts/comments',
        showCommentInput: false,
        commentFeedContent: '',
        friendEmail: '',
        commentOnFriendPostURLPrefix: '/users/posts/',
        commentOnFriendPostURLSuffix: '/friends/comments',
        otherActivity: []
      };
    },
    props: ['userActivity', 'appTrends', 'email'],
    computed: {},
    methods: {
      getActivity: function () {
        console.log('getActivity btn clicked!');
        console.log('avtivity link txt', this.$els.activityLink.textContent);
        var
          lintTxt = this.$els.activityLink.textContent,
          arr = lintTxt.split(' '),
          arrLen = arr.length,
          person = '',
          fname = '',
          lname = '',
          namelen = arr[2].length,
          pidLen = arr[arrLen - 1].length,
          friendEmail = arr[2].substring(1, namelen - 1),
          postID = arr[arrLen - 1].substring(1, pidLen - 1),
          commentID = arr[arrLen - 1].substring(1, pidLen - 1),
          indx = arr.indexOf('postID') + 1,
          commentPostID = arr[indx].substring(1, (arr[indx].length - 1)),
          commentedURL = this.friendCommentURLPrefix + commentPostID +
            this.friendCommentURLSuffix,
          taggedURL = this.taggedFriendURLPrefix + postID +
            this.taggedFriendURLSuffix;
        console.log('splitted activity arr1', arr);
        this.friendEmail = friendEmail;
        if(lintTxt.indexOf('status') != -1) {
          console.log('there was a status change!');
          console.log('friend email', friendEmail);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            this.$http.get(this.friendStatusChangeURL, {
              email: friendEmail
            }).
              then(function (res) {
                console.log('response from view friend status', res.data);
                this.feedModalContent = {};
                this.feedModalContent.newStatus = res.data;
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
        if(lintTxt.indexOf('tagged') != -1) {
          console.log('there was a tag friend change!');
          console.log('post id is', postID);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            console.log('friend email is', friendEmail);
            this.$http.get(taggedURL).
              then(function (res) {
                console.log('response from view friend like post', res.data);
                this.feedModalContent = {};
                this.feedModalContent.title = res.data.title;
                this.feedModalContent.postID = res.data.postID;
                this.feedModalContent.likes = res.data.likes;
                this.feedModalContent.via = res.data.via;
                this.feedModalContent.tagged = res.data.tagged;
                if(res.data.text) {
                  this.feedModalContent.text = res.data.text;
                }
                if(res.data.img) {
                  this.feedModalContent.img = '<img src="' + res.data.img +
                    '" alt="' + res.data.title +'s image">';
                }
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
        if((lintTxt.indexOf('liked') != -1) &&
          (lintTxt.indexOf('comment') != -1)) {
          console.log('there was a like comment change!');
          console.log('post id is', commentPostID);
          console.log('comment ID is', commentID);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            console.log('friend email is', friendEmail);
            this.$http.get(this.friendLikeCommentURL, {
              postID: commentPostID,
              commentID: commentID
            }).
              then(function (res) {
                console.log('response from friend like comment', res.data);
                this.feedModalContent = {};
                this.feedModalContent.title = res.data.post.title;
                this.feedModalContent.postID = res.data.post.postID;
                this.feedModalContent.via = res.data.via;
                this.feedModalContent.tagged = res.data.tagged;
                if(res.data.post.text) {
                  this.feedModalContent.postText = res.data.post.text;
                }
                if(res.data.post.img) {
                  this.feedModalContent.postImg = '<img src="' + res.data.post.img +
                    '" alt="' + res.data.post.title +'s image">';
                }
                this.feedModalContent.postLikes = res.data.post.likes;
                this.feedModalContent.commentID = res.data.comments.commentID;
                this.feedModalContent.commentAuthor = res.data.comments.author;
                this.feedModalContent.commentText = res.data.comments.text;
                this.feedModalContent.commentLikes = res.data.comments.likes;
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
        if((lintTxt.indexOf('commented') != -1) &&
          (lintTxt.indexOf('post') != -1)) {
          console.log('there was a comment change!');
          console.log('post id is', commentPostID);
          console.log('comment ID is', commentID);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            console.log('friend email is', friendEmail);
            this.$http.get(commentedURL, {
              commentID: commentID
            }).
              then(function (res) {
                console.log('response from friend new comment', res.data);
                this.feedModalContent = {};
                this.feedModalContent.title = res.data.post.title;
                this.feedModalContent.owner = res.data.post.owner;
                this.feedModalContent.postID = res.data.post.postID;
                this.feedModalContent.via = res.data.via;
                this.feedModalContent.tagged = res.data.tagged;
                if(res.data.post.text) {
                  this.feedModalContent.postText = res.data.post.text;
                }
                if(res.data.post.img) {
                  this.feedModalContent.postImg = '<img src="' + res.data.post.img +
                    '" alt="' + res.data.post.title +'s image">';
                }
                this.feedModalContent.postLikes = res.data.post.likes;
                this.feedModalContent.commentID = res.data.comments.commentID;
                this.feedModalContent.commentAuthor = res.data.comments.author;
                this.feedModalContent.commentText = res.data.comments.text;
                this.feedModalContent.commentLikes = res.data.comments.likes;
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
        if((lintTxt.indexOf('liked') != -1) &&
          (lintTxt.indexOf('post') != -1)) {
          console.log('there was a like post change!');
          console.log('post id is', postID);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            console.log('friend email is', friendEmail);
            this.$http.get(this.friendPostChangeURL, {
              postID: postID
            }).
              then(function (res) {
                console.log('response from view friend like post', res.data);
                this.feedModalContent = {};
                this.feedModalContent.title = res.data.title;
                this.feedModalContent.owner = res.data.owner;
                this.feedModalContent.postID = res.data.postID;
                this.feedModalContent.likes = res.data.likes;
                this.feedModalContent.via = res.data.via;
                this.feedModalContent.tagged = res.data.tagged;
                if(res.data.text) {
                  this.feedModalContent.text = res.data.text;
                }
                if(res.data.img) {
                  this.feedModalContent.img = '<img src="' + res.data.img +
                    '" alt="' + res.data.title +'s image">';
                }
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
        if(lintTxt.indexOf('post') != -1) {
          console.log('there was a post change!');
          console.log('post id is', postID);
          if(arr[0] != 'You') {
            person = arr[0] +' '+ arr[1];
            console.log('the person is', person);
            console.log('friend email is', friendEmail);
            this.$http.get(this.friendPostChangeURL, {
              postID: postID
            }).
              then(function (res) {
                console.log('response from view friend new post', res.data);
                this.feedModalContent = {};
                this.feedModalContent.owner = res.data.owner;
                this.feedModalContent.title = res.data.title;
                this.feedModalContent.postID = res.data.postID;
                this.feedModalContent.likes = res.data.likes;
                this.feedModalContent.via = res.data.via;
                this.feedModalContent.tagged = res.data.tagged;
                if(res.data.text) {
                  this.feedModalContent.text = res.data.text;
                }
                if(res.data.img) {
                  this.feedModalContent.img = '<img src="' + res.data.img +
                    '" alt="' + res.data.title +'s image">';
                }
                return jQ('#feedModalBtn').trigger('click');
              }.bind(this), function (info) {
                return console.log('info obj', info);
              }.bind(this));
          }
          return null;
        }
      },
      getOtherActivity: function () {
        console.log('get other activities btn clicked');
        this.otherActivity = userActivityData.smembers('set').reverse();
        console.log('contents of userActivityData from getOtherActivity:', this.otherActivity);
        return jQ('#otherActivitiesModalBtn').trigger('click');
      },
      viewOtherActivity: function (activity) {
        console.log('other activity to be viewed:', activity);
        console.log('initial value of activity link text:', this.$els.activityLink.textContent);
        this.$els.activityLink.textContent = activity;
        console.log('updated vakue of activity link text:', this.$els.activityLink.textContent);
        jQ('#closeOtherActivitiesModal').trigger('click');
        //return jQ('#feedModalBtn').trigger('click');
        return this.getActivity();
      },
      feedComment: function (item) {
        if(this.feedModalContent.newStatus) {
          return this.showCommentInput = false;
        }
        console.log('feed comment btn clicked');
        console.log('the item to be commented on is', item);
        return this.showCommentInput = true;
      },
      feedLikes: function (item) {
        console.log('feed likes btn clicked');
        console.log('postID', item.postID);
        console.log('initial post likes', item.likes);
        var
          postTitle = item.title,
          postID = item.postID,
          likePostURL = '/users/posts/' + postID + '/friends/likes';
        this.$http.get(likePostURL).
          then(function (res) {
            console.log('response from new comment submission', res);
            //this.feedModalContent.likes += 1
            /*NB Because when a comment is made for a post on the activity feed,
            the post doesnt belong to the commenter, ther's no need to update
            the commenter's post array, all that's needed is to update the
            post's comments arry on the backend and the user's activity feed
            but we need to update the owner of the post*/
            socket.emit('likedFriendPost', postTitle, postID);//required to update feed
            return this.$dispatch('likedPost', postTitle);
          }.bind(this), function (info) {
            return console.log('info obj', info);
          }.bind(this));
      },
      feedShare: function (item) {
        console.log('feed share btn clicked postID to be shared', item.postID);
        if(this.feedModalContent.newStatus) {
          return null;
        }
        var
          postID = item.postID,
          postTitle = item.title,
          postOwner = item.owner,
          URL = '/users/posts/' + postID + '/friends/share';
        this.$http.post(URL, {
          data: postOwner
        }).
          then(function (res) {
            console.log('response from post share', res);
            var newPostID = res.data;
            /*NB Because when a comment is made for a post on the activity feed,
            the post doesnt belong to the commenter, ther's no need to update
            the commenter's post array, all that's needed is to update the
            post's comments arry on the backend and the user's activity feed
            but we need to update the owner of the post*/
            this.$dispatch('sharedPost', postTitle);
            return socket.emit('sharedPost', this.email, postTitle, newPostID, postOwner);//required to update feed
          }.bind(this), function (info) {
            return console.log('info obj', info);
          }.bind(this));
      },
      submitFeedComment: function () {
        console.log('message to send', this.commentFeedContent);
        if(this.commentFeedContent) {
          var data = {
            postTitle: this.feedModalContent.title,
            postID: this.feedModalContent.postID,
            author: this.email,
            postOwner: this.feedModalContent.owner,
            comment: this.commentFeedContent
          },
          postID = this.feedModalContent.postID,
          postTitle = this.feedModalContent.title,
          postOwner = this.feedModalContent.owner,
          commentOnFriendPostURL = this.commentOnFriendPostURLPrefix +  postID +
            this.commentOnFriendPostURLSuffix;
          console.log('data to be sent for feed comment', data);
          this.$http.post(commentOnFriendPostURL, {
            data: data
          }).
            then(function (res) {
              console.log('response from new comment submission', res);
              var commentID = res.data;
              /*NB Because when a comment is made for a post on the activity feed,
              the post doesnt belong to the commenter, ther's no need to update
              the commenter's post array, all that's needed is to update the
              post's comments arry on the backend and the user's activity feed
              but we need to update the owner of the post*/
              socket.emit('madeComment', postTitle, postID, commentID);//required to update feed
              return this.$dispatch('commentOnPost', postTitle);
            }.bind(this), function (info) {
              return console.log('info obj', info);
            }.bind(this));
        }
        this.showCommentInput = false;
        this.commentFeedContent = '';
        return jQ('#closeFeedModal').trigger('click');
      },
      discardFeedComment: function () {
        this.showCommentInput = false;
        this.commentFeedContent = '';
        return jQ('#closeFeedModal').trigger('click');
      }
    }
  };
};
