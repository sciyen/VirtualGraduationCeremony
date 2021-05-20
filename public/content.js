const socket = io.connect(window.location.origin);
const video = document.querySelector("video#cam");

// Media contrains
const constraints = {
    video: { facingMode: "user" }
    // Uncomment to enable audio
    // audio: true,
};

navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
        video.srcObject = stream;
        socket.emit("broadcaster");
    })
    .catch(error => console.error(error));

init(socket)

window.onunload = window.onbeforeunload = () => {
    socket.close();
    close_peer_connection();
}
