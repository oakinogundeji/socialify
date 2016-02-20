module.exports = function ($, socket) {
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
        return this.showWarnMsg = true;
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
    ready: function () {
      var self = this;
      //socket.emit('getChatMsgs', this.userProfileInfo.email, this.chatTarget);
      socket.on('availableChatMsgs', function (msgs) {
        console.log('chat msgs received from server involving ' + self.userProfileInfo.email +
        ' and ' + self.chatTarget + ' are ' + msgs);
        self.chatMsgs = [];
        return msgs.forEach(function (msg) {
          return self.chatMsgs.push(msg);
        });
      });
      //-----------------------------------------------------
      socket.on('updateOnlineFriends', function () {
        return socket.emit('getOnlineFriends');
      });
      socket.emit('getOnlineFriends');
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
