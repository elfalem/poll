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
  res.render('poll/index', { "jwt": userJwt });
});

router.get('/:pollId', function (req, res, next) {
  let userJwt = req.query.signed_request;
  let pollId = parseInt(req.params.pollId);
  if (isNaN(pollId) || pollId <= 0) {
    res.send(400).send("");
    return;
  }

  let promise = models.question.findOne({
    "where": {
      "id": pollId
    },
    "include": [{
      "model": models.option,
      "include": {
        "model": models.user_answer
      }
    }]
  })
    .then(q => {
      if (!q) {
        res.send(404);
        return;
      }

      if (q.hasExpired) {
        res.redirect(`/poll/${pollId}/results?signed_request=${userJwt}`);
        return;
      }

      return Promise.all([q, models.user.fromJwt(userJwt)]);
    })
    .then(a => {
      if (a === undefined) {
        return; // expired question, stop evaluation
      }
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

router.post('/:pollId/vote', function (req, res, next) {
  let pollId = parseInt(req.params.pollId);
  if (isNaN(pollId) || pollId <= 0) {
    res.send(400).send("");
    return;
  }

  let userJwt = req.body.jwt;
  let selections = req.body['selections[]'];
  let promise = models.user.fromJwt(userJwt)
    .then(user => {
      if (!user.validJwt || !user.validUser) {
        res.status(400).send('Bad user or JWT');
        return;
      }

      let q = models.question.findOne({
        "where": {
          "id": pollId
        },
        "include": [{
          "model": models.option,
          "include": {
            "model": models.user_answer
          }
        }]
      });
      return Promise.all([user, q]);
    })
    .then(p => {
      let user = p[0];
      let q = p[1];

      if (!q) {
        res.status(404).send('');
        return;
      }

      if (q.hasExpired) {
        res.status(400).send('Poll expired');
        return;
      }

      let option = q.options.filter(o => o.id.toString() === selections);
      if (option.length == 0) {
        res.status(400).send('Invalid option');
        return;
      }

      return option[0].createUser_answer({
        "user_id": user.user.id
      });
    })
    .then(() => {
      res.status(201).send('');
    })
    .catch(err => {
      next(err);
    });

  return promise;
});

router.get('/:pollId/results', function (req, res, next) {
  let userJwt = req.query.signed_request;
  let pollId = parseInt(req.params.pollId);
  if (isNaN(pollId) || pollId <= 0) {
    res.send(400).send("");
    return;
  }

  let promise = models.question.findOne({
    "where": {
      "id": pollId
    },
    "include": [{
      "model": models.option,
      "include": {
        "model": models.user_answer
      }
    }]
  })
    .then(q => {
      if (!q) {
        res.send(404);
        return;
      }
      return Promise.all([q, models.user.fromJwt(userJwt)]);
    })
    .then(a => {
      let question = a[0];
      let user = a[1];

      if (user.validJwt && user.validUser) {
        res.render('poll/results', { "question": question, "user": user.user, "jwt": userJwt });
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

module.exports = router;