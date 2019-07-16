const jwt = require('jsonwebtoken');
const _ = require('lodash');

const {getCollection, updateCollection} = require('../data/index');
const secret = 'd7b63d7f-f187-4398-b0a1-4c4353e30026';

const createUser = (username, pwd, roles) =>{

}

//returns a token that is good for 1 hr
const createToken = (user ) => {
    const data = {id: user.id, username: user.username, scopes: user.scopes};
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        data: data
    }, secret);
};


const validateToken = (token) => {
    const decoded = jwt.verify(token, secret);
    return decoded;
};

const login =  async function(username, password) {
    const users = getCollection('users');
    const user = _.find(users, {username, password});
    if(!user) throw new Error('Invalid login');
    const token = createToken(user);
    return token;
};

const isValidRequest = (request) =>{
    if(request.body.query) {
        const match = request.body.query.match(/login\(username: ".+", password: ".+"\)/g);
        if(Array.isArray(match) && match.length > 0) return true;
    }

    return isValidToken;
};

const isValidToken = (token) =>{
    if(!token) return false;
    const result = validateToken(token);
    if(!result.data.username) return false;
    if(!result.data.scopes)return false;
    if(result.data.scopes.length === 0)return false;
    return true;
};

module.exports = {
    login,
    validateToken,
    isValidRequest,
    isValidToken
};