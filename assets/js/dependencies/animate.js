'use strict';

$(document).ready(() => {

  /* Homepage Association goals animation */
  $('div[role="section"].association .floatingGoals .goal').each((key, value) => {
    let initialText = $('div[role="section"].association .goalTextZone').text();

    $(value).mouseover(() => {
      $('div[role="section"].association .goalTextZone > span').text($(value).find('.goalText').text());
    });

    $(value).mouseout(() => {
      $('div[role="section"].association .goalTextZone > span').text(initialText);
    });
  });

});
