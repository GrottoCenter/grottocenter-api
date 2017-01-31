/*eslint no-console: "off"*/
'use strict';
/**
 * importdb.js
 *
 * @description :: sailsjs tool to import model from physical database table to JS model file
 * Usage:
 *        To import all tables (be careful if import has already be done for some tables) :
 *          node importdb.js USER:PASSWORD@HOST:PORT/DATABASENAME
 *        To import specific tables :
 *          node importdb.js USER:PASSWORD@HOST:PORT/DATABASENAME tableName1, tableName2 ...
 *
 */
let mysqlConfig = [];

if (process.argv.length < 3) {
  showUsage();
  return;
}

process.argv.forEach(function(val, index, array) {
  if (index === 2) {
    mysqlConfig = val.split(/[:@\/]/);
  }
});

if (mysqlConfig.length !== 5) {
  showUsage();
  return;
}

let error = 0;
mysqlConfig.forEach(function(val, index, array) {
  if (val === '') {
    switch (index) {
      case 0:
        console.log('Username is necessary.');
        break;
      case 1:
        console.log('Password is necessary.');
        break;
      case 2:
        console.log('Server is necessary.');
        break;
      case 3:
        console.log('Port is necessary.');
        break;
      case 4:
        console.log('Database is necessary.');
        break;
    }
    showUsage();
    error = 1;
    return;
  }
});

if (error !== 0) {
  return;
}

const mysql = require('./node_modules/sails-mysql/node_modules/mysql/index.js');
const fs = require('fs');
const modelsPath = './api/models/';
const controllersPath = './api/controllers/';
const connection = mysql.createConnection({
  host: mysqlConfig[2],
  user: mysqlConfig[0],
  password: mysqlConfig[1]
});

fs.exists(modelsPath, function(exists) {
  if (exists) {
    connection.connect();
    connection.query('use ' + mysqlConfig[4]);
    connection.query('SET NAMES \'utf8\'');

    listTables(function(tableNames) {
      asyncForEach(tableNames, function(item, index, next) {
        tableDetails(item, function(details) {
          analysesTable(item, details, function() {
            next();
          });
        });
      }, function() {
        connection.end();
      });
    });
  } else {
    console.log('\n       Please launch this script from sails directory.\n');
    return;
  }
  return;
});

function analysesTable(tableName, tableDetails, callback) {
  let modelFileContent = '';
  let controllerFileContent = '';

  const modelname = tableName.toCamelCase();
  const filename = modelname.capitalize();
  const d = new Date();
  const now = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

  modelFileContent += '/**\n* ' + filename + '.js\n';
  modelFileContent += '*\n';
  modelFileContent += '* @description :: ' + modelname + ' model imported from ' + mysqlConfig[2] + ' MySql server at ' + now + '.\n';
  modelFileContent += '* @docs        :: http://sailsjs.org/#!documentation/models\n*/\n\n\n';
  modelFileContent += 'module.exports = {\n\n';
  modelFileContent += '  tableName: \'' + modelname + '\',\n\n';
  modelFileContent += '  attributes: {\n';

  controllerFileContent += '/**\n* ' + filename + '.js\n';
  controllerFileContent += '*\n';
  controllerFileContent += '* @description :: ' + modelname + ' controller imported from ' + mysqlConfig[2] + ' MySql server at ' + now + '.\n';
  controllerFileContent += '* @docs        :: http://sailsjs.org/#!documentation/controllers\n*/\n\n\n';
  controllerFileContent += 'module.exports = {\n\n';

  asyncForEach(tableDetails, function(item, index, next) {
    const name = item.Field;
    const newName = name.toCamelCase();
    let type = item.Type.toLowerCase();
    let size = 0;
    const allowNull = item.Null;
    const Default = item.Default;
    const key = item.Key;
    const extra = item.Extra;

    const matchVarchar = type.match(/varchar\((\d+)\)/i);
    const matchChar = type.match(/char\((\d+)\)/i);
    if (matchVarchar && matchVarchar.length > 1) {
      type = 'string';
      size = matchVarchar[1];
    } else if (matchChar && matchChar.length > 1) {
      type = 'string';
      size = matchChar[1];
    } else if (type.startsWith('bit') || type.startsWith('int') || type.startsWith('tinyint') || type.startsWith('smallint') || type.startsWith('mediumint') || type.startsWith('bigint')) {
      type = 'integer';
    } else if (type.startsWith('float') || type.startsWith('double') || type.startsWith('real') || type.startsWith('decimal')) {
      type = 'float';
    } else if (type === 'time') {
      type = 'time';
    } else if (type === 'date') {
      type = 'date';
    } else if (type === 'datetime' || type === 'timestamp') {
      type = 'datetime';
    } else {
      type = 'text';
    }

    modelFileContent += '    ' + newName + ' : {\n';
    modelFileContent += '      type: \'' + type + '\'';
    if (size > 0) {
      modelFileContent += ',\n      size: ' + size;
    }
    if (key === 'PRI') {
      modelFileContent += ',\n      unique: true';
      modelFileContent += ',\n      primaryKey: true';
    }
    if (allowNull === 'NO' && Default !== null) {
      modelFileContent += ',\n      required: true';
    }
    if (key === 'MUL') {
      modelFileContent += ',\n      index: true';
    }
    if (extra === 'auto_increment') {
      modelFileContent += ',\n      autoIncrement: true';
    }
    if (Default !== '' && Default !== null) {
      if (Default === 'CURRENT_TIMESTAMP') {
        modelFileContent += ',\n      defaultsTo: function() {return new Date();}';
      } else {
        modelFileContent += ',\n      defaultsTo: \'' + Default + '\'';
      }
    }
    if (name !== newName) {
      modelFileContent += ',\n      columnName: \'' + name + '\'';
    }
    modelFileContent += '\n    }';

    if (index < tableDetails.length - 1) {
      modelFileContent += ',\n';
    }


    next();
  }, function() {
    controllerFileContent += '};\n';
    fs.writeFile(controllersPath + filename + 'Controller.js', controllerFileContent, function(err) {
      if (err) {
        console.log(err);
      }
    });

    modelFileContent += '\n  }\n';
    modelFileContent += '};\n';
    fs.writeFile(modelsPath + filename + '.js', modelFileContent, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(modelname + ' has been imported!');
        callback();
      }
    });
  });
}

