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
        populateTokens: function (room, code) {
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
              return room.getUserRoom({"user_id": this.id});
            })
            .then(ur => {
              if (!ur) {
                return Promise.resolve();
              }
              return ur.save();
            });

          return promise;
        },

        updateUserInfo: function (room) {
          return Promise.resolve();
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
