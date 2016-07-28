/**
* TEntry.js
*
* @description :: tEntry model imported from localhost MySql server at 4/3/2016 23:34:32.
* @docs        :: http://sailsjs.org/#!documentation/models
*/


module.exports = {

    tableName: 't_entry',

    attributes: {
        id : {
            type: 'integer',
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            columnName: 'Id'
        },

        locked : {
            type: 'text',
            required: true,
			enum: ['YES','NO'],
            defaultsTo: 'NO',
            columnName: 'Locked'
        },

        author : {
			columnName: 'Id_author',
			model: 'TCaver'
		},

        idReviewer : {
            type: 'integer',
            index: true,
            columnName: 'Id_reviewer'
        },

        idLocker : {
            type: 'integer',
            columnName: 'Id_locker'
        },

        name : {
            type: 'string',
            size: 100,
            columnName: 'Name'
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

        address : {
            type: 'string',
            size: 128,
            columnName: 'Address'
        },

        yearDiscovery : {
            type: 'integer',
            columnName: 'Year_discovery'
        },

        idType : {
            type: 'integer',
            unique: true,
            defaultsTo: '0',
            columnName: 'Id_type',
			model: 'TType',
            via: 'id'
        },

        externalUrl : {
            type: 'text',
            columnName: 'External_url'
        },
		
        dateInscription : {
            type: 'datetime',
            columnName: 'Date_inscription'
        },

        dateReviewed : {
            type: 'datetime',
            columnName: 'Date_reviewed'
        },

        dateLocked : {
            type: 'datetime',
            columnName: 'Date_locked'
        },

        isPublic : {
            type: 'text',
            columnName: 'Is_public'
        },

        isSensitive : {
            type: 'text',
            required: true,
            defaultsTo: 'NO',
            columnName: 'Is_sensitive'
        },

        contact : {
            type: 'string',
            size: 1000,
            columnName: 'Contact'
        },

        modalities : {
            type: 'string',
            size: 100,
            required: true,
            defaultsTo: 'NO,NO,NO,NO',
            columnName: 'Modalities'
        },

        hasContributions : {
            type: 'text',
			enum: ['YES','NO'],
            required: true,
            defaultsTo: 'NO',
            columnName: 'Has_contributions'
        },

        latitude : {
            type: 'float',
            index: true,
            columnName: 'Latitude'
        },

        longitude : {
            type: 'float',
            columnName: 'Longitude'
        },

        altitude : {
            type: 'float',
            columnName: 'Altitude'
        },
		
		caves : {
		  collection: 'TCave',
		  via: 'caves',
		  through: 'jcaveentry'
		}
    }
};
