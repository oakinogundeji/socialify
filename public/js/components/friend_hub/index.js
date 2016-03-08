module.exports = function (jQ, socket) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        showCommentsSuccessMsg: false,
        showCommentsErrMsg: false,
        showLikeErrMsg: false,
        newFriendPostComment: '',
        showCommentsWarning: false,
        showCommentsLikeErrMsg: false,
        friendPostLikesURLprefix: '/users/posts/',
        friendPostLikesURLsuffix: '/likes',
        friendPostCommentInfo: {},
        friendPostCommentsURLprefix: '/users/posts/',
        friendPostCommentsURLsuffix: '/friends/comments',
        friendCommentsLikesURL: '/users/comments/likes'
      };
    },
    props: ['friendHubData', 'userProfileInfo'],
    methods: {
      commentDetails: function (post) {
        console.log('title of post on which comment to be made', post.title);
        //first clear any existing data
        this.friendPostCommentInfo = {};
        //then rehydrate with new data
        this.friendPostCommentInfo = {
          title: post.title,
          owner: post.owner,
          author: this.userProfileInfo.email,
          postID: post.postID
        };
        return console.log('info for post to be commented on', this.friendPostCommentInfo);
      },
      likePost: function (item) {
        console.log('like ' + item.owner +' post btn clicked');
        console.log(item.title +' was liked one time');
        console.log('add 1 to like count for post with ID', item.postID);
        console.log('intial like count of ' + item.title +' is ' + item.likes);
        var
          postLikesURL = this.friendPostLikesURLprefix + item.postID +
           this.friendPostLikesURLsuffix,
          postTitle = item.title,
          postOwner = item.owner,
          postID = item.postID;
        this.$http.post(postLikesURL).
          then(function (res) {
            console.log('response from increatse friend like', res);
            console.log('successfully increased like count of ', postTitle);
            item.likes += 1;
            this.$dispatch('likedFriendPost', postOwner, postTitle);
            socket.emit('likedFriendPost', postTitle, postID);
            return console.log('new like count ', item.likes);
          }.bind(this), function (info) {
            console.log('info obj', info);
            console.log('failed to increase like count of ', item.title);
            jQ('#show-like-err-msg').hide();
            this.showLikeErrMsg = true;
            return jQ('#show-like-err-msg').fadeIn(200).fadeOut(3000);
          }.bind(this));
      },
      likeFriendPostComment: function (item, e) {
        console.log('comment by ' + item.author +' was liked once');
        console.log('intial like count of is ' + item.likes);
        console.log('dom elem ', e.target);
        var
          eDiv = jQ(e.target).parent().find('div')[0],
          commentID = item.commentID,
          postID = item.postID,
          author = item.author;
        console.log('eDiv is', eDiv);
        this.$http.get(this.friendCommentsLikesURL, {
          commentID: commentID
        }).
          then(function (res) {
            console.log('response from increatse friend comment like', res);
            console.log('successfully increased like count of comment by ', author);
            item.likes += 1;
            this.$dispatch('likedComment', author);
            socket.emit('likedComment', author, postID, commentID);
            return console.log('new like count ', item.likes);
          }.bind(this), function (info) {
            console.log('info obj', info);
            console.log('failed to increase like count of comment by ', author);
            jQ(eDiv).hide();
            return jQ(eDiv).fadeIn(200).fadeOut(3000);
          }.bind(this));
      },
      submitFriendComment: function () {
        var self = this;
        if(this.newFriendPostComment.trim()) {
          var
            data = {
              postTitle: this.friendPostCommentInfo.title,
              postOwner: this.friendPostCommentInfo.owner,
              postID: this.friendPostCommentInfo.postID,
              author: this.friendPostCommentInfo.author,
              comment: this.newFriendPostComment
            },
            friendEmail = this.friendPostCommentInfo.owner,
            postTitle = this.friendPostCommentInfo.title,
            postID = this.friendPostCommentInfo.postID,
            URL = this.friendPostCommentsURLprefix + postID + this.friendPostCommentsURLsuffix;
          console.log('comment data to be sent to backend', data);
          this.$http.post(URL, {
            data: data
          }).
            then(function (res) {
              console.log('response from new comment on friend post submission', res);
              var commentID = res.data;
              this.newFriendPostComment = '';
              this.showCommentSuccessMsg = true;
              console.log('postID', self.friendPostCommentInfo.postID);
              socket.emit('madeComment', postTitle, postID, commentID);//required to update feed
              self.friendPostCommentInfo = {};
              this.$dispatch('commentOnPost', postTitle);
              return this.$dispatch('actedOnFriendHub', friendEmail);//allows us to refresh the view
            }.bind(this), function (info) {
              this.newFriendPostComment = '';
              console.log('info obj', info);
              jQ('#show-comment-err-msg').hide();
              this.showCommentsErrMsg = true;
              return jQ('#show-comment-err-msg').fadeIn(200).fadeOut(3000);
            }.bind(this));
          jQ('#close-friend-comments-Modal-btn').trigger('click');
          return console.log('submit comments on friend post btn clicked');
        }
        return this.showCommentsWarning = true;
      },
      discardFriendComment: function () {
        this.newFriendPostComment = '';
        jQ('#close-friend-comments-Modal-btn').trigger('click');
        return console.log('discard comments on friends post btn clicked');
      }
    }
  };
};
