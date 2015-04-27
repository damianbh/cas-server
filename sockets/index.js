/**
 * Created by damian on 4/26/2015.
 */
var
    _ = require('underscore'),
    hashClients = {};

module.exports = {
    init: function (server) {
        var io = require('socket.io')(server);

        io.on('connection', function (socket) {
            //socket.emit('news', {hello: 'world'});
            socket.on('new_connection', function (data) {
                var
                    arr = hashClients[data.session] = _.isArray(hashClients[data.session]) ? hashClients[data.session] : [];

                if (arr.indexOf(socket) === -1) {
                    arr.push(socket);
                }
            });
            socket.on('login', function (data) {
                module.exports.emit2Session(data.session, 'login', socket);
            });
            socket.on('logout', function (data) {
                module.exports.emit2Session(data.session, 'logout', socket);
            });
            socket.on('disconnect', function () {
                _.each(_.keys(hashClients), function (session) {
                    if (_.isArray(hashClients[session])) {
                        hashClients[session] = _.without(hashClients[session], socket);
                        if (hashClients[session].length === 0) {
                            delete hashClients[session];
                        }
                    } else {
                        delete hashClients[session];
                    }

                });
            });

        });

    },
    emit2Session: function (session, event, socket, data) {
        var
            arr = hashClients[session] || [];

        if (socket) {
            arr = _.without(arr, socket);
        }
        _.each(arr, function (socket) {
            socket.emit(event, data);
        });
    },
    getHashSockets: function () {
        var
            result = {};
        _.each(_.keys(hashClients), function (key) {
            result[key] = [];
            _.each(hashClients[key], function (socket) {
                result[key].push(socket.id);
            });
        });
        return result;
    }
};