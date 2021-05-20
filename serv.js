const express = require("express");
const app = express();

const port = 10418;

const https = require("https");
var fs = require('fs');
var options = {
    key: fs.readFileSync('./ssl/server-key.pem'),
    ca: [fs.readFileSync('./ssl/cert.pem')],
    cert: fs.readFileSync('./ssl/server-cert.pem')
};
const server = https.createServer(options, app);
const io = require("socket.io")(server);

app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));

let broadcaster = {}
let watcher = {}

io.sockets.on("connection", socket => {
    socket.on("broadcaster", () => {
        if (!(socket.id in broadcaster)) {
            broadcaster[socket.id] = socket.id;
            socket.broadcast.emit("broadcaster");
            console.log(`Get broadcaster request: ${socket.id}`);
        }
        else
            console.log("Duplicated broadcaster");
    });
    socket.on("watcher", () => {
        watcher[socket.id] = socket.id;
        for (const [key, value] of Object.entries(broadcaster)) {
            socket.to(value).emit("watcher", socket.id);
        }
        console.log(`Get watcher request: ${socket.id}`);
    });
    socket.on("disconnect", () => {
        for (const [key, value] of Object.entries(broadcaster)) {
            socket.to(value).emit("disconnectPeer", socket.id);
        }
    });
    socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
    });

    // Message transfer
    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message, target) => {
        socket.to(id).emit("candidate", socket.id, message, target);
    });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
