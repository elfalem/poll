"use strict";

module.exports = (sequelize, DataTypes) => {
  var Group = sequelize.define("group", {
    hipchat_group_id: { type: DataTypes.INTEGER, allowNull: false }
  }, 
  {
    underscored: true,
    classMethods: {
      associate: function(models) {
        Group.hasMany(models.user);
        Group.hasMany(models.room);
      }
    }
  });
  return Group;
};
