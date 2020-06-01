module.exports = `  

    """
    The directive instructs the API to implement the runtime administration behavior
    should the query or mutation support a particular administrative behavior,
    otherwise, it's ignored
    """
    directive @isAdmin on FIELD
    
    
    """The directive is applied at design time to fields that
    require that the caller has permissions to view data that
    is deemed to be PERSONAL in scope, for example email addresses.
    """
    directive @requiresPersonalScope on FIELD_DEFINITION
    
    """A custom scalar that returns time data as JavaScript Date object"""
    scalar Date
    
    """A custom scalar that returns data as a generic JavaScript Object. Data will be returned
    as a String, when data is published as a simple string."""
    scalar Object
  
  """
  The interface, Personable describes the fields that
  must be supported by all types describing a person
  """
    interface Personable {
        id: ID
        firstName: String
        lastName: String
        dob: Date
        email: String
    }
   
    """
    The type, Person describes a person in the system. It is
    an implementation of the interface, Personable
    """
    type Person implements Personable{
        id: ID
        firstName: String
        lastName: String
        dob: Date
        email: String @requiresPersonalScope
    }
    
    """
    The type, Actor describes an actor in a movie.
    The type implements the interface, Personable yet
    adds the field role, which is a collection of Role
    types
    """
    type Actor implements Personable{
        id: ID
        firstName: String
        lastName: String
        dob: Date
        email: String
        roles: [Role]
    }
    
    extend type Person {
        """ A list of Person types that this Person is MARRIED_TO, not pageable """
        marriedToConnection: [Person]
        
        """ A list of Person types that this Person is DIVORCED_FROM, not pageable """
        divorcedFromConnection: [Person]
        
        """ A pageable list of Person types that this Person KNOWS """
        knowsConnection(paginationSpec: CursorPaginationInput): PersonConnection
        
        """ A pageable list of Person types that this Person LIKES """
        likesConnection(paginationSpec: CursorPaginationInput): PersonConnection    
    }
    
   type Role {
     """ The full or partial name of a character in the associated movie"""
     character: String!
     """ The movie is which the role appeared """
     movie: Movieable
   }
    

    
     input ActorInput{
        id: ID! #use the ID of an existing person
        firstName: String!
        lastName: String!
        dob: Date!
        role: String!
    }
    
    union PersonActorSearch = Person | Actor
    
    """
    The input type for a person
    """
    input PersonInput{
        firstName: String!
        lastName: String!
        dob: String!
        email: String!
    }
    
    """
    The input type that describes a person that is known in the
    system. A known person has a system assigned ID.
    """
    input KnownPersonInput{
        id: ID!
        firstName: String!
        lastName: String!
        dob: String!
    }
    
    interface Movieable {
        id: ID!
        title: String
        releaseDate: Date
        genre: Genre
        directors: [Person]
        actors: [Actor]
    }   
    
    input MovieInput{
        title: String!
        releaseDate: Date!
        genre: Genre
        directors: [KnownPersonInput]
        actors: [ActorInput]
    }
    input KnownMovieInput{
        id: ID!
        title: String
        releaseDate: Date
        genre: Genre
        directors: [KnownPersonInput]
        actors: [ActorInput]
    }
    
    type Movie  implements Movieable{
        id: ID!
        title: String
        releaseDate: Date
        genre: Genre
        directors: [Person]
        actors: [Actor]
    }
    
    type Cartoon  implements Movieable{
        id: ID!
        title: String
        releaseDate: Date
        genre: Genre
        directors: [Person]
        actors: [Actor]
        animators: [Person]
    }
    
      
    enum Predicate {
        KNOWS
        LIKES
        WORKED_WITH
        MARRIED_TO
        DIVORCED_FROM
    }
    
    enum Genre {
        DRAMA
        COMEDY
        HORROR
        OTHER
    }
    
    type Triple {
        subject: Person
        predicate: Predicate
        object: Person
    }
    
    input TripleInput {
        subject: KnownPersonInput
        predicate: Predicate
        object: KnownPersonInput
    }
     
   """The enum, EventName is a list of values that
   can be assigned to the name field of the type, Event"""
   enum EventName {
       PING
       PERSON_EVENT_TYPE_ADD,
       PERSON_EVENT_TYPE_UPDATE,
       MOVIE_EVENT_TYPE_ADD,
       MOVIE_EVENT_TYPE_UPDATE,
       TRIPLE_EVENT_TYPE_ADD,
       TRIPE_EVENT_TYPE_UPDATE
    }
    
    
    """The enum, GeneralEventChannelName describes the channel name 
    used by the subscription, onEventAdded"""
    enum GeneralEventChannelName { GENERAL_EVENT_CHANNEL }
     
     """The enum, PersonChannelName describes the channel name 
    used by the subscriptions, onPersonAdded,  onPersonUpdated"""
    enum PersonChannelName {PERSON_CHANNEL}
    
    """The enum, TripleChannelName describes the channel name 
    used by the subscriptions, onTripleAdded, onTripleUpdated"""
    enum TripleChannelName {TRIPLE_CHANNEL}
    
    """The enum, MovieChannelName describes the channel names 
    used by the subscriptions, onMovieAdded, onMovieUpdated"""
    enum MovieChannelName {
       MOVIE_CHANNEL, 
       HORROR_MOVIE_CHANNEL, 
       DRAMA_MOVIE_CHANNEL, 
       COMEDY_MOVIE_CHANNEL
     }
    
    """
    Event is a custom type that describes messages emitted
    from a subscription within the IMBOB API.
    """
    type Event {
        """This system assigned unique identifier"""
        id: ID
         """The name of the event as described by GraphQL enum, EventName"""
        name: EventName
        """The time when the event was created"""
        createdAt: Date
        """The time when the event was saved in the datastore"""
        storedAt: Date
        """The body field contains the message information, returned as a JavaScript
        object or a String, when the body is published as a simple string."""
        body: Object
    }

    type Query {
        persons (paginationSpec: CursorPaginationInput): Persons
        person(id: ID!): Person
        actor(id: ID!): Actor
        actors: [Actor]
        movies: [Movie]
        movie(id: ID!): Movie
        triples: [Triple]
        triplesByPredicate (predicate: Predicate!): [Triple]
        getPersonActor(lastName: String!): [PersonActorSearch]
        searchPerson(paginationSpec: CursorPaginationInput, firstName: String!, lastName: String!): Persons
    }
    
    type Mutation {
    """
    Ping is a utility mutation for testing event generation
    in a subscription. When a client executes Ping that data
    is published to the subscription, onEventAdded,
    on the channel, GENERAL_EVENT_CHANNEL.
    
    The string value assigned to the query parameter,
    body will be recycled into Event.path of the
    subsciption message published.
    """
        ping(messageBody: String!): Event
        addMovie(movie: MovieInput!): Movie
        updateMovie(movie: KnownMovieInput): Movie
        addTriple(triple: TripleInput): Triple
        addPerson(person: PersonInput): Person
    }
    
    type Subscription {
        """Supported Channels: GENERAL_EVENT_CHANNEL"""
        onEventAdded(channelName: GeneralEventChannelName): Event
        """Supported Channels: PERSON_CHANNEL"""
        onPersonAdded(channelName: PersonChannelName): Event
        """
        onMovieAdded is a subscription that emits messages when a movie is added to the system.
        Supported Channels: MOVIE_CHANNEL, HORROR_MOVIE_CHANNEL, DRAMA_MOVIE_CHANNEL, COMEDY_MOVIE_CHANNEL"""
        onMovieAdded(channelName: MovieChannelName): Event
        """Supported Channels: TRIPLE_CHANNEL"""
        onTripleAdded(channelName: TripleChannelName): Event
        """Supported Channels: PERSON_CHANNEL"""
        onPersonUpdated(channelName: PersonChannelName): Event
        """Supported Channels: MOVIE_CHANNEL, HORROR_MOVIE_CHANNEL, DRAMA_MOVIE_CHANNEL, COMEDY_MOVIE_CHANNEL"""
        onMovieUpdated(channelName: MovieChannelName): Event
       """Supported Channels: TRIPLE_CHANNEL"""
        onTripleUpdated(channelName: TripleChannelName): Event
    }
    """ 
   The purpose of CursorPaginationInput is to pass 
   pagination information to the IMBOB API when executing
   queries that specify support for pagination"""
    input CursorPaginationInput{
        """ Indicates the starting point of retrieval.
        All data is to be returned from items BEFORE the indicated starting
        point. """
        before: String
         """
        Indicates the starting point of retrieval. All data is
        to be returned from items AFTER this starting
        point. """
        after: String
        """ The number of items to be returned from the starting point as
        defined in the CursorPaginationInput field named, after, moving forward through the total list
        of data items available. """        
        first: Int
        """
        The number of items to be returned from the starting point as
        defined in the CursorPaginationInput field named, before, moving backward through the total list
        of data items available. """ 
        last: Int
        """ Indicates the field to field upon which to sort. Sort order is ascending. """
        sortFieldName: String
    }
    
    """
    Connections and Edges
    """
    
    type PersonEdge {
        cursor: String!
        node: Person!
    }
    
    type Persons {
        collection: [Person]
        pageInfo: PageInfo!
    }
    
    type PersonConnection {
        edges: [PersonEdge]
        pageInfo: PageInfo!
    }
    
    
    type PageInfo {
        """Indicates the unique identifier of the last item in the list of items returned by 
        the given query"""
        endCursor: String
        """Returns true if more items are available for retrieval"""
        hasNextPage: Boolean
     }
`;
