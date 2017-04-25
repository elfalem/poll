'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    let p = queryInterface.createTable('groups', {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      created_at: { allowNull: false, type: DataTypes.DATE },
      updated_at: { allowNull: false, type: DataTypes.DATE },
      hipchat_group_id: { type: DataTypes.INTEGER, allowNull: false }
    })
      .then(() => {
        queryInterface.createTable('rooms', {
          id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
          created_at: { allowNull: false, type: DataTypes.DATE },
          updated_at: { allowNull: false, type: DataTypes.DATE },
          hipchat_room_id: { type: DataTypes.INTEGER, allowNull: false },
          oauth_id: { type: DataTypes.STRING, allowNull: false },
          oauth_secret: { type: DataTypes.STRING, allowNull: false },
          group_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'groups', id: 'id' } }
        })
      })

    return p;
  },

  down: function (queryInterface) {
    let p = queryInterface.dropTable('rooms')
      .then(() => {
        queryInterface.dropTable('groups')
      });

    return p;
  }
};
