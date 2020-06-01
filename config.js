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

