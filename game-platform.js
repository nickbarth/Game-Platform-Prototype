Games = new Meteor.Collection('games');

if (Meteor.isClient) {
  Meteor.saveGame = function (file, id) {
    var fileReader = new FileReader();
    fileReader.onload = function (file) {
      Meteor.call('saveGame', file.srcElement.result, id);
    }
    fileReader['readAsBinaryString'](file);
  }

  Template.signIn.events({
    'submit #login-form': function (event, template) {
      var usernameField = template.find('#login-username'),
          passwordField = template.find('#login-password'),
          username = usernameField.value,
          password = passwordField.value;
      event.preventDefault();
      Meteor.loginWithPassword(username, password, function (err) {
        if (err) return alert(err);
        usernameField.value = "";
        passwordField.value = "";
        document.getElementById('login-view').style.display = "none";
      });
    },
    'click #login-form-cancel': function (event, template) {
      var usernameField = template.find('#login-username'),
          passwordField = template.find('#login-password');
      usernameField.value = "";
      passwordField.value = "";
      document.getElementById('login-view').style.display = "none";
      return false;
    }
  });

  Template.mainNav.currentUser = function () {
    return Meteor.user();
  }

  Template.mainNav.events({
    'click #logout-button': function (event, template) {
      Meteor.logout();
    },
    'click #login-button': function (event, template) {
      document.getElementById('login-view').style.display = "block";
    },
    'click #add-game-button': function (event, template) {
      document.getElementById('add-game-view').style.display = "block";
    }
  });

  Template.gamesView.games = function () {
    return Games.find();
  }

  Template.gameView.isOwner = function (owner) {
    return Meteor.user() && Meteor.user().username === owner;
  }

  Template.gameView.events({
    'change input': function (event, template) {
      Meteor.saveGame(event.srcElement.files[0], this._id);
    }
  });

  Template.addGame.events({
    'submit #add-game-form': function (event, template) {
      var nameField = template.find('#game-name'),
          genreField = template.find('#game-genre'),
          name = nameField.value,
          genre = genreField.value;
      event.preventDefault();
      Games.insert({
        name: name,
        genre: genre,
        gameBy: Meteor.user().username
      });
      nameField.value = "";
      genreField.value = "";
      document.getElementById('add-game-view').style.display = "none";
    },
    'click #add-game-cancel': function (event, template) {
      var nameField = template.find('#game-name'),
          genreField = template.find('#game-genre');
      nameField.value = "";
      genreField.value = "";
      document.getElementById('add-game-view').style.display = "none";
      return false;
    }
  });

  Template.commentsView.isSignedIn = function () {
    return Meteor.user();
  }

  Template.commentsView.events({
    'submit #comment-form': function (event, template) {
      var commentField = template.find('#comment-text'),
          comment = commentField.value;
      Games.update({ _id: this._id }, {$addToSet: { comments: { name: Meteor.user().username, text: comment }}});
      commentField.value = '';
      return false;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Meteor.users.find().count() === 0) {
      Meteor.users.insert({
        username: 'test',
        emails: ['test@example.com'],
        name: 'John Doe',
        services: {
          password: {
            srp: Meteor._srp.generateVerifier('password')
          }
        }
      });
    }

    if (Games.find().count() === 0) {
      Games.insert({
        name: 'Cool Game 1',
        genre: 'RPG',
        gameBy: 'Nick',
        src: '',
        comments: [],
        active: true
      });
    }
  });

  Meteor.methods({
    saveGame: function(data, id) {
      var fs = Npm.require('fs');

      fs.writeFile('/public/games/'+id+'.html', data, 'binary', function(err) {
        if (err) return console.log(err);
        console.log('File upload complete.');
      });
      Games.update({ _id: id }, {$set: { src: '/games/'+id+'.html' }});
    }
  });
}
