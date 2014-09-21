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

var items = document.getElementsByClassName('item');

var drags = [];

var rects = [];

var draggables = [].map.call(items, function(elem, index, arr) {
  var origRect = elem.getBoundingClientRect(),
    styles = elem.currentStyle || window.getComputedStyle(elem),
    margins = {
      marginTop: parseInt(styles.marginTop),
      marginBottom: parseInt(styles.marginBottom)
    };

    rect = _.extend(_.pick(origRect, ['height', 'bottom', 'top']), margins, { id: index });

  rects.push(rect);

  var draggable = Impulse(elem)
    .style('translate', function(x, y) {
      return x + 'px, ' + y + 'px';
    });

  var dragObj = draggable.drag({ handle: elem.children });

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

vent.on('move', function(originalIndexOfMover, y) {
  // modify rects to represent where we want to go

  var index = findInsertionIndex(y);

  if (index < 0) {
    return;
  }

  var currIndex = _.findIndex(rects, { id: originalIndexOfMover });

  // don't do any rendering if rect is where it should be
  if (currIndex === index) {
    return;
  }

  var newRects = reArrange(rects, currIndex, index);

  // re-calculate positions of all rects

  newRects = reCalcRects(newRects, rects);


  // now go and render
  newRects.forEach(function(rect) {
    var origIndex = rect.id,
      offset = rect.top - rects[rect.id].top;

    // attach on end handler
    if (origIndex === activeIndex) {
      springAtEnd(drags[origIndex], draggables[origIndex], offset);

    // slide toward offset
    } else {
      move(draggables[origIndex], offset);
    }
  });

  // newRects might be null if we returned early during move step
  rects = newRects || rects;


});

function reCalcRects(rects, origRects) {
  var bottom = 0;
  var marginBottom = 0;

  return rects.map(function(rect, index, arr) {
    var top = index === 0 ? origRects[0].top : (bottom + Math.max(rect.marginTop, marginBottom));

    bottom = top + rect.height;
    marginBottom = rect.marginBottom;

    return _.extend(_.clone(rect), {
      top: top,
      bottom: bottom
    });
  });
}


function findInsertionIndex(y) {
  if (y < rects[0].top) {
    return 0;
  } else if (y > rects[rects.length - 1].bottom) {
    return rects.length - 1;
  } else {
    return _.findIndex(rects, function(r) {
      return r.top < y && r.bottom > y;
    });
  }
}

// moves the position of an element at indexA to indexB
// other elements in the array stay in the same relative order
// returns new array
function reArrange(arr, indexA, indexB) {
  // deep clone
  var newArr = _.clone(arr, true);

  var elem = newArr.splice(indexA, 1)[0];
  newArr.splice(indexB, 0, elem);

  return newArr;
}
