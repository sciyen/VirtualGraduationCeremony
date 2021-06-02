const broadcastConns = {};  // broadcaster to watchers
const watchConns = {};  // watcher to broadcasters
let broadcasting = false;
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};

function close_all_peer_connection(){
    terminate_broadcasting();
    for (const id in watchConns){
        watchConns[value].close();
    }
    watchConns = {}
}

function terminate_broadcasting(){
    if (broadcasting){
        for (const id in broadcastConns){
            broadcastConns[id].close();
            delete broadcastConns[id];
        }
        socket.emit("terminate_broadcasting");
    }
}

function start_broadcasting(){
    broadcasting = true;
    socket.emit("broadcaster", self_id);
}

function init(socket, self_id, offer_callback) {
    // broadcaster receive from watcher
    socket.on("watcher", id => {
        // We create a new RTCPeerConnection every time a new client joins and save it in our broadcastConns object.
        const peerConnection = new RTCPeerConnection(config);
        broadcastConns[id] = peerConnection;

        let stream = video.srcObject;
        // Then we add the local stream to the connection using the addTrack() method and passing our stream and track data.
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // The peerConnection.onicecandidate event is called when we receive an ICE candidate, and we send it to our server.
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit("candidate", id, event.candidate, 'watcher');
            }
        };

        //we send a connection offer to the client by calling peerConnection.createOffer() and we call peerConnection.setLocalDescription() to configure the connection.
        peerConnection
            .createOffer()
            .then(sdp => peerConnection.setLocalDescription(sdp))
            .then(() => {
                socket.emit("offer", id, peerConnection.localDescription, self_id);
            });
    });

    // watcher receive from broadcaster
    socket.on("offer", (id, description, sid) => {
        // We can then create our RTCPeerConnection and get the video stream from the broadcaster.
        watchConns[id] = new RTCPeerConnection(config);
        watchConns[id]
            .setRemoteDescription(description)
            // Here we create a new RTCPeerConnection using our configuration object as we did above. The only difference is that we call the createAnswer() function to send back a connection answer to the request of the broadcaster.
            .then(() => watchConns[id].createAnswer())
            .then(sdp => watchConns[id].setLocalDescription(sdp))
            .then(() => {
                socket.emit("answer", id, watchConns[id].localDescription);
                console.log("Answer from watcher");
            });
        // After the connection is established we can continue by getting the video stream using the ontrack event listener of the peerConnection object.
        watchConns[id].ontrack = event => {
            offer_callback(sid, event.streams[0])
        };
        watchConns[id].onicecandidate = event => {
            if (event.candidate) {
                socket.emit("candidate", id, event.candidate, 'broadcaster');
            }
        };
    });

    // watcher received from broadcaster
    socket.on("answer", (id, description) => {
        broadcastConns[id].setRemoteDescription(description);
    });

    socket.on("candidate", (id, candidate, target) => {
        // broadcaster received from watcher
        if (target == 'broadcaster')
            broadcastConns[id].addIceCandidate(new RTCIceCandidate(candidate));
        // watcher received from broadcaster
        else if (target == 'watcher')
            watchConns[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    // watcher recieve from broadcaster broadcasted from server
    socket.on("broadcaster", (broad_id) => {
        socket.emit("watcher", broad_id);
    });

    // terminate request from broadcaster
    socket.on("disconnectPeer", (id, who) => {
        if (who == "watcher"){
            watchConns[id].close();
            delete watchConns[id];
        }
        else if (who == "broadcaster"){
            broadcastConns[id].close();
            delete broadcastConns[id];
        }
    });
}
