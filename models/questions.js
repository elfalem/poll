"use strict";

module.exports = (sequelize, DataTypes) => {
  var Question = sequelize.define("question", {
    question: { type: DataTypes.STRING, allowNull: false },
    expiration: { type: DataTypes.DATE },
  }, 
  {
    underscored: true,
    classMethods: {
      associate: function(models) {
        Question.belongsTo(models.question_type, {
          foreignKey: {
            allowNull: false
          }
        });

        Question.hasMany(models.option);

      }
    }
  });

  return Question;
};
