'use strict';
let questionTypes = [{type:'Single Choice'}, {type:'Multiple Choice'}];

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('question_types', questionTypes);
  },

  down: function (queryInterface, Sequelize) {
    
  }
};
