'use strict'

CallMe.factory('restApi', function ($sce, $location, config, $q) {

    var getlangualges = function ()
    {
        // should be return langualges from laguace table

    };
    /*
     * Return dictionary 
     */
    var getTranlations = function (language)
    {
        // should return dictionary
    }
    
    var getMeetings = function(userId)
    {
        //should get all user's meetings
    }

    return{
        'getlangualges': getlangualges,
        'getTranlations': getTranlations,
        'getMeettings': getTranlations,
    }



});

