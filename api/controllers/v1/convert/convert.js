const ConvertService = require('../../../services/ConvertService');

module.exports = (req, res) => {
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
        const words = response[i].definition.split('+title=');
        response[i].title = words[1].split('+', 1)[0];

        // recuperation de l'unité
        response[i].units = 'degrees';
        const words2 = response[i].definition.split(' ');
        for (let j = 0; j < words2.length; j += 1) {
          if (words2[j].startsWith('+units')) {
            response[i].units = words2[j].split('=')[1];
          }
          if (words2[j].startsWith('+proj')) {
            response[i].proj = words2[j].split('=')[1];
          }
        }
      }

      return res.json(response);
    },
    (err) => res.serverError(`ConvertController.findAllProjs error : ${err}`)
  );
};
