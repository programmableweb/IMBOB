const _ = require('lodash');
const {PubSub, ApolloError } = require('apollo-server');
const uuidv4 = require('uuid/v4');
const {getCollection, updateCollection, getItemFromCollection} = require('../data/index');
const {getRuntimeInfo} = require('../admin/runtimeInfo');

const pubsub = new PubSub();

const GENERAL_EVENT_CHANNEL = 'GENERAL_EVENT_CHANNEL';
const PERSON_CHANNEL = 'PERSON_CHANNEL';
const TRIPLE_CHANNEL = 'TRIPLE_CHANNEL';
const MOVIE_CHANNEL = 'MOVIE_CHANNEL';
const HORROR_MOVIE_CHANNEL = 'HORROR_MOVIE_CHANNEL';
const DRAMA_MOVIE_CHANNEL = 'DRAMA_MOVIE_CHANNEL';
const COMEDY_MOVIE_CHANNEL = 'COMEDY_MOVIE_CHANNEL';

const PERSON_EVENT_TYPE_ADD = 'PERSON_EVENT_TYPE_ADD';
const MOVIE_EVENT_TYPE_ADD = 'MOVIE_EVENT_TYPE_ADD';
const TRIPLE_EVENT_TYPE_ADD = 'TRIPLE_EVENT_TYPE_ADD';

const PERSON_EVENT_TYPE_UPDATE = 'PERSON_EVENT_TYPE_UPDATE';
const MOVIE_EVENT_TYPE_UPDATE = 'MOVIE_EVENT_TYPE_UPDATE';
const TRIPLE_EVENT_TYPE_UPDATE = 'TRIPLE_EVENT_TYPE_UPDATE';



const createEvent = (eventType, messageBody) =>{
    const dt = new Date();
    const uuid = uuidv4();
    const obj = {
        id: uuid,
        name: eventType,
        createdAt: dt.toString(),
        storedAt: dt.toString(),
        body: messageBody
    };

    return obj;
};

const publishEvent = async (eventName, messageBody) => {
    const event = createEvent(eventName, messageBody);
    await pubsub.publish(GENERAL_EVENT_CHANNEL, {onEventAdded: event});
    return event;
};



const publishPersonEvent = async (eventType, messageBody) => {
    const event = createEvent(eventType, messageBody);
    const obj = {};
    if(PERSON_EVENT_TYPE_ADD) obj.onPersonAdded = event;
    if(PERSON_EVENT_TYPE_UPDATE) obj.onPersonUpdated = event;

    await pubsub.publish(PERSON_CHANNEL, obj);
    return event;
};

const publishTripleEvent = async (eventType, messageBody) => {
    const event = createEvent(eventType, messageBody);
    const obj = {};
    if(TRIPLE_EVENT_TYPE_ADD) obj.onTripleAdded = event;
    if(TRIPLE_EVENT_TYPE_UPDATE) obj.onTripleUpdated = event;

    await pubsub.publish(TRIPLE_CHANNEL, obj);
    return event;
};

/***************************
 param: eventType, a constant value that indicates the type of event that
 is to be published. eventType is a value that is custom to IMBOB
 movie: an object that contains information about the movie
 ****************************/
const publishMovieEvent = async (eventType, movie) => {
    //set the default channel
    let channel = MOVIE_CHANNEL;

    //figure out if the movie message needs to be dedicated to a specific channel
    if(movie.genre){
        if(movie.genre === "DRAMA") channel = DRAMA_MOVIE_CHANNEL;
        if(movie.genre === "HORROR") channel = HORROR_MOVIE_CHANNEL;
        if(movie.genre === "COMEDY") channel = COMEDY_MOVIE_CHANNEL;
    }

    //Create the event to be assigned to the subscription object
    const event = createEvent(eventType, movie);

    //Create the subscription object that the PubSub component needs
    //in order to publish information to interested subscribers
    const subscriptionDefinitionObj = {};

    //assign the event to the appropriate subscription
    if(MOVIE_EVENT_TYPE_ADD) subscriptionDefinitionObj.onMovieAdded = event;
    if(MOVIE_EVENT_TYPE_UPDATE) subscriptionDefinitionObj.onMovieUpdated = event;

    //publish the event
    await pubsub.publish(channel, subscriptionDefinitionObj);
    return event;
};


