/**
 */

module.exports = {
  /*
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
*/

  convert: (req, res) => {
    ConvertService.findAllProj().then(
      (results) => {
        if (!results) {
          return res.notFound();
        }

        const response = results.rows;
        for (let i = 0; i < response.length; i += 1) {
          if (!response[i].Fr_name) {
            response[i].Fr_name = 'World';
          }

          // recuperation du nom
          const words = response[i].Definition.split('+title=');
          response[i].title = words[1].split('+', 1)[0];

          // recuperation de l'unité
          response[i].units = 'degrees';
          const words2 = response[i].Definition.split(' ');
          for (let j = 0; j < words2.length; j += 1) {
            if (words2[j].startsWith('+units')) {
              response[i].units = words2[j].split('=')[1];
            }
            if (words2[j].startsWith('+proj')) {
              response[i].proj = words2[j].split('=')[1];
            }
          }
          if (response[i].proj === 'utm') {
            sails.log.debug(response[i].Definition);
          }
        }

        return res.json(response);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(`ConvertController.findAllProjs error : ${err}`);
      },
    );
  },
};
