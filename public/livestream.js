const broadcastConns = {};  // broadcaster to watchers
const watchConns = {};  // watcher to broadcasters
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};

const video_container = [];
const max_video = 3;
let user_count = 0;

function close_peer_connection(){
    for (const [key, value] of Object.entries(watchConns)){
        watchConns[value].close();
    }
}

function init(socket) {
    for (var i = 0; i < max_video; i++) {
        video_container.push(document.querySelector("video#v"+i));
    }

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
                socket.emit("offer", id, peerConnection.localDescription);
            });
    });

    // watcher receive from broadcaster
    socket.on("offer", (id, description) => {
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
            if (user_count < max_video) {
                video_container[user_count].srcObject = event.streams[0];
                console.log("Attached to " + user_count)
                user_count++;
            }
            else
                console.log("Container full");
        };
        watchConns[id].onicecandidate = event => {
            if (event.candidate) {
                socket.emit("candidate", id, event.candidate, 'broadcaster');
            }
        };
    });

    socket.on("answer", (id, description) => {
        broadcastConns[id].setRemoteDescription(description);
    });

    socket.on("candidate", (id, candidate, target) => {
        if (target == 'broadcaster')
            broadcastConns[id].addIceCandidate(new RTCIceCandidate(candidate));
        else if (target == 'watcher')
            watchConns[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("connect", () => {
        socket.emit("watcher");
    });

    socket.on("broadcaster", () => {
        socket.emit("watcher");
    });

    socket.on("disconnectPeer", id => {
        broadcastConns[id].close();
        delete broadcastConns[id];
    });
}
