'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    let p = queryInterface.createTable('users', {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      createdAt: { allowNull: false, type: DataTypes.DATE },
      updatedAt: { allowNull: false, type: DataTypes.DATE },
      group_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'groups', id: 'id' } },
      hipchat_user_id: { type: DataTypes.INTEGER, allowNull: false },
      full_name: { type: DataTypes.STRING, allowNull: false },
      avatar: { type: DataTypes.STRING, allowNull: false },
      last_authorized_room: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'rooms', id: 'id' } }
    })
      .then(() => {
        queryInterface.createTable('user_rooms', {
          id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
          createdAt: { allowNull: false, type: DataTypes.DATE },
          updatedAt: { allowNull: false, type: DataTypes.DATE },
          user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', id: 'id' } },
          room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'rooms', id: 'id' } },
          access_token: { type: DataTypes.STRING, allowNull: false },
          access_token_expires: { type: DataTypes.DATE, allowNull: false },
          refresh_token: { type: DataTypes.STRING, allowNull: false },
        })
      })
      .then(() => {
        queryInterface.createTable('user_answers', {
          id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
          createdAt: { allowNull: false, type: DataTypes.DATE },
          updatedAt: { allowNull: false, type: DataTypes.DATE },
          user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', id: 'id' } },
          option_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'options', id: 'id' } }
        })
      });

    return p;
  },

  down: function (queryInterface) {
    let p = queryInterface.dropTable('user_answers')
      .then(() => {
        queryInterface.dropTable('user_rooms')
      })
      .then(() => {
        queryInterface.dropTable('users')
      });

    return p;
  }
};
