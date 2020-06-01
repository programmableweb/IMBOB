const { AuthenticationError } = require("apollo-server");
const config = require('../config');

module.exports =  {
    onConnect: (connectionParams) => {
        const dt = new Date();
        const token = connectionParams.authorization || connectionParams.Authorization;
        if(token) token.replace('Bearer ','');
        console.log({token: token, accessTime: dt});

        if(!config.canAccess(token)){
            throw new AuthenticationError('Invalid Access Token');
        }

        console.log(`Connection made , info ${JSON.stringify(connectionParams)} 
        at ${dt.toString()}`)
    }
};

