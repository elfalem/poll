var express = require('express');
var router = express.Router();
var config = require('config');
var models = require('../models');

router.post('/installed', function (req, res, next) {
  let body = req.body;
  let groupId = parseInt(body.groupId);
  let roomId = parseInt(body.roomId);
  let oauthId = body.oauthId;
  let oauthSecret = body.oauthSecret;

  let promise = models.group.findOne({ "where": { hipchat_group_id: groupId } })
    .then(group => {
      if (!group) {
        return models.group.create({ hipchat_group_id: groupId });
      }
      return Promise.resolve(group);
    })
    .then(group => {
      let room = models.room.findOne({ "where": { group_id: group.id, hipchat_room_id: roomId } });
      return Promise.all([group, room]);
    })
    .then(gr => {
      let group = gr[0];
      let room = gr[1];

      if (!room) {
        room = models.room.build({
          hipchat_room_id: roomId,
          group_id: group.id
        });
      }

      room.oauth_id = oauthId;
      room.oauth_secret = oauthSecret;
      return room.save();
    })
    .then(r => {
      res.send('');
    })
    .catch(err => {
      next(err);
    });

  return promise;
});

router.get('/authorizing', function (req, res, next) {
  let userId = parseInt(req.query.user_id);
  let roomId = parseInt(req.query.room_id);

  let roomPromise = models.room.findOne({ "where": { id: roomId } });
  let userPromise = models.user.findOne({ "where": { hipchat_user_id: userId } });

  let promise = Promise.all([roomPromise, userPromise])
    .then(r => {
      let room = r[0];
      let user = r[1];

      if (!room) {
        return Promise.reject(new Error("No such room"));
      }
      if (!user) {
        user = models.user.build({
          group_id: room.group_id,
          hipchat_user_id: userId,
          full_name: "",
          avatar: "",
        });
      }
      user.last_authorized_room = room.id;
      return Promise.all([user.save(), room]);
    })
    .then(r => {
      res.redirect(r[1].authorizeUserUrl());
    })
    .catch(err => {
      next(err);
    });
  return promise;
});

router.get('/authorized', function (req, res, next) {
  let code = req.query.code;
  let userId = parseInt(req.query.user_id);
  let groupId = parseInt(req.query.group_id);

  let groupPromise = models.group.findOne({ "where": { "hipchat_group_id": groupId } });
  let userPromise = models.user.findOne({ "where": { "hipchat_user_id": userId } });

  return Promise.all([groupPromise, userPromise])
    .then(gp => {
      let user = gp[1];
      let roomPromise = models.room.findOne({ "where": { "id": user.last_authorized_room } });

      return Promise.all([gp[0], gp[1], roomPromise]);
    })
    .then(gpr => {
      let user = gpr[1];
      let room = gpr[2];
      return Promise.all([gpr[0], gpr[1], gpr[2], user.populateTokensFromCode(room, code)]);
    })
    .then (gpr => {
      let user = gpr[1];
      let room = gpr[2];
      return Promise.all([gpr[0], gpr[1], gpr[2], user.updateUserInfo(room)]);
    })
    .then(gpr => {
      let group = gpr[0];
      let user = gpr[1];

      return group.addUser(user);
    })
    .then (() => {
      res.redirect("/api/authorized_thanks");
    })
    .catch(err => {
      next(err);
    })
});

router.get('/authorized_thanks', function (req, res, next) {
  res.send("Thank you for authorizing the Poll app! You may now close this window.");
});

router.delete('/installed', function (req, res, next) {
  res.send('');
});

module.exports = router;