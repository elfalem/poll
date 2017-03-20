"use strict";

module.exports = (sequelize, DataTypes) => {
  var UserRoom = sequelize.define("user_room", {
    access_token: { type: DataTypes.STRING, allowNull: false },
    access_token_expires: { type: DataTypes.DATE, allowNull: false },
    refresh_token: { type: DataTypes.STRING, allowNull: false },
  },
    {
      underscored: true,
      instanceMethods: {
        populateTokens: function (room) {
          let cutoffDate = new Date((new Date() * 1) + 600 * 1000);
          if (this.access_token_expires > cutoffDate) {
            return Promise.resolve(this);
          }

          let formData = {
            "grant_type": "refresh_token",
            "refresh_token": this.refresh_token
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
              this.access_token = body.access_token;
              this.refresh_token = body.refresh_token;
              this.access_token_expires = new Date((new Date() * 1) + body.expires_in * 1000)

              return this.save();
            });

          return promise;
        }
      },
      classMethods: {
        associate: function (models) {
          UserRoom.belongsTo(models.user, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });

          UserRoom.belongsTo(models.room, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });
        }
      }
    });

  return UserRoom;
};
