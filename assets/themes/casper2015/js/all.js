(function() {
  $(function() {
    var $win, activeNavContent, fnNavTab, headerHeigth, navHeight;

    headerHeigth = $('.header').height();
    navHeight = $('.navigation').height();
    $win = $(window).scroll(function() {
      if ($win.scrollTop() > (headerHeigth - navHeight)) {
        return $('.navigation').addClass('small');
      } else {
        return $('.navigation').removeClass('small');
      }
    });
    $('.main-menu-btn').on('click', function() {
      return $('.main-menu').toggleClass('menu-show');
    });
    $('.nav-tab .container').append('<div class="nav-slider"></div>');
    fnNavTab = function() {
      var boxPos, pos, w;

      if ($('.nav-tab').length > 0) {
        boxPos = $('.nav-tab .container').offset().left;
        pos = $('.nav-tab li.selected').offset().left;
        w = $('.nav-tab li.selected').outerWidth();
        return $('.nav-tab .nav-slider').css({
          'left': pos - boxPos,
          'width': w
        });
      }
    };
    activeNavContent = function(a) {
      var tar;

      tar = a.attr('href');
      console.log(tar);
      return $(tar).addClass('active').delay(150).queue(function() {
        return $(this).addClass('in').dequeue();
      }).siblings('.tab-pane').removeClass('active in');
    };
    fnNavTab();
    $('.nav-tab a').on('click', function(e) {
      e.preventDefault();
      $(this).parents('li').addClass('selected').siblings('li').removeClass('selected');
      fnNavTab();
      return activeNavContent($(this));
    });
    return $(window).resize(function() {
      return fnNavTab();
    });
  });

}).call(this);
