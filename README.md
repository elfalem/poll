Nick's Poll App (tentative title) is a polling addon for HipChat.

# Features
* OAuth integration
* Instant updates on results screen
* Single or Multiple choice polls
* Allow users to vote only once

# Local Development Tutorial

Here's how to set up this addon for local development with HipChat:

## Install Node

This app was developed under NodeJS v6.x. Because the Node version in most apt-get repositories is woefully out of date, because reasons, we need to add a new source to install the latest version.

```bash
$ sudo apt-get install curl build-essential
$ curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
$ sudo bash nodesource_setup.sh
$ sudo apt-get install nodejs
```

## Install Postgres
Postgres will be our database. After installing, it creates a user account called `postgres`, which we'll switch into to run commands on the database.

```bash
$ sudo apt-get install postgresql postgresql-contrib
$ sudo -u postgres psql
```

That will load the CLI for Postgres. At the prompt, run the following two commands, replacing the username, password, and database name with whatever you'd like:
```sql
CREATE USER poll WITH SUPERUSER PASSWORD 'P@$$w0rd!';
CREATE DATABASE poll;
```

## Install App Code

After cloning this git repository locally, we'll need to install packages and edit some config files.
```bash
$ npm install
$ mv config/default.json.sample config/default.json
```
Edit default.json and insert the database name, username, and password you entered before. 

## Run Database Migrations

Sequelize is the NPM package used to communicate with the SQL database. To set up the initial state of the database, we'll need to run migrations, which are defined in the `/migrations` directory. They are run in order on our database after running the migrate command.

```bash
$ sudo npm install -g sequelize-cli
$ sequelize init:config
```

Edit the generated config/config.json file with your database login settings above (you only really need to do the development database). Then run:

```bash
$ sequelize db:migrate
```

## Run Application

HipChat addons are required to be HTTPS-enabled, making local development a bit difficult. [ngrok](https://ngrok.com/) to the rescue! ngrok is used to tunnel local traffic to an external HTTPS server. [Download and install ngrok](https://ngrok.com/), and then, in a different console window, run:
```bash
$ ./ngrok http 4001
```
Copy the https hostname given in ngrok into the config/default.json file. We're finally ready to go! Start up the node process with:
```bash
$ node bin/www
```

The https://xxxxxxxx.ngrok.io/capabilities URL should load a JSON document if all went well.
