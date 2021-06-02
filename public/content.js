const socket = io.connect(window.location.origin);
const video = document.querySelector("video#cam-self");

let self_id = ""
let user_table = {}
let tassel_list = []

// tassel, 
let ceremony_stage = "idle";

// Media contrains
const constraints = {
    video: { facingMode: "user" },
    // Uncomment to enable audio
    audio: true,
};

navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => console.error(error));


window.onunload = window.onbeforeunload = () => {
    socket.close();
    close_all_peer_connection();
}

function bind_video_stream(sid, tassel, stream){
    console.log(tassel)
    if (sid == tassel['Teacher'])
        $('video#teacher-cam')[0].srcObject = stream;
    else{ 
        tassel['Students'].forEach((id, idx)=>{
            console.log("comparing")
            console.log(id)
            console.log(sid)
            if (id == sid){
                $('video#student-cam-'+idx)[0].srcObject = stream;
            }
            else{
                console.log('video can not find a proper place.' + sid)
                console.log(tassel)
            }
        })
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
        ceremony_stage = data['ceremony_state'];
        self_id = data['id'];
        user_table = data['user_table'];
        tassel_list = data['tassel_list'];

        console.log(data)
        $("#username").text(user_table[self_id].name);
        $("#ceremony-state").text(ceremony_stage);
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
            bind_video_stream(sid, tassel_list[0], stream);
        })

        // hooks up current tassel status
        update_tassel_live_stream(tassel_list);
    })

    socket.on("set_ceremony_stage", (s)=>{
        ceremony_stage = s;
    })

    socket.on("update_user_table", (data) => {
        user_table = data;
        // TODO: update present table
    })

    socket.on("update_tassel_list", (data) => {
        /*tassel_list = data;*/
        draw_timeline('#TimelineContainer', user_table, data);
        console.log (`Current tassel:`)
        console.log (data[0])
        console.log(`user: ${self_id}`)
        
        update_tassel_live_stream(data);
    })    

    $("#btn-logout").click(()=>{
        $.get("/logout", ()=>window.location.replace('/home.html'));
    })
})

function update_tassel_live_stream(data){
    if (ceremony_stage == "tassel"){
        if (self_id == data[0].Teacher){
            //Teacher broadcast
            $("#teacher-cam")[0].srcObject = video.captureStream();
            start_broadcasting();
        }
        else if (data[0].Students.includes(self_id)){
            // Students broadcast
            console.log("start broadcasting as student")
            bind_video_stream(self_id, data[0], video.captureStream());
            start_broadcasting();
        }
        else{
            // close any broadcasting
            terminate_broadcasting();
            // Arrange watchers
        }
    }
}
 
