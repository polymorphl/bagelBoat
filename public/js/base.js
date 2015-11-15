
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

var host = window.location.hostname;
var port = ':9000'
var socket = io.connect('http://'+host+port);

socket.on('connect', function(){
    socket.emit('adduser', prompt("What's your name: "));
    console.log('after emit 0');
});

socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+ username + ':</b> ' + data + '<br>');
});

socket.on('updaterooms', function (rooms, current_room) {
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
        if(value == current_room){
            $('#rooms').append('<div>' + value + '</div>');
        }
        else {
            $('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
        }
    });
});

function switchRoom(room){
    socket.emit('switchRoom', room);
}

$(document).ready(function(){

    $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        socket.emit('sendchat', message);
    });

    $('#data').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });

    $('#roombutton').click(function(){
        var name = $('#roomname').val();
        $('#roomname').val('');
        socket.emit('create', name)
    });

    var s = Snap("#svg");
    var g = null;

    Snap.load("bagel.svg", function (f) {
        g = f.select("g");
        s.append(g);
        var path = s.selectAll(".path");
        var circle = s.selectAll(".circle");

        path.forEach(function(el,i) {
            el.attr('stroke-dashoffset', 20+','+Math.random()*50+',20,10,5,5,5');
            conveyor(el,Math.random()*1);
        });
        circle.forEach(function(el, i) {
            el.attr('fill', 'rgb(247, 176, 75)');
            el.attr('transition', 'all 0.5s ease');
            el.attr('stroke-dasharray', '25');
            el.attr('stroke', 'rgb(121, 46, 11)');
            el.attr('stroke-width', '7');
            conveyor(el,Math.random()*2);
        });
    });

    function conveyor(el,speed,reversed) {
        var speed    = speed    || 1,
            reversed = reversed || 0;
        var len = reversed ? -el.getTotalLength() : el.getTotalLength(),
            dur = 60000/speed;
        el.attr('stroke-dashoffset',0);
        setTimeout(function() { conveyor(el, reversed); }, dur);
    }
});
