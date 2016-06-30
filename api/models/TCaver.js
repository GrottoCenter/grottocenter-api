/**
* TCaver.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    tableName: 't_caver',

    attributes: {
        id : {
            type: 'integer',
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            columnName: 'Id'
        },

        activated : {
            type: 'text',
			enum: ['YES','NO'],
            required: true,
            defaultsTo: 'NO',
            columnName: 'Activated'
        },

        activationCode : {
            type: 'string',
            size: 32,
            required: true,
            defaultsTo: '0',
            columnName: 'Activation_code'
        },

        banned : {
            type: 'text',
			enum: ['YES','NO'],
            required: true,
            defaultsTo: 'NO',
            columnName: 'Banned'
        },

        ip : {
            type: 'string',
            size: 200,
            columnName: 'Ip'
        },

        browser : {
            type: 'string',
            size: 1000,
            columnName: 'Browser'
        },

        connectionCounter : {
            type: 'integer',
            required: true,
            defaultsTo: '0',
            columnName: 'Connection_counter'
        },

        relevance : {
            type: 'float',
            required: true,
            defaultsTo: '1',
            columnName: 'Relevance'
        },

        name : {
            type: 'string',
            size: 36,
            columnName: 'Name'
        },

        surname : {
            type: 'string',
            size: 32,
            columnName: 'Surname'
        },
        
        login : {
            type: 'string',
            size: 20,
            columnName: 'Login'
        },

        nickname : {
            type: 'string',
            size: 68,
            columnName: 'Nickname'
        },

        password : {
            type: 'string',
            size: 32,
            required: true,
            defaultsTo: '0',
            columnName: 'Password'
        },

        country : {
            type: 'string',
            size: 3,
            columnName: 'Country'
        },

        region : {
            type: 'string',
            size: 32,
            columnName: 'Region'
        },

        city : {
            type: 'string',
            size: 32,
            columnName: 'City'
        },

        postalCode : {
            type: 'string',
            size: 5,
            columnName: 'Postal_code'
        },

        address : {
            type: 'string',
            size: 128,
            columnName: 'Address'
        },

        dateBirth : {
            type: 'date',
            columnName: 'Date_birth'
        },

        contact : {
            type: 'string',
            size: 50,
            columnName: 'Contact'
        },

        yearInitiation : {
            type: 'integer',
            columnName: 'Year_initiation'
        },

        dateInscription : {
            type: 'datetime',
            columnName: 'Date_inscription'
        },

        dateLastConnection : {
            type: 'datetime',
            columnName: 'Date_last_connection'
        },

        language : {
            type: 'string',
            size: 4,
            columnName: 'Language'
        },

        contactIsPublic : {
            type: 'integer',
            required: true,
            defaultsTo: '0',
            columnName: 'Contact_is_public'
        },

        alertForNews : {
            type: 'text',
			enum: ['YES','NO'],
            required: true,
            defaultsTo: 'NO',
            columnName: 'Alert_for_news'
        },

        showLinks : {
            type: 'text',
			enum: ['YES','NO'],
            required: true,
            defaultsTo: 'NO',
            columnName: 'Show_links'
        },

        detailLevel : {
            type: 'integer',
            required: true,
            defaultsTo: '30',
            columnName: 'Detail_level'
        },

        latitude : {
            type: 'float',
            required: true,
            defaultsTo: '0.00000000000000000000',
            columnName: 'Latitude'
        },

        longitude : {
            type: 'float',
            required: true,
            defaultsTo: '0.00000000000000000000',
            columnName: 'Longitude'
        },

        defaultLatitude : {
            type: 'float',
            columnName: 'Default_latitude'
        },

        defaultLongitude : {
            type: 'float',
            columnName: 'Default_longitude'
        },

        defaultZoom : {
            type: 'integer',
            columnName: 'Default_zoom'
        },

        customMessage : {
            type: 'text',
            columnName: 'Custom_message'
        },

        facebook : {
            type: 'string',
            size: 100,
            columnName: 'Facebook'
        },

        pictureFileName : {
            type: 'string',
            size: 100,
            columnName: 'Picture_file_name'
        }
    }
};

