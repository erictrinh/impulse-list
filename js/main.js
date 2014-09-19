var Impulse = require('impulse');
var _ = require('lodash');
var EventEmitter = require("events").EventEmitter;

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

// take current x, y and figure out where to move surrounding elems
var coordinator = function(x, y) {
  var itemIndex = _.findIndex(rects, function(item) {
    return y > item.top && y < item.bottom;
  });
  if (itemIndex >= 0 && itemIndex !== activeIndex) {
    var newOffset;

    // element moving downwards
    if (itemIndex > activeIndex) {
      // bottom half of element
      if (y > rects[itemIndex].top + rects[itemIndex].height/2) {
        // move up
        move(draggables[itemIndex], -rects[itemIndex].height);

        newOffset = rects.slice(activeIndex, itemIndex).reduce(function(prev, curr) {
          return prev + curr.height;
        }, 0);
        springAtEnd(drags[activeIndex], draggables[activeIndex], newOffset);
      } else {
        // return to origin
        move(draggables[itemIndex], 0);
      }

    // element is moving upwards
    } else {

      // top half of element
      if (y < rects[itemIndex].top + rects[itemIndex].height/2) {
        // move down
        move(draggables[itemIndex], rects[itemIndex].height);

        newOffset = -rects.slice(0, activeIndex).reduce(function(prev, curr) {
          return prev + curr.height;
        }, 0);
        springAtEnd(drags[activeIndex], draggables[activeIndex], newOffset);
      } else {
        // return to origin
        move(draggables[itemIndex], 0);
      }
    }
  }
};

var activeIndex;

var items = document.getElementsByClassName('list-item');

var rects = [];

var drags = [];

var draggables = [].map.call(items, function(elem, index, arr) {
  var height = elem.offsetHeight;

  rects.push(elem.getBoundingClientRect());

  var draggable = Impulse(elem)
    .style('translate', function(x, y) {
      return x + 'px, ' + y + 'px';
    });

  var dragObj = draggable.drag();

  drags[index] = dragObj;

  dragObj
    .on('move', function(e) {
      coordinator(e.x, e.y);
    })
    .on('start', function() {
      activeIndex = index;
    })
    .on('end', function() {
      draggable.spring({ tension: 120, damping: 10 }).to(0, 0).start();
    });

  return draggable;
});
