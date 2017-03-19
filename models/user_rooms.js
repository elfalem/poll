"use strict";

module.exports = (sequelize, DataTypes) => {
  var UserRoom = sequelize.define("user_room", {
    access_token: { type: DataTypes.STRING, allowNull: false },
    access_token_expires: { type: DataTypes.DATE, allowNull: false },
    refresh_token: { type: DataTypes.STRING, allowNull: false },
  }, 
  {
    underscored: true,
    classMethods: {
      associate: function(models) {
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