const extractPredicateObjects = async (firstName, lastName, predicateValue) => {
    const triples = getCollection('triples');
    const arr = _.filter(triples, {subject: {firstName: firstName, lastName: lastName,}, predicate: predicateValue});

    const rslt = [];
    for (let i = 0; i < arr.length; i++) {
        //add the time stamp from the parent
        arr[i].object.createdAt = arr[i].createdAt;
        rslt.push(arr[i].object);
    }
    return rslt;
};

const getExtendedPaginationSpec = (arr, pageinationSpec) =>{
    let idxs = [0];
    let start = 0;
    let end = 9;
    const defaultReturnCount = 10;

    const sorted = _.sortBy(arr, pageinationSpec.sortFieldName);

    if(pageinationSpec){
        //error out, if there is a before and after
        if(pageinationSpec.after && pageinationSpec.before) {
            const msg = `Before and After Cursor Pagination Configuration Error. Before: ${pageinationSpec.before}, After: ${pageinationSpec.after}`;
            throw new Error(msg);
        }
        //Make pageinationSpec.after the default
        if(!pageinationSpec.after && !pageinationSpec.before){
            pageinationSpec.after = sorted[0].id;
            end = pageinationSpec.first -1;
        }

        if(pageinationSpec.after){
            idxs = _.keys(_.pickBy(sorted, {id: pageinationSpec.after}));
            //don't reset if the item in question is at position zero
            if(idxs[0] > 0){
                start = Number.parseInt(idxs[0]) + 1;
            }
            const cnt = pageinationSpec.first || defaultReturnCount;
            end = start + cnt;
        }
        if(pageinationSpec.before) {
            idxs = _.keys(_.pickBy(sorted, {id: pageinationSpec.before}));
            start = Number.parseInt(idxs[0]);
            if(pageinationSpec.last) {
                end = start - pageinationSpec.last;
            }
        }
    }
    pageinationSpec.startPos = start;
    pageinationSpec.endPos = end;


    //return the sorted data and the extended paginationSpec
    return {data: sorted, idxs, pageinationSpec};
};

const  convertArrayToPersons = async (arr, pageinationSpec) => {
    const pageData = getExtendedPaginationSpec(arr, pageinationSpec);
    const start = pageData.pageinationSpec.startPos;
    const end = pageData.pageinationSpec.endPos;
    //const edges = [];
    const range = [start, end].sort((a, b)=>{return a-b}); // regardless of before or after, range needs descending

    let bufferArr = pageData.data.slice(range[0],range[1]);
    if(bufferArr.length){

        let endCursor  = bufferArr[bufferArr.length - 1].id; //the default
        let hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 <= pageData.data.length; //default
        if(pageinationSpec.after){
            endCursor = bufferArr[bufferArr.length - 1].id;
            pageData.idxs = _.keys(_.pickBy(pageData.data, {id: endCursor}));
            hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 <= pageData.data.length;
        }

        if(pageinationSpec.before){
            bufferArr.reverse();
            endCursor = bufferArr[0].id;
            pageData.idxs = _.keys(_.pickBy(pageData.data, {id: endCursor}));
            hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 >= 0;
        }
        const pageInfo = {endCursor, hasNextPage};
        return {collection: bufferArr, pageInfo}
    }
};

const  convertArrayToConnection = async (arr, pageinationSpec) => {
    const pageData = getExtendedPaginationSpec(arr, pageinationSpec);
    const start = pageData.pageinationSpec.startPos;
    const end = pageData.pageinationSpec.endPos;
    const edges = [];
    const range = [start, end].sort(); // regardless of before or after, range needs descending

    let bufferArr = pageData.data.slice(range[0],range[1]);
    bufferArr.forEach(a => {
        edges.push({cursor: a.id, node: a})
    });
    if(edges.length){

        let endCursor  = edges[edges.length - 1].cursor; //the default
        let hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 <= pageData.data.length; //default
        if(pageinationSpec.after){
            endCursor = edges[edges.length - 1].cursor;
            pageData.idxs = _.keys(_.pickBy(pageData.data, {id: endCursor}));
            hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 <= pageData.data.length;
        }

        if(pageinationSpec.before){
            edges.reverse();
            endCursor = edges[0].cursor;
            pageData.idxs = _.keys(_.pickBy(pageData.data, {id: endCursor}));
            hasNextPage = Number.parseInt(pageData.idxs[0]) + 2 >= 0;
        }
        const pageInfo = {endCursor, hasNextPage};
        return {edges, pageInfo}
    }
};

