'use strict';

module.exports = {

  convert: function (req, res) {

    var request = require('request');

    var x = req.param('x');
    var y = req.param('y');
    var output = req.param('out');
    var input = req.param('in');



    request.get({
      url: `http://twcc.fr/en/ws/?fmt=json&x=${x}&y=${y}&in=${input}&out=${output}`
    }, function (error, response, body) {
      if (error) {
        sails.log.error(error);
      } else {
        return res.json(JSON.parse(body));
      }
    });
  }
};
