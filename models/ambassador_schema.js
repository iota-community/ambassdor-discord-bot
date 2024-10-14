export const ambassadorSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'string'
        },
        twitterId: {
            type: 'string'
        },
        points: {
            type: 'string'
        },
        timestamp: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'name', 'twitterId', 'points', 'timestamp']
}