function dbQuery(_query, callback) {
  let response = [];
  const query = connection.query(_query);
  query.on('error', function(err) {
    console.log(_query);
    throw err;
    //callback (undefined, err);
  }).on('fields', function(fields) {
    // console.log(fields);
  }).on('result', function(row) {
    response.push(row);
  }).on('end', function() {
    callback(response);
  });
}

if (typeof String.prototype.toCamelCase !== 'function') {
  String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|[\s-_](\w)/g, function(match, p1, p2, offset) {
      if (p2) return p2.toUpperCase();
      return p1.toLowerCase();
    });
  };
}

if (typeof String.prototype.capitalize !== 'function') {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
}

if (typeof String.prototype.startsWith !== 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function(str) {
    return this.indexOf(str) === 0;
  };
}

if (typeof String.prototype.asyncForEach !== 'function') {

  Array.prototype.asyncForEach = function(fn, callback) {
    const array = this.slice(0);
    let counter = -1;

    function process() {
      counter++;
      let item = array[counter];
      fn(item, counter, function(result) {
        if (array.length > (counter + 1)) {
          process();
        } else {
          callback();
        }
      });
    }
    if (array.length > (counter + 1)) {
      process();
    } else {
      callback();
    }
  };
}


function tableDetails(tableName, callback) {
  dbQuery('DESCRIBE ' + tableName + ';', function(data, err) {
    if (err) {
      throw err;
    } else {
      callback(data);
    }
  });
}

function listTables(callback) {
  let response = [];
  if (process.argv.length === 3) {
    dbQuery('SHOW TABLES', function(data, err) {
      if (err) {
        throw err;
      } else {
        asyncForEach(data, function(item, index, next) {
          response.push(item.Tables_in_web);
          next();
        }, function() {
          callback(response);
        });
      }
    });
  } else {
    for (let i = 3; i < process.argv.length; i++) {
      response.push(process.argv[i]);
    }
    callback(response);
  }
}

function asyncForEach(array, fn, callback) {
  array = array.slice(0);
  let counter = -1;

  function process() {
    counter++;
    let item = array[counter];
    fn(item, counter, function(result) {
      if (array.length > (counter + 1)) {
        process();
      } else {
        callback();
      }
    });
  }
  if (array.length > (counter + 1)) {
    process();
  } else {
    callback();
  }
}

function showUsage() {
  console.log('\nsailsjs tool to import model from physical database table to JS model file\n\nUsage: node importdb.js USER:PASSWORD@HOST:PORT/DATABASENAME (For import all tables)\n       php importdb.js USER:PASSWORD@HOST:PORT/DATABASENAME tableName1, tableName2 ... (For import selected tables)\n\n');
}
