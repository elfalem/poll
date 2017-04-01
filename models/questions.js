"use strict";

module.exports = (sequelize, DataTypes) => {
  var Question = sequelize.define("question", {
    question: { type: DataTypes.STRING, allowNull: false },
    expiration: { type: DataTypes.DATE },
  },
    {
      underscored: true,
      getterMethods: {
        hasExpired: function () {
          return this.expiration <= new Date();
        },

        rowPartial: function () {
          return this.question_type_id == 2 ? 'row_multiple' : 'row_single';
        },

        votes: function () {
          let total = this.totalVotes;
          return this.options.map(o => {
            let votes = o.user_answers.length;
            return {
              optionText: o.option,
              votes: votes,
              pct: Math.round((votes*100.0)/total, 1)
            };
          });
        },

        totalVotes: function () {
          return this.options.map(o => o.user_answers.length)
            .reduce((a, b) => {
              return a + b;
            }, 0);
        }
      },
      classMethods: {
        associate: function (models) {
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
