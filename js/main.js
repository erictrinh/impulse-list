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
  var height = elem.offsetHeight,
    origRect = elem.getBoundingClientRect(),
    rect = _.pick(origRect, ['height', 'width', 'left', 'bottom', 'right', 'top']);

  rects.push(rect);

  var draggable = Impulse(elem)
    .style('translate', function(x, y) {
      return x + 'px, ' + y + 'px';
    });

  // index of the thing that's moving and y coordinate
  vent.on('move', function(indexOfMover, y) {
    if (indexOfMover === index) {
      return;
    }

    if (y > (rect.top + rect.height/2)) {

      if (indexOfMover < index) {
        move(draggable, -rects[activeIndex].height);
        rect = _.extend(rect, {
          top: origRect.top - rects[activeIndex].height,
          bottom: origRect.bottom - rects[activeIndex].height
        });
      } else {
        move(draggable, 0);
        rect = _.extend(rect, {
          top: origRect.top + rects[activeIndex].height,
          bottom: origRect.bottom + rects[activeIndex].height
        });
      }

    } else if (y < (rect.top + rect.height/2)) {

      if (indexOfMover < index) {
        move(draggable, 0);
        rect = _.extend(rect, {
          top: origRect.top - rects[activeIndex].height,
          bottom: origRect.bottom - rects[activeIndex].height
        });
      } else {
        move(draggable, rects[activeIndex].height);
        rect = _.extend(rect, {
          top: origRect.top + rects[activeIndex].height,
          bottom: origRect.bottom + rects[activeIndex].height
        });
      }

    }
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
