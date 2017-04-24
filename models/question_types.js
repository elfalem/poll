"use strict";

module.exports = (sequelize, DataTypes) => {
  var QuestionType = sequelize.define("question_type", {
    type: { type: DataTypes.STRING, allowNull: false }
  }, {
    timestamps: false
  });

  return QuestionType;
};
