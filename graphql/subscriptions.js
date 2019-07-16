const { AuthenticationError } = require("apollo-server");
const config = require('../config');
const admin = require('../admin');

module.exports =  {
    onConnect: (connectionParams) => {
        console.log('Trying to connect subscriptions at: ' + new Date())
        const token = connectionParams.authorization || connectionParams.Authorization;
        if(token) token.replace('Bearer ','');
        if(!admin.isValidToken(token)){
            throw new AuthenticationError('Invalid Access Token');
        }
        console.log(`Connection made , info ${JSON.stringify(connectionParams)} 
        at ${new Date().toString()}`)
    }
};

