"use strict";
const config = require('config');

module.exports = (sequelize, DataTypes) => {
  var Room = sequelize.define("room", {
    hipchat_room_id: { type: DataTypes.INTEGER, allowNull: false },
    oauth_id: { type: DataTypes.STRING, allowNull: false },
    oauth_secret: { type: DataTypes.STRING, allowNull: false }
  }, {
      underscored: true,
      instanceMethods: {
        authorizeUserUrl: function () {
          return "https://www.hipchat.com/users/authorize?response_type=code" +
            "&scope=view_group+send_notification" +
            "&signup=0" +
            `&client_id=${this.oauth_id}` +
            `&redirect_uri=${config.get('hostname')}/api/authorized`
        }
      },
      classMethods: {
        associate: function (models) {
          Room.belongsTo(models.group, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });

          Room.belongsToMany(models.user, { through: 'user_room' });
        }
      }
    });

  return Room;
};
