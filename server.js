const {ApolloServer, AuthenticationError} = require('apollo-server');
const {makeExecutableSchema} = require("graphql-tools");

const {initGlobalDataSync} = require('./data');
const typeDefs = require('./graphql/typedefs');
const resolvers = require('./graphql/resolvers');
const RequiresPersonalScope = require('./graphql/directives');
const config = require('./config');


const PORT = process.env.PORT || 4000;
/*
The ApolloServer is started by creating a schema that is
defined by the type definitions (typeDefs), the resolvers that
fetch the data for those types, and the subscriptions definition with
the behavior to execute upon the onConnect event. Authentication to the
API is handled by the function associated with the schema's
context field.
*/

const subscriptions = require('./graphql/subscriptions');

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    schemaDirectives: {
        requiresPersonalScope: RequiresPersonalScope
    }
});

const server = new ApolloServer({
    subscriptions,
    schema,
    context: ({req, res}) => {
        if(req){
            const token = config.getToken(req);
            if (req.body.operationName === 'IntrospectionQuery'){
                const accessTime = new Date();
                console.log({operation: req.body.operationName, token, accessTime});
                return req;
            }
            if(!config.canAccess(token)){
                const err = new AuthenticationError(token);
                console.log(err);
                throw err;
            }else{
                const accessTime = new Date();
                console.log({operation: req.body.operationName, token, accessTime});
                return req;
            }

        }
    }
});


//Initialize the data collections globally by calling initGlobalDataSync()
//to load the data into the global environment variables
initGlobalDataSync();

// The server `listen` method launches a web-server and a
// subscription server
server.listen(PORT).then(({url, subscriptionsUrl}) => {
    process.env.SERVER_CONFIG = JSON.stringify({serverUrl: url, subscriptionsUrl});
    console.log(`Starting servers at ${new Date()}`);
    console.log(`🚀  Server ready at ${url}`);
    console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`)
});

//Export the server to make it available to unit and API tests
module.exports = {server};