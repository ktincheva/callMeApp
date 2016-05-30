CallMe.service('Profile', function ($http,$filter,config) {
    var getProfileByUsername = function (username)
    {
        console.log(username);
        return $http({
            method: "POST",
            url: config.apiUrl + 'load_profile.php',
            dataType: 'json',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: $.param({username: username}),
        });
    }
    var getProfileByUsernameJson = function (username)
    {
        return $http.get('test_data/users.json');
               
    }
    return {
        getProfileByUsername: getProfileByUsername,
        getProfileByUsernameJson: getProfileByUsernameJson,
    }
});


