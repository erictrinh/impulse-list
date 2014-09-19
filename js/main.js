var Impulse = require('impulse');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var move = function(impulseElem, offset) {
  impulseElem.spring({ tension: 100, damping: 10 })
    .to(0, offset).start();
};

var springAtEnd = function(dragObj, impulseElem, offset) {
  dragObj.on('end', function() {
    impulseElem.spring({ tension: 100, damping: 10 })
      .to(0, offset).start();
  });
};

var vent = new EventEmitter();

var activeIndex;

var items = document.getElementsByClassName('list-item');

var drags = [];

var rects = [];

var draggables = [].map.call(items, function(elem, index, arr) {
  var origRect = elem.getBoundingClientRect(),
    rect = _.pick(origRect, ['height', 'width', 'left', 'bottom', 'right', 'top']);

  rect = _.extend(rect, { id: index });

  rects.push(rect);

  var draggable = Impulse(elem)
    .style('translate', function(x, y) {
      return x + 'px, ' + y + 'px';
    });

  var dragObj = draggable.drag();

  drags[index] = dragObj;

  dragObj
    .on('move', function(e) {
      vent.emit('move', index, e.y);
    })
    .on('start', function() {
      activeIndex = index;
    })
    .on('end', function() {
      draggable.spring({ tension: 120, damping: 10 }).to(0, 0).start();
    });

  return draggable;
});



vent.on('move', function(indexOfMover, y) {
  // modify rects to represent where we want to go

  var index;

  if (y < rects[0].top) {
    index = 0;
  } else if (y > rects[rects.length - 1].bottom) {
    index = rects.length - 1;
  } else {
    index = _.findIndex(rects, function(rect) {
      return rect.top < y && rect.bottom > y;
    });
  }

  if (index < 0) {
    return;
  }

  // console.log(index);

  var mover = rects[indexOfMover];
  // deep clone
  var newRects = _.clone(rects, true);
  // remove the mover
  newRects.splice(indexOfMover, 1);
  // insert the mover after the intersecting index
  newRects.splice(index, 0, mover);


  // re-calculate positions of all rects

  var bottom = 0;
  newRects = newRects.map(function(rect, index, arr) {
    var top = index === 0 ? rects[0].top : bottom;

    bottom = top + rect.height;

    return _.extend(_.clone(rect), {
      top: top,
      bottom: bottom
    });
  });


  // now go and render
  newRects.forEach(function(rect) {
    var origIndex = rect.id,
      offset = rect.top - rects[rect.id].top;

    // console.log(origIndex, offset);

    // attach on end handler
    if (origIndex === activeIndex) {
      springAtEnd(drags[origIndex], draggables[origIndex], offset);

    // slide toward offset
    } else {
      move(draggables[origIndex], offset);
    }
  });


});

