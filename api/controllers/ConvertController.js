'use strict';
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

  convert: function (req, res) {
    ConvertService.findAllProj().then(function(results) {
      if (!results) {
        return res.notFound('No proj found.');
      }

      var reponse = results.rows;
      for (var i = 0; i < reponse.length; i++) {

        if (!reponse[i].Fr_name) {
          reponse[i].Fr_name = 'World';
        }

        //recuperation du nom
        var words = reponse[i].Definition.split('+title=');
        reponse[i].title = words[1].split('+', 1)[0];

        //recuperation de l'unité
        reponse[i].units = 'degrees';
        var words2 = reponse[i].Definition.split(' ');
        for (var j = 0; j < words2.length; j++) {
          if (words2[j].startsWith('+units')) {
            reponse[i].units = words2[j].split('=')[1];
          }
          if (words2[j].startsWith('+proj')) {
            reponse[i].proj = words2[j].split('=')[1];
          }

        }
        if (reponse[i].proj == 'utm') {
          sails.log.debug(reponse[i].Definition);
        }

      }


      return res.json(reponse);
    }, function(err) {
      sails.log.error(err);
      return res.serverError('ConvertController.findAllProjs error : ' + err);
    });
  }
}

