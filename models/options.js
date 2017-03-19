"use strict";

module.exports = (sequelize, DataTypes) => {
  var Option = sequelize.define("option", {
    option: { type: DataTypes.STRING, allowNull: false }
  }, 
  {
    underscored: true,
    classMethods: {
      associate: function(models) {
        Option.belongsTo(models.question, {
          onDelete: "CASCADE",
          foreignKey: {
            allowNull: false
          }
        });

        Option.hasMany(models.user_answer);
      }
    }
  });

  return Option;
};
