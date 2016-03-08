module.exports = function (jQ, socket) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        chatMsgs: [],
        newMsg: '',
        newChatMsg: {},
        onlineFriends: [],
        chatTarget: '',
        showWarnMsg: false
      };
    },
    props: ['userProfileInfo'],
    computed: {},
    methods: {
      sendChatMsg: function () {
        if(this.newMsg.trim() && this.chatTarget.trim()) {
          this.showWarnMsg = false;
          jQ('#chat-show-warn-msg').hide();
          console.log('new msg', this.newMsg);
          this.newChatMsg = {
            from: this.userProfileInfo.email,
            to: this.chatTarget,
            msg: this.newMsg
          };
          console.log('new chat msg', this.newChatMsg);
          this.newMsg = '';
          return socket.emit('newChatMsg', this.newChatMsg);
        }
        jQ('#chat-show-warn-msg').hide();
        this.showWarnMsg = true;
        return jQ('#chat-show-warn-msg').fadeIn(200).fadeOut(3000);
      },
      setChatTarget: function (friend) {
        console.log('chat target is ', friend.email);
        this.chatTarget = friend.email;
        return socket.emit('getChatMsgs', this.userProfileInfo.email, this.chatTarget);
      },
      discardChatMsg: function () {
        return this.newMsg = '';
      }
    },
    events: {},
    created: function () {
      var self = this;
      console.log('requesting for available online friends');
      socket.emit('getOnlineFriends');
      socket.on('availableChatMsgs', function (msgs) {
        console.log('chat msgs received from server involving ' + self.userProfileInfo.email +
        ' and ' + self.chatTarget + ' are ' + msgs);
        self.chatMsgs = [];
        return msgs.forEach(function (msg) {
          return self.chatMsgs.push(msg);
        });
      });
      //-----------------------------------------------------
      socket.on('nowOnline', function (newfriend) {
        console.log('notified that a new friend has come online', newfriend);
        console.log('initial friend list', self.onlineFriends);
        console.log('nuber of freiends already online', self.onlineFriends.length);
        var hasFrnd = false;
        self.onlineFriends.forEach(function (friend) {
          if(friend.email == newfriend.email) {
            return hasFrnd = true;
          }
          return null;
        });
        console.log('hasFrnd', hasFrnd);
        if(hasFrnd) {
          console.log('friend already exists online, returning null');
          return null;
        }
        self.onlineFriends.push(newfriend);
        return console.log('updated friend list', self.onlineFriends);
      });
      socket.on('nowOffline', function (friendEmail) {
        console.log('received now offline event about', friendEmail);
        var
          hasFrnd = false,
          targIndx;
        self.onlineFriends.forEach(function (friend, indx) {
          if(friend.email == friendEmail) {
            targIndx = indx;
            return hasFrnd = true;
          }
          return null;
        });
        console.log('initial online friend list', self.onlineFriends);
        if(hasFrnd) {
          console.log('about to delete ' + friendEmail +' from online friends list');
          self.onlineFriends.splice(targIndx, 1);
          console.log('deleted ' + friendEmail + ' from online friends list');
          return console.log('final online friends list ', self.onlineFriends);
        }
        console.log('friend does not exist online so no action taken');
        return null;
      });
      //------------------------------------------------------
      socket.on('availableOnlineFriends', function (data) {
        //first empty the lsit of avaliable online friends
        self.onlineFriends = [];
        //rehydrate the list with the new data
        data.forEach(function (friend) {
          return self.onlineFriends.push(friend);
        });
        return console.log('available online friends', data);
      });
      //--------------------------------------------------------
      socket.on('noOnlineFriends', function () {
        self.onlineFriends = [];
        return console.log('no online friends available');
      });
      //-----------------------------------------------------
      socket.on('newChatMsg', function (data) {
        console.log('chat msg successfully sent to server');
        return self.chatMsgs.unshift(data);
      })
    }
  };
};
