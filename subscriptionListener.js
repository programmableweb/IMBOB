const ws = require('ws');
const { WebSocketLink } = require("apollo-link-ws");
const { execute} = require("apollo-link");
const { SubscriptionClient } = require('subscriptions-transport-ws');
const gql = require('graphql-tag');
const serverConfig = {serverUrl:'http://localhost:4000/', subscriptionUrl:'ws://localhost:4000/graphql'};
const config = require('../config');

const client = new SubscriptionClient(
    serverConfig.subscriptionUrl,
    {
        reconnect: true,
        connectionParams: () => ({
            headers: {
                authorization: config.ACCESS_TOKEN,
            },
        }),
    },
    ws,
);

const link = new WebSocketLink(client);

const operation = {
    query: gql`
        subscription onEventAdded{
            onEventAdded{
                id
                name
                body
                createdAt
                storedAt
            }
        }`
};

// execute returns an Observable so it can be subscribed to
execute(link, operation).subscribe({
    next: data => console.log(`received data: ${JSON.stringify(data, null, 2)}`),
    error: error => console.log(`received error ${error}`),
    complete: () => console.log(`complete`),
});

console.log(`Listener running at ${new Date().toString()}`);
