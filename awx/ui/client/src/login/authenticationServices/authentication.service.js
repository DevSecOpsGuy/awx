/*************************************************
 * Copyright (c) 2015 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/


  /**
 *  @ngdoc function
 *  @name shared.function:AuthService
 *  @description  AuthService.js
 *
 *  User authentication functions
 *
 */

export default
    ['$http', '$rootScope', '$location', '$cookieStore', 'GetBasePath', 'Store',
    '$injector', '$q',
    function ($http, $rootScope, $location, $cookieStore, GetBasePath, Store,
    $injector, $q) {
        return {
            setToken: function (token, expires) {
                // set the session cookie
                $cookieStore.remove('token');
                $cookieStore.remove('token_expires');
                $cookieStore.remove('userLoggedIn');
                $cookieStore.put('token', token);
                $cookieStore.put('token_expires', expires);
                $cookieStore.put('userLoggedIn', true);
                $cookieStore.put('sessionExpired', false);
                $rootScope.token = token;
                $rootScope.userLoggedIn = true;
                $rootScope.token_expires = expires;
                $rootScope.sessionExpired = false;
            },

            isUserLoggedIn: function () {
                if ($rootScope.userLoggedIn === undefined) {
                    // Browser refresh may have occurred
                    $rootScope.userLoggedIn = $cookieStore.get('userLoggedIn');
                    $rootScope.sessionExpired = $cookieStore.get('sessionExpired');
                }
                return $rootScope.userLoggedIn;
            },

            getToken: function () {
                return ($rootScope.token) ? $rootScope.token : $cookieStore.get('token');
            },

            retrieveToken: function (username, password) {
                return $http({
                    method: 'POST',
                    url: GetBasePath('authtoken'),
                    data: {
                        "username": username,
                        "password": password
                    }
                });
            },

            logout: function () {
                // the following puts our primary scope up for garbage collection, which
                // should prevent content flash from the prior user.

                var x,
                ConfigService = $injector.get('ConfigService'),
                scope = angular.element(document.getElementById('main-view')).scope();

                if(scope){
                    scope.$destroy();
                }

                if($cookieStore.get('lastPath')==='/portal'){
                    $cookieStore.put( 'lastPath', '/portal');
                    $rootScope.lastPath = '/portal';
                }
                else if ($cookieStore.get('lastPath') !== '/home' || $cookieStore.get('lastPath') !== '/' || $cookieStore.get('lastPath') !== '/login' || $cookieStore.get('lastPath') !== '/logout'){
                    // do nothing
                    $rootScope.lastPath = $cookieStore.get('lastPath');
                }
                else {
                    // your last path was home
                    $cookieStore.remove('lastPath');
                    $rootScope.lastPath = '/home';
                }
                x = Store('sessionTime');
                if ($rootScope.current_user) {
                    x[$rootScope.current_user.id].loggedIn = false;
                }
                Store('sessionTime', x);

                if ($cookieStore.get('current_user')) {
                    $rootScope.lastUser = $cookieStore.get('current_user').id;
                }
                ConfigService.delete();
                $cookieStore.remove('token_expires');
                $cookieStore.remove('current_user');
                $cookieStore.remove('token');
                $cookieStore.put('userLoggedIn', false);
                $cookieStore.put('sessionExpired', false);
                $cookieStore.put('current_user', {});
                $rootScope.current_user = {};
                $rootScope.license_tested = undefined;
                $rootScope.userLoggedIn = false;
                $rootScope.sessionExpired = false;
                $rootScope.licenseMissing = true;
                $rootScope.token = null;
                $rootScope.token_expires = null;
                $rootScope.login_username = null;
                $rootScope.login_password = null;
                if ($rootScope.sessionTimer) {
                    $rootScope.sessionTimer.clearTimers();
                }
            },

            licenseTested: function () {
                var license, result;
                if ($rootScope.license_tested !== undefined) {
                    result = $rootScope.license_tested;
                } else {
                    // User may have hit browser refresh
                    license = Store('license');
                    $rootScope.version = license.version;
                    if (license && license.tested !== undefined) {
                        result = license.tested;
                    } else {
                        result = false;
                    }
                }
                return result;
            },

            getUser: function () {
                return $http({
                    method: 'GET',
                    url: '/api/v1/me/',
                    headers: {
                        'Authorization': 'Token ' + this.getToken(),
                        "X-Auth-Token": 'Token ' + this.getToken()
                    }
                });
            },

            setUserInfo: function (response) {
                // store the response values in $rootScope so we can get to them later
                $rootScope.current_user = response.results[0];
                $cookieStore.put('current_user', response.results[0]); //keep in session cookie in the event of browser refresh
            },

            restoreUserInfo: function () {
                $rootScope.current_user = $cookieStore.get('current_user');
            },

            getUserInfo: function (key) {
                // Access values returned from the Me API call
                var cu;
                if ($rootScope.current_user) {
                    return $rootScope.current_user[key];
                }
                this.restoreUserInfo();
                cu = $cookieStore.get('current_user');
                return cu[key];
            }
        };
    }
];
