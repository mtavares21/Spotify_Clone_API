const debug = require("debug")("db_utils");
const User = require("../models/user_model");
const Track = require("../models/track_model");
const Artist = require("../models/artist_model");
const Album = require("../models/album_model");
const { Mongoose } = require("mongoose");
const mongoose = require("mongoose");

// Create items in db

exports.createUser = async (username, spotifyId, deviceId, handleError) => {
  let result = null;

  const newUser = new User({
    username,
    spotifyId,
    deviceId,
  });

  await newUser.save((error) => {
    if (error) {
      return handleError(error);
    }
  });

  return result;
};

// Query callback
exports.callback = async (error, data, res, message) => {
  if (error) {
    debug("message_type: ERROR", "");
    debug(message, error);
    return handleError(error);
  }
  debug("message_type: SUCCESS");
  debug(message, data);
  res.json(data);
};

exports.getFromDb = async (Model, req, res, handleError, debugMessage) => {
  const query = req.query ? req.query : null;
  // Look for id or return all
  const id = query.id ? query.id : null;
  // Allow where clause
  const whereClause = query.where || null;
  const inOperator = query.in ? query.in.split(",") : null;
  //Check for debugMessage
  const message = debugMessage ? "message: " + debugMessage : "";

  if (whereClause) {
    Model.find({})
      .where(whereClause)
      .in(inOperator)
      .exec((error, data) => this.callback(error, data, res, message));
  } else if (id) {
    Model.findById(id).exec((error, data) =>
      this.callback(error, data, res, message)
    );
  } else
    Model.find({}).exec((error, data) =>
      this.callback(error, data, res, message)
    );
};

exports.getPlaylistFromDb = async (
  Model,
  req,
  res,
  handleError,
  debugMessage
) => {
  const query = req.query ? req.query : null;
  // Look for id or return all
  const id = query.id ? query.id : null;
  //Check for debugMessage
  const message = debugMessage ? "message: " + debugMessage : "";

  if (!id) {
    Model.find({})
      .where("user")
      .equals(query.user)
      .populate("tracks")
      .exec((error, data) => this.callback(error, data, res, message));
  } else if (id) {
    Model.findById(id)
      .where("user")
      .equals(query.user)
      .populate("tracks")
      .exec(async (error, data) => {
        if (error) {
          return this.callback.bind(error, data, res, message);
        }

        const fullTracks = data.tracks.map(async (track) => {
          const album = new Promise((resolve, reject) => {
            Album.findById(track.album).exec((err, data) => {
              if (err) return reject(err);
              else return resolve(data);
            });
          });
          const artists = new Promise((resolve, reject) => {
            Artist.findById(track.artists).exec((err, data) => {
              if (err) return reject(err);
              else return resolve(data);
            });
          });
          debug("album", album);
          debug("artists", artists);
          const newTrack = new Promise((resolve, reject) => {
            Promise.all([album, artists])
              .then((response) => {
                debug("promise all", response);
                track.album = response[0];
                track.artists = response[1];
                return resolve(track);
              })
              .catch((error) => reject(error));
          });
          return newTrack
        });
        Promise.all(fullTracks)
          .then((fullTracks) => {
            debug("fulltracks:", fullTracks)
            data.tracks = fullTracks;
            this.callback(error, data, res, message);
          })
      });
  } else
    Model.find({})
      .populate("tracks")
      .exec((error, data) => this.callback(error, data, res, message));
};

exports.existsInDb = function (Model, spotifyId) {
  const response = new Promise((resolve, reject) => {
    Model.find({ spotifyId: spotifyId }).exec((err, artist) => {
      debug(artist);
      if (err) return reject(err);
      return resolve(!!artist.length);
    });
  });
  return response;
};
