const socket = io.connect(window.location.origin);
const video = document.querySelector("video#cam-self");

let self_id = ""
let user_table = {}
let tassel_list = []

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
        //socket.emit("broadcaster");
    })
    .catch(error => console.error(error));


window.onunload = window.onbeforeunload = () => {
    socket.close();
    close_peer_connection();
}

function bind_video_stream(sid, tassel, stream){
    for(const [idx, id] in tassel.entries()){
        if (id == sid){
            $('video#student-cam-'+idx).srcObject = stream;
        }
        else{
            console.log('video can not find a proper place.' + sid)
            console.log(data[0])
        }
    }
}

function append_student_list() {
    for(i=0;i<5;i++) {
        var block = $(`<div class="col p-1"></div>`);
        block.append($(`<div class="mx-auto"></div>`)
                .append($(`<video playsinline autoplay muted id="student-cam-` + i + `" class="video-student" poster="img/student_offline.png"></video>`)));
        $("#tassel-student").append(block);
    }
}

$(document).ready(() => {
    append_student_list();

    $.getJSON("/initialization", data=>{
        self_id = data['id'];
        user_table = data['user_table'];
        tassel_list = data['tassel_list'];

        console.log(data)
        $("#username").text(user_table[self_id].name);
        for (const [key, info] of Object.entries(user_table)) {
            var block = $(`<span class="div-present"></span>`).attr('id', 'present-' + key);
            if (info["state"] !== undefined && info["state"] == "online")
                block.append($(`<img src="/img/student_online.png">`))
            else
                block.append($(`<img src="/img/student_offline.png">`))
            block.append($(`<p>${info.name}</p>`))
            $("#present-container").append(block)
        }
        draw_timeline('#TimelineContainer', user_table, tassel_list);


        init(socket, self_id, (sid, stream)=>{
            bind_video_stream(sid, tassel_list[0], steam);
        })
    })

    socket.on("update_user_table", (data) => {
        user_table = data;
        // TODO: update present table
    })

    socket.on("update_tassel_list", (data) => {
        /*tassel_list = data;*/
        draw_timeline('#TimelineContainer', user_table, data);
        
        if (self_id == data[0].Teacher){
            //Teacher broadcast
            $("video#teacher-cam").srcObject = video.srcObject;
            start_broadcasting();
        }
        else if (self_id in data[0].Students){
            // Students broadcast
            bind_video_stream(self_id, data[0], video.srcObject);
            start_broadcasting();
        }
        else{
            terminate_broadcasting();
            // Arrange watchers
        }
    })

    /*socket.on('update-tassel', (count)=>{
        console.log('get tassel')
        draw_timeline('#TimelineContainer', user_table, tassel_list.slice(count));
    })*/
    $("#btn-logout").click(()=>{
        $.get("/logout", ()=>window.location.replace('/home.html'));
    })
})


 
