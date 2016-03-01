module.exports = function (jQ) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        friendsListArray: [],
        resultsList: [],
        showLoading: false,
        friendFirstName: '',
        friendLastName: '',
        friendEmail: '',
        showSearch: false,
        friendSearchURL: '/users/list',
        friendsURL: '/users/friends',
        friendHubURL: '/users/hub',
        searchResultMsg: '',
        showSearchResultMsg: false,
        showFriendsErrMsg: false,
        showErrMsg: false,
        showResultsList: false,
        showFriendsList: false,
        showErrMsg: false,
        showRemoveErrMsg: false,
        friendSearchFirstName: '',
        friendSearchLastName: '',
        friendSearchEmail: '',
        friendListSearch: false,
        friendsListMsg: '',
        showFriendsListMsg: false,
        showViewHubErrMsg: false
      };
    },
    props: ['hasFriends', 'friendsList'],
    computed: {
    },
    methods: {
      submitSearch: function () {
        console.log('first name', this.friendFirstName);
        console.log('last name', this.friendLastName);
        console.log('email', this.friendEmail);
        if(this.friendFirstName.trim() || this.friendLastName.trim() ||
          this.friendEmail.trim()) {
            this.showLoading = true;
          this.$http.get(this.friendSearchURL, {
            firstName: this.friendFirstName || '',
            lastName: this.friendLastName || '',
            email: this.friendEmail || ''
          }).
            then(function (res) {
              console.log('response from friend search', res.data);
              this.showSearch = false;
              this.showSearchResultMsg = true;
              this.showLoading = false;
              if(typeof(res.data) == 'string') {
                return this.searchResultMsg = res.data;
              }
              this.searchResultMsg = res.data.msg;
              this.showResultsList = true;
              res.data.data.forEach(function (friend) {
                return this.resultsList.push(friend);
              }.bind(this));
              return jQ('#search-4-friends-Modal-Btn').trigger('click');
            }.bind(this), function (info) {
              this.showLoading = false;
              this.showSearch = false;
              this.showSearchResultMsg = true;
              this.searchResultMsg = 'There was an error conducting the search, please try later';
              return console.log('info obj', info);
            }.bind(this));
          return this.friendFirstName = this.friendLastName = this.friendEmail = '';
        }
        this.showErrMsg = true;
        return console.log('submit friend search buttion clicked!');
      },
      discardSearch: function () {
        this.friendFirstName = this.friendLastName = this.friendEmail = '';
        this.showSearch = false;
        return console.log('discard friend search button clicked!');
      },
      discardSearchResults: function () {
        this.showResultsList = false;
        this.resultsList = [];
        return jQ('#close-search-4-friends-Modal').trigger('click');
      },
      doSearch: function () {
        console.log('do search button clicked');
        this.showFriendsList = false;
        return this.showSearch = true;
      },
      enableFriendsList: function () {
        if(this.friendsList.length > 0) {
          this.showLoading = true;
          this.$http.get(this.friendsURL).
            then(function (res) {
              console.log('response from friend list query', res.data);
              this.showLoading = false;
              this.friendsListArray = [];
              res.data.data.forEach(function (friend) {
                return this.friendsListArray.push(friend);
              }.bind(this));
              this.showSearch = false;
              this.showResultsList = false;
              return jQ('#show-friends-list-Modal-Btn').trigger('click');
            }.bind(this), function (info) {
              this.showLoading = false;
              this.showSearch = false;
              this.showResultsList = false;
              this.showFriendsErrMsg = true;
              return console.log('info obj', info);
            }.bind(this));
            console.log('show friends list button value', this.$els.friendListBtn.textContent);
            //return this.$els.friendListBtn.textContent = 'Hide friend list...';
            return null;
        }
        return null;
      },
      hideFriendsList: function () {
        this.showFriendsList = false;
        return jQ('#close-show-friends-list-Modal-btn').trigger('click');
      },
      addFriend: function (friend) {
        console.log('friends fname', friend.firstName);
        console.log('friend email', friend.email);
        var newFriend = friend.firstName +' '+ friend.lastName;
        this.$http.post(this.friendsURL, {
          data: {
            firstName: friend.firstName,
            lastName: friend.lastName,
            email: friend.email,
            profilePhoto: friend.profilePhoto
          }
        }).
          then(function (res) {
            console.log('response from add friend submission', res);
            return this.$dispatch('addedFriend', newFriend);
          }.bind(this), function (info) {
            console.log('info obj', info);
            return this.showErrMsg = true;
          }.bind(this));
        this.removeItemFromList(friend, this.resultsList);
      },
      removeItemFromList: function (item, listName) {
        var index = listName.indexOf(item);
        listName.splice(index, 1);
        if(listName.length < 1) {
          this.showResultsList = false;
          return this.resultsList = [];
        }
      },
      deleteFriend: function (friend) {
        console.log('friends fname', friend.firstName);
        console.log('friend email', friend.email);
        //this.removeItemFromList(friend, this.resultsList);
        this.$http.delete(this.friendsURL, {
          email: friend.email
        }).
          then(function (res) {
            this.friendsListArray = [];
            this.enableFriendsList();
            return console.log('response from delete friend submission', res);
          }.bind(this), function (info) {
            console.log('info obj', info);
            return this.showRemoveErrMsg = true;
          }.bind(this));
      },
      submitFriendsSearch: function () {
        console.log('friends search button clicked');
        if(this.friendSearchFirstName.trim() ||
        this.friendSearchLastName.trim() ||
       this.friendSearchEmail.trim()) {
          var
            queryParams = {
              firstName: this.friendSearchFirstName || null,
              lastName: this.friendSearchLastName || null,
              email: this.friendSearchEmail || null
            },
            filteredArray = this.friendsListArray.filter(function (friend) {
            return (friend.firstName == queryParams.firstName ||
              friend.lastName == queryParams.lastName ||
              friend.email == queryParams.email);
          });
          console.log('query params', queryParams);
          console.log('filtered array', filteredArray);
          if(filteredArray.length < 1) {
            this.showFriendsListMsg = true;
            return this.friendsListMsg = 'No friends exist with the provided details';
          }
          return this.friendsListArray = filteredArray;
        }
        return null;
      },
      discardFriendsSearch: function () {
        this.friendSearchFirstName = this.friendSearchLastName = this.friendSearchEmail = '';
        this.friendListSearch = false;
        return console.log('discard friend list search button clicked!');
      },
      showfriendListSearch: function () {
        console.log('show friend list search button clicked');
        //this.showFriendsList = false;
        this.friendListSearch = true;
        return jQ('#close-show-friends-list-Modal-btn').trigger('click');
      },
      hideFriendsListSearch: function () {
        return jQ('#close-friends-list-search-results-Modal-btn').trigger('click');
      },
      viewFriendHub: function (friend) {
        var URL = this.friendHubURL;
        console.log('request to view ' + friend.email +'\'s Hub!');
        this.$http.get(URL, {
          email: friend.email
        }).
        then(function (res) {
          console.log('response from view friend hub submission', res.data);
          jQ('#close-show-friends-list-Modal-btn').trigger('click');
          return this.$dispatch('gotFriendHubData', res.data);
        }.bind(this), function (info) {
          console.log('info obj', info);
          return this.showViewHubErrMsg = true;
        }.bind(this));
      }
    },
    events: {
      'updateFriendHub': function (email) {
        return this.viewFriendHub({email: email});
      }
    },
    ready: function () {
      /*if(this.friendsList.length > 1) {
        this.friendsListArray = this.friendsList;
      }*/
    }
  };
};
