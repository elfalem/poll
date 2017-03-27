const express = require('express');
const config = require('config');
const moment = require('moment');
const models = require('../models');
const router = express.Router();

router.get('/new', function (req, res, next) {
  let userJwt = req.query.signed_request;
  let promise = models.user.fromJwt(userJwt)
    .then(user => {
      if (user.validJwt && user.validUser) {
        res.render('poll/new', { "user": user.user, "jwt": userJwt });
      } else if (!user.validJwt) {
        res.render('poll/invalid_jwt');
      } else if (!user.validUser) {
        res.render('poll/invalid_user');
      }
    })
    .catch(err => {
      next(err);
    });

  return promise;
});

router.get('/', function (req, res, next) {
  let userJwt = req.query.signed_request;
  res.render('poll/index', {"jwt": userJwt});
});

router.get('/:pollId', function (req, res, next) {
  let userJwt = req.query.signed_request;
  let pollId = parseInt(req.params.pollId);
  if (isNaN(pollId) || pollId <= 0) {
    res.send(400).send("");
    return;
  }

  let promise = models.question.findOne({
    "where": { "id": pollId },
    "include": [models.option, models.user_answer]
  })
    .then(q => {
      if (!q) {
        res.send(404);
        return Promise.resolve();
      }
      return Promise.all([q, user.fromJwt(userJwt)]);
    })
    .then(a => {
      let question = a[0];
      let user = a[1];

      if (user.validJwt && user.validUser) {
        res.render('poll/show', { "question": question, "user": user.user, "jwt": userJwt });
      } else if (!user.validJwt) {
        res.render('poll/invalid_jwt');
      } else if (!user.validUser) {
        res.render('poll/invalid_user');
      }
    })
    .catch(err => {
      next(err);
    });

  return promise;
});

router.post('/', function (req, res, next) {
  let userJwt = req.body.jwt;
  let promise = models.user.fromJwt(userJwt)
    .then(user => {
      if (!user.validJwt || !user.validUser) {
        res.status(400).send('Bad user or JWT');
        return;
      }

      let optionsList = []
      for (let o of req.body["options[]"]) {
        if (o == "") {
          continue;
        }
        optionsList.push({ "option": o });
      }

      let q = models.question.build({
        "question": req.body.question,
        "question_type_id": req.body.question_type,
        "options": optionsList
      }, {
          "include": [models.option]
        });

      let expTime = req.body.expires_time;
      let expValue = parseInt(req.body.expires_value);
      if (isNaN(expValue)) {
        res.status(400).send('Invalid expiration value');
        return;
      }

      switch (expTime) {
        case "days":
          q.expiration = moment().add(expValue, "day");
          break;
        case "hours":
          q.expiration = moment().add(expValue, "hour");
          break;
        case "minutes":
          q.expiration = moment().add(expValue, "minute");
          break;
        default:
          res.status(400).send('Invalid expiration time unit');
          return;
      }

      if (q.expiration > moment().add(60, "day")) {
        res.status(400).send('Invalid expiration time value');
        return;
      }

      return Promise.all([user, q.save()]);
    })
    .then(a => {
      let user = a[0];
      let question = a[1];

      return Promise.all([user, question, user.user.postCard(question, user.room)]);
    })
    .then(a => {
      let question = a[1];
      res.status(201).json({ "id": question.id });
    })
    .catch(err => {
      next(err);
    });

  return promise;
});

module.exports = router;