/*
BE ADVISED: The way user information management is conducted in IMBOB in general
and this file, config.js in particular is far from optimal. In fact it's pretty bad business.

User access information should never be written to disk or as easily accessible as it is here.

The reason for such lax practice is that the intention of IMBOB is to demonstrate key
features of GraphQL as easily as possible. Thus, for demonstration purposes I have
been far less than stringent in user administration. I hope you understand.
 */
const tokenOne = 'ch3ddarch33s3';
const tokenTwo = 's!ssch33s3';

const accessTokens = [tokenOne, tokenTwo];
module.exports = {
    canAccess: (accessToken) => {
        return accessTokens.includes(accessToken);
    },
    hasPersonalScope:(accessToken) =>{
        return accessToken === tokenTwo;
    },
    getToken: (req) =>{
        if (
            !req ||
            !req.headers ||
            (!req.headers.authorization && !req.headers.Authorization)
        ) return false;

        const token = req.headers.authorization || req.headers.Authorization;
        return token.replace('Bearer ','');
    }

};

