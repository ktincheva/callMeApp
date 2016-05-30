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
            'ui.bootstrap.tpls',
            'ui.bootstrap.modal'
        ])
        .config(function ($routeProvider) {
            $routeProvider
                    .when('/', {
                        templateUrl: 'views/main.html',
                        controller: 'MainCtrl',
                        controllerAs: 'main'
                    })
                    .when('/chat/:roomId/:userId', {
                        templateUrl: 'views/chat.html',
                        controller: 'CallCtrl'
                    })
                    .when('/chat/:roomId/:userId/:remoteUserId', {
                        templateUrl: 'views/chat.html',
                        controller: 'CallCtrl'
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
        })
        .constant('config', {
            // Change it for your app URL
           // SIGNALIG_SERVER_URL: 'https://10.2.2.201:5555',
           SIGNALIG_SERVER_URL: 'https://192.168.1.6:5555',
           max_connections: 5,
           apiUrl: "https://10.2.2.201/chatApi/",
           siteUrl: "https://10.2.2.201",

        })
        .run(function () {


        });
        ;
