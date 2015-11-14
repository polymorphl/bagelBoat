
'use strict';

var bagelBoat = angular.module('bagelBoat', ['ui.router', 'firebase'])
                .constant('firebaseUrl', "https://battleship-io.firebaseio.com");

bagelBoat.config(function($stateProvider, $urlRouterProvider, firebaseUrl) {
  //
  // For any unmatched url, redirect to /home
  $urlRouterProvider.otherwise("/home");
  //
  // Now set up the states
  $stateProvider
    .state('home', {
      url: "/home",
      templateUrl: "../partials/home.html"
    })
    .state('team', {
      url: "/team",
      templateUrl: "../partials/team.html"
    })
    .state('game', {
      url: "/game",
      templateUrl: "../partials/game.html"
    })
    .state('logged', {
        url: "/logged",
        templateUrl: "../partials/logged.html",
        resolve: {
            "currentAuth": ["$firebaseAuth", function ($firebaseAuth) {
                // $requireAuth returns a promise if authenticated, rejects if not
                var ref = new Firebase(firebaseUrl);
                var authObj = $firebaseAuth(ref);
                return authObj.$requireAuth();
            }]
        }
    })
    .state('game.list', {
      url: "/game-list",
        templateUrl: "partials/game.list.html",
        controller: function($scope) {
          $scope.items = ["A", "Set", "Of", "items"];
        }
    });
});
