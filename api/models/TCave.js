/**
* TCave.js
*
* @description :: tCave model imported from localhost MySql server at 31/3/2016 12:7:32.
* @docs        :: http://sailsjs.org/#!documentation/models
*/


module.exports = {

  tableName: 't_cave',

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
      size: 36,
      columnName: 'Name'
    },
	
    minDepth : {
      type: 'float',
      columnName: 'Min_depth'
    },
	
    maxDepth : {
      type: 'float',
      columnName: 'Max_depth'
    },
	
    depth : {
      type: 'float',
      columnName: 'Depth'
    },
	
    length : {
      type: 'float',
      columnName: 'Length'
    },
	
    isDiving : {
      type: 'text',
      defaultsTo: 'NO',
      columnName: 'Is_diving'
    },
	
    temperature : {
      type: 'float',
      columnName: 'Temperature'
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
	
	entries : {
      collection: 'TEntry',
      via: 'entries',
      through: 'jcaveentry'
    },
	
	topographies : {
      collection: 'TTopography',
      via: 'idTopography',
      through: 'jtopocave'
    }
  }
};
