// 
// Adapted from: http://ross.posterous.com/2008/08/19/iphone-touch-events-in-javascript/
// 
// References:
// 
//   http://popdevelop.com/2010/08/touching-the-web/
//   http://www.html5rocks.com/en/mobile/touch.html
//   http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
//   http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/
// 

function touchHandler(event)
 {
    var touches = event.changedTouches,
    first = touches[0],
    type = "";
    switch (event.type)
    {
    case "touchstart":
        type = "mousedown";
        break;
    case "touchmove":
        type = "mousemove";
        break;
    case "touchend":
        type = "mouseup";
        break;
    default:
        return;
    }

    //initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //           screenX, screenY, clientX, clientY, ctrlKey,
    //           altKey, shiftKey, metaKey, button, relatedTarget);
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
    first.screenX, first.screenY,
    first.clientX, first.clientY, false,
    false, false, false, 0
    /*left*/
    , null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function initTouchHandler(element)
 {
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);
}
