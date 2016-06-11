'use strict';

/**
 * @ngdoc overview
 * @name callMeApp
 * @description
 * # callMeApp
 *
 * Main module of the application.
 */
var CallMe = angular.module('callMeApp', [
            'ngAnimate',
            'ngCookies',
            'ngMessages',
            'ngResource',
            'ngRoute',
            'ngSanitize',
            'ngTouch',
            'ui.bootstrap',
            'ngMessages',
            'ngAnimate',
            'ui.bootstrap.tpls',
            'ui.bootstrap.modal',
            'ngVideo',
        ])
        .config(function ($routeProvider) {
            $routeProvider
                    .when('/', {
                        templateUrl: 'views/main.html',
                        controller: 'MainCtrl',
                        controllerAs: 'main'
                    })
                    .when('/chat/:roomId', {
                        templateUrl: 'views/videoCall.html',
                        controller: 'videoCallCtrl'
                    })
                    .when('/chat/:roomId/:userId', {
                        templateUrl: 'views/videoCall.html',
                        controller: 'videoCallCtrl'
                    })
                    .when('/chat/:roomId/:userId/:remoteUserId', {
                        templateUrl: 'views/videoCall.html',
                        controller: 'videoCallCtrl'
                    })
                       .when('/call/:roomId/:userId', {
                        templateUrl: 'views/call.html',
                        controller: 'CallCtrl'
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
        })
        .constant('config', {
            // Change it for your app URL
          //  SIGNALIG_SERVER_URL: 'https://10.2.2.201:5555',
           SIGNALIG_SERVER_URL: 'https://192.168.1.6:5555',
           max_connections: 50,
           apiUrl: "https://10.2.2.201/chatApi/",
           siteUrl: "https://10.2.2.201",

        })
        .run(function () {
               
        });
       
CallMe.factory('socketClient', function() {
    return socketClient;
});
