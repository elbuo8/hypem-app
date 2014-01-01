angular.module('HypeM', ['ionic', 'ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
    when('/', {
      templateUrl: 'partials/player.html',
      controller: 'PlayerCtrl'
    }).
    when('/latest', {
      templateUrl: 'partials/player.html',
      controller: 'PlayerCtrl'
    }).
    otherwise({ redirectTo: '/' });
}])

.service('Playlist', ['$http', '$q', function ($http, $q) {
  return {get: function (params) {
    var deferred = $q.defer();
    $http.get('http://hypem.com/playlist/' + params.playlist + '/all/json/' + params.pagenum + '/data.json')
    .success(function (data) {
      deferred.resolve(data);
    })
    .error(function(data){
      deferred.reject(data);
    });
    return deferred.promise;
  }};
}])

.service('Media', ['$http', '$q', function ($http, $q) {
  return {get: function (id) {
    var deferred = $q.defer();
    $http.get('http://hypem-server.herokuapp.com/?mediaid=' + id)
    .success(function (data) {
      deferred.resolve(data);
    })
    .error(function (e) {
      deferred.reject(e);
    });
    return deferred.promise;
  }};
}])

.service('Async', ['$window', function ($window) {
  return $window.async;
}])

.controller('PlayerCtrl',
['$scope','Playlist', '$routeParams', '$document', 'Media', '$window', 'Async',
function ($scope, Playlist, $routeParams, $document, Media, $window, Async) {
  var addToQueue = function(songs, cb) {
    var pending = [];
    for (var key in songs) {
      if (songs.hasOwnProperty(key) && angular.isObject(songs[key])) {
        pending.push(songs[key]);
      }
    }

    Async.map(pending, function (song, callback) {
      Media.get(song.mediaid).then(function (media) {
        song.url = media.url;
        callback(null, song);
      }).catch (function (e) {
        callback(e);
      });
    }, function (e, mutated) {
      queue = queue.concat(mutated);
      cb();
    });
  };

  var getPlaylist = function (cb) {
    Playlist.get({playlist: $routeParams.playlist || 'popular', pagenum: currentPage}).then(function(songs) {
      currentPage++;
      addToQueue(songs, function () {
        cb();
      });
    }).catch(function(e) {
      cb();
    });
  };

  $scope.playerControl = function () {
    if (!isPlaying) {
      audio.play();
      isPlaying = true;
    } else {
      audio.pause();
      isPlaying = false;
    }
  };

  $scope.nextSong = function () {
    console.log(queue[currentSongIdx]);
    setPlayer();
    currentSongIdx++;
    audio.play();
    isPlaying = true;
    if (currentSongIdx > 0 && currentSongIdx % 20 === 0) {
      getPlaylist(function () {
        console.log('updated!');
      });
    }
  };

  $scope.previousSong = function () {
    if (currentSongIdx > 0 ) {
      setPlayer();
      currentSongIdx--;
      audio.play();
      isPlaying = true;
    }
  };

  var setPlayer = function () {
    $scope.ArtistImage = queue[currentSongIdx].thumb_url_artist;
    $scope.ArtistName = queue[currentSongIdx].artist;
    $scope.SongName = queue[currentSongIdx].title;
    $scope.Cover = queue[currentSongIdx].thumb_url_large;
    audio.src = queue[currentSongIdx].url;
  };

  $scope.ArtistImage = null;
  $scope.ArtistName = null;
  $scope.SongName = null;
  $scope.Cover = null;
  var isPlaying = false;
  var currentSongIdx = 0;
  var queue = [];
  var currentPage = 1;
  var audio = $window.document.getElementById('player');
  //init
  getPlaylist(function () {
    $scope.nextSong();
  });



}]);