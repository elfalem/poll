"use strict";
const config = require('config');
const rp = require('request-promise');

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
        }
      },
      classMethods: {
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
