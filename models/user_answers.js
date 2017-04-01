"use strict";

module.exports = (sequelize, DataTypes) => {
  var UserAnswer = sequelize.define("user_answer", {

  },
    {
      defaultScope: {
        include: [sequelize.import('users.js')] // always include user data
      },
      underscored: true,
      classMethods: {
        associate: function (models) {
          UserAnswer.belongsTo(models.user, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });

          UserAnswer.belongsTo(models.option, {
            onDelete: "CASCADE",
            foreignKey: {
              allowNull: false
            }
          });
        }
      }
    });

  return UserAnswer;
};
