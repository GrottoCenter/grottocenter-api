'use strict';

$(document).ready(function() {

  /* Homepage Association goals animation */
  $('div[role="section"].association .floatingGoals .goal').each(function(key, value) {
    var initialText = $('div[role="section"].association .goalTextZone').text();

    $(value).mouseover(function() {
      $('div[role="section"].association .goalTextZone > span').text($(value).find('.goalText').text());
    });

    $(value).mouseout(function() {
      $('div[role="section"].association .goalTextZone > span').text(initialText);
    });
  });
});
