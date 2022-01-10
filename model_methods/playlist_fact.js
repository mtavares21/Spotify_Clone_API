const debug = require("debug")("playlist_fact");
const mongoose = require("mongoose");
const Playlist = require("../models/playlist_model");
const Track = require("../models/track_model");

exports.playlistMethods = async function () {
  async function createPlaylist(args) {
    debug(args);
    const newPlaylist = new Playlist(args);
    try {
      const queryPlaylist = await Playlist.find({ user: args.user })
        .where("name")
        .equals(args.name);
      debug("queryPlaylist: ", !!queryPlaylist.length);
      if (!queryPlaylist.length) {
        newPlaylist.save();
        return Promise.resolve({
          message: "New playlist created.",
          playlist: newPlaylist,
        });
      }
      return Promise.resolve({
        message: "Playlist already exists",
        playlist: queryPlaylist[0],
      });
    } catch (error) {
      Promise.reject(new Error(error));
    }
  }

  async function addToPlaylist(playlistId, trackId) {
    const mongooseId = mongoose.Types.ObjectId(playlistId);
    const response = new Promise((resolve, reject) => {
      Playlist.findById(mongooseId, (err, playlist) => {
        if (err || playlist === null)
          return reject(
            new Error({ message: "Error accessing database", error: err })
          );
        const tracks = playlist.tracks;
        const totalTracks = tracks.length;
        // Verify if track is in the playlist
        const isInPlaylist = !!tracks.filter(() => trackId).length;
        if (!isInPlaylist) {
          tracks.push(trackId);
          playlist.tracks = tracks;
          playlist.totalTRacks = totalTracks;
          playlist
            .save()
            .then((data) => {
              resolve({ message: "Track added to playlist", playlist });
            })
            .catch((err) => {
              reject(
                new Error({ message: "Error accessing database", error: err })
              );
            });
        } else {
          return resolve({ message: "Track already in playlist", playlist });
        }
      });
    });
    return response;
  }

  async function removeFromPlaylist(playlistId, spotifyTrackId) {
    const playMongoId = mongoose.Types.ObjectId(playlistId);

    const mongoTrackId = new Promise((reject, resolve) => {
      Track.find({ 'spotifyId': spotifyTrackId }).exec( (err, data) => {
        if(err || !spotifyTrackId)
          return reject(err);
        return resolve(data.id);
      });
    });
    const playMongoId = await mongoTrackId._id

    const response = new Promise((resolve, reject) => {
      Playlist.findById(playMongoId, function (err, playlist) {
        if (err || playlist === null)
          return reject(
            new Error({ message: "Error accessing database", error: err })
          );
        //Params to update
        const tracks = playlist.tracks;
        const totalTracks = playlist.totalTracks.length;
        // Verify if track is in the playlist
        const removedTrack = tracks.filter((track) => !trackMongoId);
        playlist.tracks = removedTrack;
        playlist.totalTracks = removedTrack.length;
        debug("removedTrack: ", removedTrack);
        debug("totalTracks: ", totalTracks);
        playlist
          .save()
          .then(() => {
            resolve({ message: "Track removed from playlist", playlist });
          })
          .catch((err) => {
            reject(
              new Error({ message: "Error accessing database", error: err })
            );
          });
      });
    });
    return response;
  }
  return { createPlaylist, addToPlaylist, removeFromPlaylist };
};
