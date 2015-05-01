var express = require('express'),
    router = express.Router(),
    uuid = require('node-uuid'),
    sockets = require('../sockets'),
    usersDb = {
        'nestor.urquiza@gmail.com': {
            name: 'Nestor',
            lastName: 'Urquiza',
            password: 'nestor',
            roles: ['director', 'human_resources'],
            image: '/images/nestor.jpg'
        },
        'damianbh@gmail.com': {
            name: 'Damian',
            lastName: 'Bergantinos',
            password: 'damianbh',
            roles: ['human_resources', 'manager'],
            image: '/images/damian.jpg'
        },
        'alejandro@gmail.com': {
            name: 'Alejandro',
            lastName: 'Gonzalez',
            password: 'alejandro',
            roles: ['director', 'manager'],
            image: '/images/alejandro.jpg'
        }
    },
    sessions = {};

function logout(session) {
    delete sessions[session];
}

function login(userName, password) {
    var
        user = userName && usersDb[userName];

    if (user && (password === user.password)) {
        var
            session = uuid.v4();
        sessions[session] = userName;
        return session;
    }
    return false;
}


function getUser(userName) {
    return userName && usersDb[userName];
}

function isLoggedIn(session) {
    return session && sessions[session];
}

router.get(["/", "/login"], function (req, res) {
    //var gateway = req.query.gateway == true || req.query.gateway == '1';
    //var tgc = req.signedCookies.tgc;
    //var tgcError = undefined;
    //if (tgc != undefined) {
    //  tgcError = cas.validateTicketGrantingTicket(tgc);
    //}
    //cas.validateTicketGrantingTicket();
    res.render('index', {service: req.query.service});
});

// POST /login
// @desc: 2.2
router.post("/login", function (req, res) {
    var
        session = login(req.body.name, req.body.password),
        cookieSession = req.cookies.session;

    if (session) {
        if (req.cookies.ticket && isLoggedIn(req.cookies.ticket)) {
            logout(req.cookies.ticket);
        }
        var
            user = getUser(req.body.name),
            userRoles = user && (user.roles || []);

        res.cookie('ticket', session);
        if (req.body.ajaxCall === '1') {
            res.send({
                ticket: session,
                user: req.body.name,
                roles: userRoles,
                image: user.image,
                name: user.name,
                lastName: user.lastName,
                session: cookieSession
            });
        } else {
            sockets.emit2Session(cookieSession, 'login');
            res.redirect(req.body.service);
        }

    } else {
        if (req.body.ajaxCall === '1') {
            res.status(400).send({
                success: false
            });
        } else {
            res.render('index', {service: req.body.service, error: true});
        }
    }
});

// GET /validate
// @desc: 2.4, 2.4.1
router.get("/validate", function (req, res) {
    var
        ticket = req.cookies.ticket || req.query.ticket,
        cookieSession = req.cookies.session,
        userName = isLoggedIn(ticket);

    if (!cookieSession) {
        cookieSession = uuid.v4();
        res.cookie('session', cookieSession);
    }
    if (userName) {
        var
            user = getUser(userName),
            userRoles = user && (user.roles || []);

        res.send({
            ticket: ticket,
            session: cookieSession,
            user: userName,
            roles: userRoles,
            image: user.image,
            name: user.name,
            lastName: user.lastName
        });
    } else {
        res.status(401).send({
                code: 'NO_SESSION',
                message: 'Unauthorized',
                session: cookieSession
            }
        );
    }
});

router.get("/logout", function (req, res) {
    var
        ticket = req.cookies.ticket || req.query.ticket;

    if (ticket && isLoggedIn(ticket)) {
        logout(ticket);
        res.clearCookie('ticket');
        res.status(204).send('');
    } else {
        res.status(200).send('Not Logged In')
    }
});

router.get("/info", function (req, res) {
    res.send({
        sessions: sessions,
        sockets: sockets.getHashSockets()
    });

});


module.exports = router;
