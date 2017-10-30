'use strict';

$(document).ready(function() {

  /* Homepage Association goals animation */
  $('.animFG').each(function(key, value) {
    var initialText = $('.animFGTarget').text();

    $(value).mouseover(function() {
      $('.animFGTarget').text($(value).find('.animFGSource').text());
    });

    $(value).mouseout(function() {
      $('.animFGTarget').text(initialText);
    });
  });

  /* Homepage FAQ collapsible */
  $('#collapsibleFaq').accordion({
    collapsible: true
  });

  /* Footer position */
  // function fixLegalFooterPosition() {
  //   if ($("footer").height() + $("#applicationpage").height() + $("header").height() < window.innerHeight) {
  //      $("footer").addClass('fixFooter');
  //   } else {
  //      $("footer").removeClass('fixFooter');
  //   }
  // }
  //
  // $("#applicationpage").bind('DOMSubtreeModified', function() {
  //   fixLegalFooterPosition();
  // });
  //
  // $(window).resize(function() {
  //   fixLegalFooterPosition();
  // });
  //
  // fixLegalFooterPosition();
});
