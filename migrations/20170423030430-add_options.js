'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    let p = queryInterface.createTable('options', {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      option: { type: DataTypes.STRING, allowNull: false },
      question_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'questions', id: 'id' } }
    })
    return p;
  },

  down: function (queryInterface) {
    let p = queryInterface.dropTable('options')
    return p;
  }
};
