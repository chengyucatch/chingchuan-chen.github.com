(function() {
  $(function() {
    var baseHue, hslValue, path, polygon, redraw, svg, svgResize, svgSize, touchEvent, vertices, voronoi;

    svgSize = {
      w: $(window).width(),
      h: $('.header').outerHeight()
    };
    hslValue = 0.5;
    baseHue = Math.floor(Math.random() * 360);
    d3.select('.navigation').style('background', 'hsla(' + baseHue + ',45%,45%,.95)');
    vertices = d3.range(100).map(function(d) {
      return [Math.random() * svgSize.w, Math.random() * svgSize.h];
    });
    voronoi = d3.geom.voronoi().clipExtent([[0, 0], [svgSize.w, svgSize.h]]);
    touchEvent = function(e) {
      d3.event.preventDefault();
      console.log(e);
      return d3.select(d3.event.target).on('touchmove', function() {
        vertices[0] = d3.mouse(this);
        redraw();
        return console.log(vertices[0], d3.mouse(this));
      });
    };
    svg = d3.select('.banner').append('svg').attr('width', svgSize.w).attr('height', svgSize.h).on('mousemove', function() {
      vertices[0] = d3.mouse(this);
      return redraw();
    });
    path = svg.append('g').selectAll('path');
    svg.selectAll('circle').data(vertices).enter().append('circle').attr('transform', function(d) {
      return 'translate(' + d + ')';
    });
    polygon = function(d) {
      return "M" + d.join("L") + "Z";
    };
    redraw = function() {
      path = path.data(voronoi(vertices), polygon);
      path.enter().append('path').attr('d', polygon).style('fill', function(d, i) {
        return d3.hsl(baseHue + i * hslValue % 360, .45, .45);
      });
      path.exit().remove();
      return path.order();
    };
    redraw();
    svgResize = function() {
      svgSize = {
        w: $(window).width(),
        h: $('.header').outerHeight()
      };
      vertices = d3.range(100).map(function(d) {
        return [Math.random() * svgSize.w, Math.random() * svgSize.h];
      });
      svg.transition().attr('width', svgSize.w);
      voronoi = d3.geom.voronoi().clipExtent([[0, 0], [svgSize.w, svgSize.h]]);
      return redraw();
    };
    $(window).resize(function() {
      if (this.resizeTo) {
        clearTimeout(this.resizeTo);
      }
      return this.resizeTo = setTimeout(function() {
        return $(this).trigger('resizeEnd');
      }, 500);
    });
    return $(window).bind('resizeEnd', function() {
      if ($(window).width() !== svgSize.w) {
        return svgResize();
      }
    });
  });

}).call(this);
