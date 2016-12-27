import React from 'react';

const Welcome = () => (
  <div>
    <div role="section" className="bgGradent welcome">
      <div className="container">
        <div className="row">
          <div className="four columns">
            <h3>Bienvenue sur Grottocenter !</h3>
          </div>
          <div className="eight columns">
            <p>Cette version 3.1 du site s’enrichit progressivement pour vous permettre une navigation plus simple depuis tous vos périphériques.</p>
            <p>Plus rapide, l’application bénéficie d’un code de grande qualité, facile à maintenir : tout informaticien peut rejoindre l’équipe de développement et contribuer sans difficulté.</p>
            <p>Dès aujourd’hui vous pouvez profiter d’informations actualisées sur la spéléologie, du module de recherche rapide et efficace, des informations sur les cavités disposant d’un contenu de qualité.</p>
            <p>Revenez régulièrement pour découvrir de nouvelles fonctionnalités et continuez à utiliser <a href="http://www.grottocenter.og">Grottocenter</a> pour apporter vos contributions et consulter celles de vos pairs.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Welcome;
