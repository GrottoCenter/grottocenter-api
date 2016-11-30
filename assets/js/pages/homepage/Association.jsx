const Association = () => (
      <div>
        <div role="section" style={{'minHeight': '500px', 'background': 'linear-gradient(to top, rgb(251, 251, 222) 0%, rgb(255, 223, 174) 100%)'}}>
          <div className="container-fluid">
            <div className="row" style={{'width': '80%', 'margin': 'auto'}}>
              <div style={{'text-align': 'left', 'padding-top': '20px'}} className="col-xs-6">
                <h3 style={{'font-size': '35px', 'padding-bottom': '30px'}}>L'association Wikicaves</h3>
                <h5 style={{'font-size': '18px', 'padding-bottom': '30px'}}>Le site www.grottocenter.org est une base de donnée mondiale, communautaire dédiée à la spéléologie et alimentée par les spéléologues sur le principe du Wiki. Toute cavité naturelle présentant un intérêt à tes yeux peut y être enregistrée !</h5  >
                <p>Le site est édité par l'association Wikicaves qui s'est fixée comme objectif de :
                  <ul>
                    <li>Favoriser le développement de la spéléologie dans le monde, notamment par l'Internet collaboratif.</li>
                    <li>Diffuser et partager les informations liées à la pratique de la spéléologie.</li>
                    <li>Faciliter l'accès aux informations concernant les cavités naturelles, notamment via Internet.</li>
                    <li>Mettre en valeur et contribuer à la protection des cavités naturelles et de leur environnement.</li>
                    <li>Aider l'exploration et l'étude scientifique des cavités naturelles.</li>
                  </ul>
                </p>
              </div>
              <div style={{'text-align': 'center', 'padding-top': '20px'}} className="col-xs-6">
                <img style={{'width': '100%', 'max-width': '500px'}} src="/images/homepage/montain.png"/>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  export default Association;