const setPaginationSortOrderDefault = (paginationSpec, defaultSortFieldName) => {
    if(!paginationSpec) paginationSpec = {};
    if(!paginationSpec.sortFieldName) paginationSpec.sortFieldName = 'lastName';
    return paginationSpec;
};

const resetActorToMovie = (movieId) => {
    const itm = getItemFromCollection("MOVIES", movieId);
    if(itm.actors){
        itm.actors.forEach(actor => {
            const role = {};
            role.character = actor.role;
            role.movie = itm;
            actor.roles = [];
            actor.roles.push(role);
        });
    }
    return itm;
};

const getActorFromMovies = (actorId) =>{
    const mvs = _.filter(getCollection('movies'),
        {
            actors: [{id: actorId}]
        }
    );
    const a = _.filter(mvs[0].actors, {id: actorId})[0];
    a.roles = [];
    mvs.forEach(m => {
        const r = {};
        r.character = _.find(m.actors, {id: actorId}).role;
        r.movie = m;
        a.roles.push(r);
    });
    return a;
};

const getActors = () =>{
    //get the movies
    const movies = getCollection('movies');
    let buffer = [];
    movies.forEach(movie => {
        movie.actors.forEach(actor => {
            buffer.push(actor.id);
        })
    });

    const actorIds = buffer.filter(function(elem, index, self) {
        return index === self.indexOf(elem);
    });

    buffer = [];
    actorIds.forEach(id =>{
        buffer.push(getActorFromMovies(id))
    });

    return buffer;
};

const validateNewActor = (actor)=> {
    //see is the actor is a known person,
    const persons = getCollection("persons");
    const a = _.find(persons, {id: actor.id});
    //if not, error
    if(!a) {
        const str =  `The actor, ${actor.firstName} ${actor.lastName} does not exist as a Person in the system. Please fisst add the actor using addPerson()`;
        throw new ApolloError()
    }
};

const getPersons = async (paginationSpec, firstName, lastName) =>{
    let arr;
    if(!firstName && !lastName){
        arr = getCollection('persons');
    }else{
        arr = _.filter(getCollection('persons'), {firstName, lastName})
    }

    if(arr.length > 0){
        paginationSpec = setPaginationSortOrderDefault(paginationSpec, 'lastName');
        const buffer =  await convertArrayToPersons(arr, paginationSpec);
        return buffer;
    };
};

