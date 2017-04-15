var express = require('express');
var router = express.Router();
var config = require('config');

router.get('/', function (req, res, next) {
  let hostname = config.get('hostname');
  let capabilities = {
    name: "Nick's Poll App",
    description: "Create poll questions and get results quickly in a HipChat room.",
    key: `nicks-poll-app-${process.env.NODE_ENV}`,
    links: {
      homepage: `${hostname}`,
      self: `${hostname}/capabilities`,
    },
    vendor: {
      name: "Nick Rogers",
      url: "https://nickroge.rs"
    },
    capabilities: {
      hipchatApiConsumer: {
        fromName: "Poll",
        scopes: ["send_notification", "view_group"]
      },
      oauth2Consumer: {
        redirectionUrls: [`${hostname}/api/authorized`]
      },
      installable: {
        allowGlobal: false,
        allowRoom: true,
        callbackUrl: `${hostname}/api/installed`
      },
      dialog: [{
        key: "poll_dialog_new",
        title: {
          value: "Poll | New Poll"
        },
        url: `${hostname}/poll/new`,
        options: {
          primaryAction: {
            name: {
              value: "Create"
            },
            key: "dialog.create"
          },
          size: {
            width: "842px",
            height: "620px"
          }
        }
      }, {
        key: "poll_dialog_vote",
        title: {
          value: "Poll"
        },
        url: `${hostname}/poll`,
        options: {
          primaryAction: {
            name: {
              value: "Vote"
            },
            key: "dialog.vote"
          },
          size: {
            width: "842px",
            height: "620px"
          }
        }
      }
      ],
      action: [
        {
          key: "action.new_poll",
          name: {
            value: "Create poll"
          },
          target: "poll_dialog_new",
          location: "hipchat.input.action"
        }
      ]
    }
  };
  res.json(capabilities);
});

module.exports = router;
