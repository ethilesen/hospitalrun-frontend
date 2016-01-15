var crypto = require('crypto');
var bodyParser = require('body-parser'),
    config =  require('../config.js'),
    nano = require('nano')(config.couch_auth_db_url),
    users = nano.use('_users');

if (process.env.VCAP_SERVICES){ // check if running on Bluemix
        bluemix = true;
        console.log("running on bluemix");

        }
console.log("Using db on: ",config.couch_db_server);
function delete_user(user, idToDelete, rev, res) {
  if (is_admin(user)) {
    users.destroy(idToDelete, rev, function(err, body) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        res.json(body);
      }
    });
  }
}

function find_user(userName, callback) {
  var user_key = userName;
  if (user_key.indexOf('org.couchdb.user:') !== 0) {
    user_key = 'org.couchdb.user:' + user_key;
  }
  users.get(user_key, {}, function(err, body) {
    if (err) {
      callback(err);
      return;
    }
    callback(null, body);
  });
}

function get_primary_role(user) {
  var primaryRole = '';
  if (user.roles) {
    user.roles.forEach(function(role) {
      if (role !== 'user' && role !== 'admin') {
        primaryRole = role;
      }
    });
  }
  return primaryRole;
}

function get_user(user, id, res) {
  if (is_admin(user)) {
    find_user(id, function(err, body) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        res.json(body);
      }
    });
  }
}

function get_users(user, res) {
  if (is_admin(user)) {
    var options = {
      include_docs: true,
      startkey: 'org.couchdb.user'
    };
    users.list(options, function(err, body) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        res.json(body);
      }
    });
  } else {
    res.json({ error: true, errorResult: 'Unauthorized' });
  }
}

function is_admin(user) {
  var isAdmin = false;
  if (user.roles) {
    user.roles.forEach(function(role) {
      if (role === 'admin') {
        isAdmin = true;
      }
    });
  }
  return isAdmin;
}

function update_user(user, userData, updateParams, res) {
  if (is_admin(user)) {
    if(bluemix){
      console.log("hash/salt data for cloudant");
      var hashAndSalt = generatePasswordHash(userData.password);
      userData.password_sha = hashAndSalt[0];
      userData.salt = hashAndSalt[1];
    }
    users.insert(userData, updateParams, function(err, body) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        res.json(body);
      }
    });
  }
}
function generatePasswordHash(password){
  var salt = crypto.randomBytes(16).toString('hex');
  var hash = crypto.createHash('sha1');
  hash.update(password + salt);
  return [hash.digest('hex'), salt];
}

module.exports = function(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.post('/chkuser', function(req, res) {
    find_user(req.body.name, function(err, user) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        res.json({
          displayName: user.displayName,
          prefix: user.userPrefix,
          role: get_primary_role(user)
        });
      }
    });
  });

  app.post('/allusers', function(req, res) {
    find_user(req.body.name, function(err, user) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        get_users(user, res);
      }
    });
  });

  app.post('/deleteuser', function(req, res) {
    find_user(req.body.name, function(err, user) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        delete_user(user, req.body.id, req.body.rev, res);
      }
    });
  });

  app.post('/getuser', function(req, res) {
    find_user(req.body.name, function(err, user) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        get_user(user, req.body.id, res);
      }
    });
  });

  app.post('/updateuser', function(req, res) {
    find_user(req.body.name, function(err, user) {
      if (err) {
        res.json({ error: true, errorResult: err });
      } else {
        update_user(user, req.body.data, req.body.updateParams, res);
      }
    });
  });
};
