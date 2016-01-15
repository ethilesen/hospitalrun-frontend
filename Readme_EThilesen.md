The Idea here are to make this project easely deploy to Bluemix with Cloudant db.
I will try to change as little as possible - but some issues with Cloudant vs couch needs a tweak...
This are more a hack.... to see if we can  make it work...

Create a Node.js with a cloudant database in Bluemix.

Create the following databases:
SECUREHOST  = cloudantuser:password@clodanthostname  - get it from bluemix VCAP_SERVICES...

curl -X PUT $SECUREHOST/_users
curl -X PUT $SECUREHOST/_users/_security -d '{ "admins": { "names": [], "roles": ["admin"]}, "members": { "names": [], "roles": []}}'
curl -X PUT $SECUREHOST/config
curl -X PUT $SECUREHOST/config/_security -d '{ "admins": { "names": [], "roles": ["admin"]}, "members": { "names": [], "roles": []}}'
curl -X PUT $SECUREHOST/main
curl -X PUT $SECUREHOST/main/_security -d '{ "admins": { "names": [], "roles": ["admin"]}, "members": { "names": [], "roles": ["user"]}}'
curl -X PUT $SECUREHOST/_users/org.couchdb.user:hradmin -d '{"name": "hradmin", "password": "test", "roles": ["System Administrator","admin","user"], "type": "user", "userPrefix": "p1"}'

The first time you log on use the username and password from VCAP_SERVICES. - then edit the hradmion user and update - this will hash/salt the user password and you can logon with hradmin. New users will be created correct...

I did a quick and dirty to and gave read access to all to the config database to avoid the login popup at startup... will fix this later
