"use strict";

module.exports = (sequelize, DataTypes) => {
  var Question = sequelize.define("question", {
    question: { type: DataTypes.STRING, allowNull: false },
    expiration: { type: DataTypes.DATE },
    socket_name: { type: DataTypes.STRING, allowNull: false }
  },
    {
      defaultScope: {
        include: [{
          model: sequelize.import('options.js'),
          order: "id"
        }] // always include option data
      },
      underscored: true,
      getterMethods: {
        hasExpired: function () {
          return this.expiration <= new Date();
        },

        votes: function () {
          let total = this.totalVotes;
          return this.options.map(o => {
            let votes = o.user_answers.length;
            return {
              optionText: o.option,
              votes: votes,
              pct: Math.round((votes * 100.0) / total * 100)/100,
              voters: o.user_answers.map(v => {
                return {
                  "userId": v.user.hipchat_user_id,
                  "name": v.user.full_name,
                  "avatar": v.user.avatar
                }
              })
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
      instanceMethods: {
        hasVoteFrom: function (userId) {
          for (let o of this.options) {
            for (let u of o.user_answers) {
              if (u.user.id === userId) {
                return true;
              }
            }
          }

          return false;
        },
        generateSocketName: function () {
          const alpha = "abcdefghijklmnopqrstuvwxyz0123456789";
          let name = "";
          for (let i = 0; i < 16; i++) {
            let r = Math.floor(Math.random() * alpha.length);
            name += alpha[r];
          }

          this.socket_name = name;
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
