const express = require("express");
const session = require('express-session');
const app = express();
const port = 10418;

const gsheet = require('./gsheet_connection.js');

let ceremony_state = "idle";
var tassel_list = [];
let tassel_count = 0;

gsheet.getTasselData(tassel => {
    tassel_list = tassel;
    console.log(tassel_list);
})

md5 = require('md5');
const https = require("https");
var fs = require('fs');
var options = {
    key: fs.readFileSync('./private/ssl/server-key.pem'),
    ca: [fs.readFileSync('./private/ssl/cert.pem')],
    cert: fs.readFileSync('./private/ssl/server-cert.pem')
};
const server = https.createServer(options, app);
const io = require("socket.io")(server);

app.use(session({
    secret: "This is key",
    cookie: { "sid": 0 }
}));


/* configs and data read */
const user_table_filename = './data/username.json'
var user_table = loadUsername();
io.sockets.on("error", e => console.log(e));

let broadcaster = {}
let watcher = {}

function loadUsername(){
    let users = JSON.parse(fs.readFileSync(user_table_filename));
    for (const id in users)
        users[id]['status'] = "offline";
    return users;
}

io.sockets.on("connection", socket => {
    //watcher[socket.id] = socket.id;
    if (Object.keys(broadcaster).length > 0){
        for(const id in broadcaster){
            socket.to(id).emit("watcher", socket.id);
        }
    }

    socket.on("set_ceremony_stage", (s)=>{
        ceremony_state = s;
        console.log(`Set ceremony state ${s}`);
        socket.broadcast.emit("set_ceremony_stage", s);
    })
    
    socket.on("broadcaster", (sid) => {
        if (!(socket.id in broadcaster)) {
            broadcaster[socket.id] = sid;
            socket.broadcast.emit("broadcaster", socket.id);
            console.log(`Get broadcaster request: ${socket.id} from ${user_table[sid]}`);
        }
        else
            console.log("Duplicated broadcaster");
    });

    // from watcher to broadcaster
    socket.on("watcher", (broad_id) => {
        // watcher[socket.id] = socket.id;
        socket.to(broad_id).emit("watcher", socket.id);
        console.log(`Get watcher request: ${socket.id}`);
    });
    socket.on("disconnect", () => {
        if (Object.keys(broadcaster).length <= 0){
            console.log("Disconnect to all");
            for (const [key, value] of Object.entries(broadcaster)) {
                socket.to(key).emit("disconnectPeer", socket.id, "broadcaster");
            }
        }
    });
    socket.on("terminate_broadcasting", ()=>{
        delete broadcaster[socket.id];
        socket.broadcast.emit("disconnectPeer", socket.id, "watcher");
    })
    // broadcaster to watcher
    socket.on("offer", (watcher_id, message, sid) => {
        socket.to(watcher_id).emit("offer", socket.id, message, sid);
    });

    // Message transfer
    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message, target) => {
        socket.to(id).emit("candidate", socket.id, message, target);
    });

    /*socket.on("request_tassel_list", ()=>{
        socket.emit("update_tassel_list", tassel_list);
    });*/
    
    socket.broadcast.emit("update_user_table", user_table)
    //socket.emit("update_tassel_list", tassel_list);
    socket.on('set-tassel', (count)=>{
        tassel_count = count;
        socket.broadcast.emit('update_tassel_list', tassel_count);
    })

    socket.on('close', ()=>{
        req.session.destroy((err) => {
            console.log(err)
        })
        socket.broadcast.emit("update_user_table", user_table)
    })

    socket.on('control-tassel', (data)=>{
        socket.broadcast.emit('control-tassel', data);
    })
});
/*
app.get("/user_table", (req, res) => {
    res.send(user_table);
})*/

app.get("/initialization", (req, res)=>{
    res.send({
        'ceremony_state': ceremony_state,
        'id': req.session.name,
        'user_table': user_table,
        'tassel_count': tassel_count,
        'tassel_list': tassel_list,
        'tassel_essay': ""
    })
})

app.get("/", (req, res)=>{
    res.redirect('content.html');
})
app.get("/content.html", (req, res, next)=>{
    if (req.session.name === undefined)
        res.redirect('/home.html')
    else
        next();
})
app.use(express.static(__dirname + "/public"));


app.get("/logout", (req, res) => {
    if (req.session.name !== undefined) {
        user_table[req.session.name]["state"] = "offline";
        req.session.destroy((err) => {
            console.log(err)
        })
    }
    res.redirect('/home.html');
})

app.get("/login", (req, res) => {
    var name = ""
    if (req.query.role === "teachers" && req.query.teacher != ""){
        if (req.query['teacher-passwd'] == req.query.teacher)
            name = req.query.teacher;
        else{
            res.send("Wrong password");
            return;
        }
    }
    else if (req.query.role === "students" && req.query.student != ""){
        console.log(req.query.student)
        console.log(req.query.student)
        if (req.query['passwd'] == req.query.student)
            name = req.query.student;
        else{
            res.send("Wrong password");
            return;
        }
    }
    else {
        res.send("failed to login");
        return;
    }
    req.session.name = name;
    console.log(name);
    if (user_table[name] !== undefined) {
        user_table[name]["state"] = "online";
        //res.redirect('/content.html');
        res.send('ok')
    }
    else
        res.send("failed to lookup");

})

server.listen(port, () => console.log(`Server is running on port ${port}`));
