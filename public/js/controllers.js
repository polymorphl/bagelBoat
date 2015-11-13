angular.module('bagelBoat')
        .controller('mainCtrl', mainCtrl)
        .controller('LoginCtrl', LoginCtrl);

    mainCtrl.$inject = ['$state'];
    LoginCtrl.$inject = ['$firebaseAuth', '$firebaseObject', '$state', 'firebaseUrl'];

    function mainCtrl($state) {

        var vm = this;
        vm.navigateTo = function (state) {
            $state.go(state);
        }
    }

    function LoginCtrl($firebaseAuth, $firebaseObject, $state, firebaseUrl) {
        var vm = this;
        vm.isLoggedIn = false;
        var ref = new Firebase(firebaseUrl);
        var authObj = $firebaseAuth(ref);

        //initialize and get current authenticated state:
        init();

        function init(){
           authObj.$onAuth(authDataCallback);
           if (authObj.$getAuth()){
               vm.isLoggedIn  = true;
           }
        }

        function authDataCallback(authData) {
            if (authData) {
                console.log("User " + authData.uid + " is logged in with " + authData.provider);
                vm.isLoggedIn = true;
                var user = $firebaseObject(ref.child('users').child(authData.uid));
                user.$loaded().then(function () {
                    if (user.name == undefined) {
                        var newUser = {
                            rooms: [],
                            maxRooms: 5
                        };
                        if (authData.google) {
                            newUser.name = authData.google.displayName;
                        }
                        if (authData.github) {
                            newUser.name = authData.github.username;
                        }

                        user.$ref().set(newUser);

                    }
                });

            } else {
                console.log("User is logged out");
                vm.isLoggedIn = false;
            }
        }

        vm.logout = function () {
            ref.unauth();
            $state.go('home');
        }

        firebaseAuthLogin = function(provider){
            authObj.$authWithOAuthPopup(provider).then(function (authData) {
                console.log("Authenticated successfully with provider " + provider +" with payload:", authData);
            }).catch(function (error) {
                console.error("Authentication failed:", error);
            });
        }

        vm.googleLogin = function () {
            firebaseAuthLogin('google');
        }
    }