module.exports = {
    Object: {
        __parseValue(value) {
            return JSON.parse(value)
        },
        __serialize(value) {
            return value;
        }
    },

    Date: {
        __parseValue(value) {
            return new Date(value); // value from the client
        },
        __serialize(value) {
            return value;
        }
    },
    Query: {
        persons: async (parent, args, context, info) => {
            return await getPersons(args.paginationSpec);
        },
        person: (parent, args, context) => _.find(getCollection('persons'), {'id': args.id}),
        actors: (parent, args, context) => {
            return getActors();
        },
        actor: (parent, args, context) => {
            return getActorFromMovies(args.id)
        },
        movies: (parent, args, context) => {
           const movies =  getCollection('movies');
           const buffer = [];
           movies.forEach(movie => {
              if(movie.id && movie.id.length > 0) buffer.push(resetActorToMovie(movie.id))
           } );
            return buffer;
        },
        movie: (parent, args, context) => {
            if(args.id && args.id.length > 0) return resetActorToMovie(args.id);
        },
        triples: (parent, args, context) => getCollection('triples'),
        triplesByPredicate: (parent, args, context) => {
            return _.filter(getCollection('triples'), {'predicate': args.predicate});
        },
        getPersonActor: (parent, args, context) => {
            const actors = _.filter(getActors(), {'lastName': args.lastName});
            const persons =  _.filter(getCollection('persons'), {'lastName': args.lastName});

            return[...actors, ...persons];
        },
        searchPerson: async (parent, args, context, info) => {
            const arr = await getPersons(args.paginationSpec, args.firstName, args.lastName);
            return arr;
        }
    },

    PersonActorSearch: {
        __resolveType(obj, context, info) {
            if (obj.roles) {
                return 'Actor';
            } else {
                return 'Person'
            }
        }
    },

    Personable: {
        __resolveType(obj, context, info) {
            if (obj.roles) {
                return 'Actor';
            } else {
                return 'Person'
            }
        }
    },
    Movieable: {
        __resolveType(obj, context, info) {
            if (obj.animators) {
                return 'Cartoon';
            } else {
                return 'Movie'
            }
        }
    },
    Person: {
        likesConnection: async (parent, args, context, info) => {
            const arr = await extractPredicateObjects(parent.firstName, parent.lastName, "LIKES");
            args.paginationSpec = setPaginationSortOrderDefault(args.paginationSpec, 'createdAt');
            if(arr.length > 0) return await convertArrayToConnection(arr, args.paginationSpec);
        },
        knowsConnection: async (parent, args, context, info) => {
            const arr = await extractPredicateObjects(parent.firstName, parent.lastName, "KNOWS");
            args.paginationSpec = setPaginationSortOrderDefault(args.paginationSpec, 'createdAt');
            if(arr.length > 0) return await convertArrayToConnection(arr,args.paginationSpec);
        },
        marriedToConnection: async (parent, args, context, info) => {
            return await extractPredicateObjects(parent.firstName, parent.lastName, "MARRIED_TO");
        },
        divorcedFromConnection: async (parent, args, context, info) => {
            return await extractPredicateObjects(parent.firstName, parent.lastName, "DIVORCED_FROM");
        }
    },
    Mutation: {
        ping: async (parent, args, context, info) => {
            const event = await publishEvent('PING', args.messageBody);
            console.log(event);
            let isAdmin = false;
            //check to see if the directive, @isAdmin is in force
            try {
                isAdmin = info.fieldNodes[0].directives[0].name.value === 'isAdmin'
            } catch (e) {
                console.log(`I am gobbling the error ${e}`)
            }
            //if so, add the administrative data and reformat the body
            if(isAdmin){
                const data = event.body;
                const adminData = getRuntimeInfo();
                event.body = {data, adminData};
            }
            return event;
        },
        addMovie: async (parent, args) => {
            args.movie.id = uuidv4();
            const movie = await updateCollection(args.movie, 'MOVIES');
            await publishMovieEvent(MOVIE_EVENT_TYPE_ADD, movie);
            return movie;

        },
        updateMovie: async (parent, args) => {
            //get the movie
            const movie = getItemFromCollection('MOVIES', args.movie.id);

            //if there is a title, add the new title
            if (args.movie.title) movie.title = args.movie.title;

            //if there's a new release date, add the new release date
            if (args.movie.releaseDate) movie.releaseDate = args.movie.releaseDate;

            //diff the directors and add only the added director
            const d = _.differenceWith(args.movie.directors, movie.directors, _.isEqual);
            movie.directors = _.union(movie.directors, d);

            //diff the actors and add only the
            const a = _.differenceWith(args.movie.actors, movie.actors, _.isEqual);
            movie.actors = _.union(movie.actors, a);

            await updateCollection(movie, "MOVIES");
            const m = getItemFromCollection("MOVIES", movie.id);

            const event = await publishMovieEvent(MOVIE_EVENT_TYPE_UPDATE, movie);
            console.log(event);
            console.log(m);
            return m;
        },
        addPerson: async (parent, args) => {
            //Create a unique identifier
            args.person.id = uuidv4();
            //add the person to the Persons collection
            const data = await updateCollection(args.person, 'PERSONS');
            //Emit a pubsub event informing subscribers
            const event = await publishPersonEvent(PERSON_EVENT_TYPE_ADD, JSON.stringify(args.person));
            //log relevant data
            console.log(event);
            console.log(data);
            //return the value from the updateCollection method
            return data;
        },
        addTriple: async (parent, args) => {
            const data = await updateCollection(args.triple, 'TRIPLES');
            const event = await publishTripleEvent(TRIPLE_EVENT_TYPE_ADD, JSON.stringify(args.person));
            console.log(event);
            console.log(data);
            return data;
        }
    },

    Subscription: {
        onEventAdded: {
            subscribe: () => pubsub.asyncIterator(GENERAL_EVENT_CHANNEL)
        },
        onPersonAdded: {
            subscribe: () => pubsub.asyncIterator(PERSON_CHANNEL)
        },
        onMovieAdded: {
            subscribe: () => pubsub.asyncIterator(MOVIE_CHANNEL)
        },
        onTripleAdded: {
            subscribe: () => pubsub.asyncIterator(TRIPLE_CHANNEL)
        }
    }
};