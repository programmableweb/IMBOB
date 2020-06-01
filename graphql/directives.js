const {SchemaDirectiveVisitor} = require("graphql-tools");
const {DirectiveLocation, GraphQLDirective} = require("graphql");
const {IncomingMessage} = require("http");
const config = require("../config");

/*******************************************
 This class provides the processing logic for the directive
 requiresPersonalScope. For now the directive processes information
 found in ../config.js. TokenOne does NOT have permission to access
 fields marked with the directive, requiresPersonalScope.

 TokenTwo does have permission to access directives marked with
 requiresPersonalScope.
 ********************************************/
class RequiresPersonalScope extends SchemaDirectiveVisitor {
    static getDirectiveDeclaration(directiveName, schema) {
        return new GraphQLDirective({
            name: "requiresPersonalScope",
            locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT]
        });
    }

    visitObject(obj) {
        const fields = obj.getFields();

        Object.keys(fields).forEach(fieldName => {
            const field = fields[fieldName];
            const next = field.resolve;

            field.resolve = function (result, args, context, info) {
                isValidToken({context}); // will throw error if not valid signed jwt
                return next(result, args, context, info);
            };
        });
    }

    visitFieldDefinition(field) {
        const next = field.resolve;

        field.resolve = function (result, args, context, info) {
            //get the affected field
            const affectedField = info.fieldName;

            if (!isValidToken({context})) {
                result[affectedField] = 'You are not authorized to view personal information';
            }
            return result[affectedField];
        };
    }
}

const isValidToken = ({context}) => {
    const req = context instanceof IncomingMessage ? context : (context.req || context.request);
    return config.hasPersonalScope(config.getToken(req));
};

module.exports = RequiresPersonalScope;