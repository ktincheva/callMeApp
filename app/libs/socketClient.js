var socket = io.connect(location.protocol + '//' + location.host);
/* 
 * Event handlers (functions) should be defuned into controller 
 * and will be attached to the socket client properties
 * @param {type} params
 * {
                eventHandlers: {property: handler, ....},
                events: {
                    'event receided': {eventHandler: 'hanhler'},
                    .....
                }};
 * @returns {socketClient}
 * 
 */
var socketClient = function (params) {
    /*
     * events emited from socket to application
     */
    var obj = this;
    obj.options = params;
    //var updateTest = function(data){console.log(data)};
    obj.addEventListener = function (event, eventHandler)
    {
        Utils.debug_log(event, "Started adding of event listener ");
        try {
            Utils.debug_log(eventHandler, "event handler added");
            socket.on(event, function (data) {
               Utils.debug_log(eventHandler, "Added event handler");
               Utils.debug_log(event, "On event received");
               Utils.debug_log(data, "Data received");
               obj[eventHandler](data)
            });
        }
        catch (e)
        {
            Utils.debug_log(e, "Add event listener trows an error");
        }

    }

    obj.addEventsListeners = function (eventsObj)
    {
        Utils.debug_log(obj.options, "Add event listeners oprions");
        var events = (eventsObj) ? eventsObj : (obj.options.events) ? obj.options.events : {};
        Utils.debug_log(events, "Add events listeners events: ")
        try {
            if (events)
            {
                Object.keys(events).forEach(function (key)
                {
                    obj.addEventListener(key, events[key].eventHandler);
                });
            }
        }
        catch (e)
        {
            Utils.debug_log(e, "Socket Client trows an error");
        }
    }
    
    obj.addEventsHandlers = function (handlersObj)
    {
        var handlers = (handlersObj) ? handlersObj : (obj.options.eventHandlers) ? obj.options.eventHandlers : {};
        Utils.debug_log(handlers, "Init event handlers");
        for (var prop in handlers) {
            Utils.debug_log(prop, "Add properties to object")
            obj[prop] = handlers[prop];
        }
        Utils.debug_log(obj, "Added event handlers");
    }
    obj.addEventsHandlers()
    obj.addEventsListeners();
   
    return obj;
}
       