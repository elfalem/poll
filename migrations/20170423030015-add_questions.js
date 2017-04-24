'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    let p = queryInterface.createTable('question_types', {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING, allowNull: false }
    })
      .then(() => {
        queryInterface.createTable('questions', {
          id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
          createdAt: { allowNull: false, type: DataTypes.DATE },
          updatedAt: { allowNull: false, type: DataTypes.DATE },
          question: { type: DataTypes.STRING, allowNull: false },
          expiration: { type: DataTypes.DATE },
          socket_name: { type: DataTypes.STRING, allowNull: false },
          question_type_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'question_types', id: 'id' } }
        })
      })

    return p;
  },

  down: function (queryInterface) {
    let p = queryInterface.dropTable('questions')
      .then(() => {
        queryInterface.dropTable('question_types')
      });

    return p;
  }
};
