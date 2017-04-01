"use strict";
const config = require('config');
const rp = require('request-promise');
const jwt = require('jwt-simple');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define("user", {
    hipchat_user_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: false }
  },
    {
      underscored: true,
      instanceMethods: {
        getUserRoom: function (room) {
          let UserRoom = this.sequelize.import('user_rooms.js');
          let promise = UserRoom.findOne({ "where": { "room_id": room.id, "user_id": this.id } })
            .then(ur => {
              return ur.populateTokens(room);
            });

          return promise;
        },
        populateTokensFromCode: function (room, code) {
          let UserRoom = this.sequelize.import('user_rooms.js');
          let formData = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": `${config.get('hostname')}/api/authorized`
          };

          let options = {
            method: 'POST',
            uri: 'https://api.hipchat.com/v2/oauth/token',
            json: true,
            form: formData,
            auth: {
              user: room.oauth_id,
              pass: room.oauth_secret
            }
          };

          let promise = rp(options)
            .then(body => {
              return Promise.all([
                UserRoom.findOne({ "where": { "room_id": room.id, "user_id": this.id } }),
                body
              ]);
            })
            .then(p => {
              let userRoom = p[0];
              let body = p[1];

              if (!userRoom) {
                userRoom = UserRoom.build({
                  "room_id": room.id,
                  "user_id": this.id
                });
              }

              userRoom.access_token = body.access_token;
              userRoom.refresh_token = body.refresh_token;
              userRoom.access_token_expires = new Date((new Date() * 1) + body.expires_in * 1000)

              return userRoom.save();
            });

          return promise;
        },

        updateUserInfo: function (room) {
          let promise = this.getUserRoom(room)
            .then(ur => {
              let options = {
                method: 'GET',
                uri: 'https://api.hipchat.com/v2/user/' + this.hipchat_user_id,
                json: true,
                auth: {
                  bearer: ur.access_token
                }
              };
              return rp(options);
            })
            .then(body => {
              this.full_name = body.name;
              this.avatar = body.photo_url;
              return this.save();
            });

          return promise;
        },

        postCard: function (question, room) {
          let promise = this.getUserRoom(room)
            .then(ur => {
              let relTime = moment(question.expiration).fromNow();
              let data = {
                "message_format": "text",
                "notify": true,
                "message": question.question,
                "card": {
                  "style": "media",
                  "description": {
                    "value": `Please vote on this poll. This poll closes ${relTime}.`,
                    "format": "text"
                  },
                  "format": "compact",
                  "url": `hipchat://www.hipchat.com/room/${room.hipchat_room_id}?target=poll_dialog_vote#${question.id}`,
                  "title": question.question,
                  "thumbnail": {
                    "url": "https://poll.nickroge.rs/images/vote.png",
                    "width": 313,
                    "height": 313
                  },
                  "id": `poll.card.${question.id}`
                }
              };
              let options = {
                method: 'POST',
                uri: `https://api.hipchat.com/v2/room/${room.hipchat_room_id}/notification`,
                json: true,
                auth: {
                  bearer: ur.access_token
                },
                body: data
              };

              return rp(options);
            });
        }
      },
      classMethods: {
        fromJwt: function (jwtEncoded) {
          let Room = this.sequelize.import('rooms.js');
          let ret = {
            validJwt: false,
            validUser: false,
            userId: null,
            user: null,
            room: null
          };

          // first decode without verifying signature in order to get the room ID
          // we will validate the jwt's signature later

          let jwtUnverified = jwt.decode(jwtEncoded, '', true);
          let roomId = parseInt(jwtUnverified.context.room_id);

          let promise = Room.findOne({
            "where": {
              "hipchat_room_id": roomId
            }
          })
            .then(r => {
              if (!r) {
                return Promise.resolve(ret);
              }
              ret.room = r;

              // decode jwt now with validation
              try {
                let jwtVerified = jwt.decode(jwtEncoded, r.oauth_secret);
                let userId = jwtVerified.sub;
                ret.validJwt = true;
                ret.userId = userId;
                return this.findOne({
                  "where": {
                    "hipchat_user_id": userId
                  }
                });
              } catch (e) {
                return Promise.resolve(ret);
              }
            })
            .then(u => {
              if (!u) {
                return Promise.resolve(ret);
              }
              return Promise.all([u, u.getUserRoom(ret.room)]);
            })
            .then(ur => {
              let user = ur[0];
              let tokens = ur[1];

              ret.validUser = user.full_name != "" && tokens != null;
              ret.user = user;

              return Promise.resolve(ret);
            })
            .catch(err => {
              return Promise.resolve(ret);
            });

          return promise;
        },

        associate: function (models) {
          User.belongsTo(models.group, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });

          User.belongsTo(models.room, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: true,
              name: 'last_authorized_room'
            }
          });

          User.belongsToMany(models.room, { through: 'user_room' });
        }
      }
    });

  return User;
};
