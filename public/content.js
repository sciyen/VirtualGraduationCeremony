const socket = io.connect(window.location.origin);
const video = document.querySelector("video#cam-self");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

const max_tassel_student = 6;

let self_id = ""
let user_table = {}
let tassel_list = []
let tassel_count = 0;
let special_handle_id = "";
let previousVideo = "";
let allowDragTassel = false;
let current_puzzle = 1;

// tassel, 
let ceremony_state = "idle";

// Media contrains
const constraints = {
    video: {
        facingMode: "user",
        width: {
            max: 320,
            exact: 160
        },
        height: {
            max: 240,
            exact: 120
        }
    },
    // Uncomment to enable audio
    audio: true,
};

navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => console.error(error));

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream()
    .then(getDevices)
    .then(gotDevices);

function getDevices() {
    return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos;
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement("option");
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === "audioinput") {
            option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioSelect.appendChild(option);
        } else if (deviceInfo.kind === "videoinput") {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .catch(handleError);
}

function gotStream(stream) {
    window.stream = stream;
    audioSelect.selectedIndex = [...audioSelect.options].findIndex(
        option => option.text === stream.getAudioTracks()[0].label
    );
    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
        option => option.text === stream.getVideoTracks()[0].label
    );
    video.srcObject = stream;
}

function handleError(error) {
    console.error("Error: ", error);
}

window.onunload = window.onbeforeunload = () => {
    close_all_peer_connection();
    socket.close();
    //$.get("/logout", ()=>{});
}

function append_student_list() {
    for (i = 0; i < max_tassel_student; i++) {
        var block = $(`<div class="col p-1"></div>`);
        block.append($(`<div class="mx-auto student-container"></div>`)
            .attr('id', 'std-can-' + i)
            .append($("<video playsinline autoplay poster='img/student_offline.png'></video>")
                .attr("id", "student-cam-" + i)
                .attr("class", "video-student"))
            .append($("<img class='cap' src='/img/cap.png'>"))
            .append($('<div class="control"></div>')
                .append($("<img class='tassel' src='/img/tassel.png'>")
                    .attr('id', 'tassel-' + i))
                .append($("<input type='range'></input>")
                    .attr("class", "")
                    .attr('min', 0).attr('max', 100).val(0)
                    .attr('id', 'range-input-' + i))
                /*.on('input', ()=>{
                    console.log($(this).val())
                    $(this).siblings('.tassel')
                        .attr('left', $(this).value + "%")
                })*/ )
            .append($('<h4></h4>'))
        );

        $("#tassel-student").append(block);
    }
    for (let i = 0; i < max_tassel_student; i++) {
        $('#range-input-' + i).on('input', () => {
            if (allowDragTassel) {
                let val = $('#range-input-' + i).val();
                $('#tassel-' + i).css('left', val + '%')
                socket.emit('control-tassel', {
                    'id': i, 'val': val
                });
            }
        })
    }
}

function draw_user_table(div, data) {
    let user_table_list = d3.values(data);
    console.log(user_table_list)
    const user_div = d3.select(div);
    user_div.selectAll('span')
        .data(user_table_list).order()
        .join(
            enter => {
                console.log('enter user table')
                console.log(enter)
                var block = enter.append('span')
                    .attr('class', 'div-present')
                block.append('img')
                    .attr('src', (d) => (d['status'] == 'online') ? "https://i.imgur.com/Fi4GEh0s.png" : "https://i.imgur.com/DYABaNFs.jpg")
                    .attr('id', (d) => ('home-img-' + d['name']))
                block.append('p')
                    .text((d) => d['name'])
            },
            update => {
                console.log('update user table')
                console.log(update)
                update.select('img')
                    .attr('src', (d) => (d['status'] == 'online') ? "https://i.imgur.com/Fi4GEh0s.png" : "https://i.imgur.com/DYABaNFs.jpg")
            })
}

function update_user_table(data) {
    data.forEach(d => {
        sid = d['id'];
        if (d['src'] !== undefined)
            $("#home-img-" + user_table[sid].name).attr('src', d['src']);
        else if (d['id'] !== undefined && d['status'] !== undefined) {
            console.log('status')
            if (d['status'] == 'online')
                $("#home-img-" + user_table[sid].name).attr('src', 'https://i.imgur.com/Fi4GEh0s.png');
            else
                $("#home-img-" + user_table[sid].name).attr('src', 'https://i.imgur.com/DYABaNFs.jpg');
        }
    })
}

$(document).ready(() => {
    append_student_list();
    //music control
    var music = document.getElementById("bg-music");
    music.onplaying = function () {
        music.volume = 0.2;
    }

    $.getJSON("/initialization", data => {
        ceremony_state = data['ceremony_state'];
        self_id = data['id'];
        user_table = data['user_table'];
        tassel_count = data['tassel_count'];
        tassel_list = data['tassel_list'];

        console.log(data)
        $("#username").text(user_table[self_id].name);
        $("#ceremony-state").text(ceremony_state);

        socket.emit('login', self_id);

        draw_user_table("#present-container", user_table);
        draw_timeline('#TimelineContainer', user_table, tassel_list, tassel_count);

        init(socket, self_id, (sid, stream) => {
            match_tag_and_bind(sid, self_id, tassel_list[tassel_count], stream);
        })

        // hooks up current tassel status
        update_tassel_live_stream(self_id, tassel_list[tassel_count]);
    })

    socket.on("update_user_table", (data) => {
        user_table = data;
        //draw_user_table("#present-container", user_table);
    })

    socket.on("control", (cmd) => {
        if (cmd['tassel_count'] !== undefined) {
            tassel_count = cmd['tassel_count'];
            special_handle_id = "";
            draw_timeline('#TimelineContainer', user_table, tassel_list, tassel_count);
            $("#tassel-essay-1").children('p').text(tassel_list[tassel_count].Essay);

            for (let i = 0; i < max_tassel_student; i++) {
                unbind_stream_to_video($('video#student-cam-' + i));
            }

            update_tassel_live_stream(self_id, tassel_list[tassel_count]);
        }
        if (cmd['ceremony_state'] !== undefined) {
            ceremony_state = cmd['ceremony_state'];
            if (ceremony_state == "puzzle") {
                $("#puzzle-container").removeClass('hide');
                set_puzzle(socket, current_puzzle);
            }
            /*$("#ceremony-state").text(ceremony_state);*/
        }
        if (cmd['stop'] !== undefined) {
            if (broadcasting && (self_id == tassel_list[tassel_count].Teacher)) {
                // teacher is broadcasting
                close_all_peer_connection();
                for (const id in broadcastConns) {
                    broadcastConns[id].close();
                    delete broadcastConns[id];
                }
            }
        }
        if (cmd['switch'] !== undefined) {
            special_handle_id = cmd['switch'];
            if (self_id == tassel_list[tassel_count].Teacher ||
                ((previousVideo[0] !== undefined) && (previousVideo[0].id == "teacher-cam"))) {
                // teacher is broadcasting
                console.log("Previous broadcaster stop")
                terminate_broadcasting();
            }
            if (self_id == cmd['switch']) {
                update_tassel_live_stream(self_id, tassel_list[tassel_count]);
                start_broadcasting();
                // remember to handle the tag to place the video
            }
        }
        if (cmd['music'] !== undefined) {
            music.volume = cmd['music'] / 100;
        }
        /*if (cmd['mosaic'] !== undefined) {
            update_user_table(cmd['mosaic']);
        }*/
        if (cmd['user_table_update'] !== undefined) {
            update_user_table(cmd['user_table_update']);
        }
        if (cmd['reset_puzzle'] !== undefined) {
            $("#input-puzzle").val(0);
            current_puzzle = cmd['reset_puzzle'];
            $("#puzzle-img-0").addClass('hide');
            $("#puzzle-img-1").addClass('hide');
            $("#puzzle-img-2").addClass('hide');
            $("#puzzle-img-3").addClass('hide');
            $("#puzzle-img-4").addClass('hide');
        }
        if (cmd['release_puzzle'] !== undefined) {
            for (let idx = 0; idx < 108; idx++) {
                const row = (Math.floor((idx / 12) + 1)).toLocaleString('en', { minimumIntegerDigits: 2 });
                const col = ((idx % 12) + 1).toLocaleString('en', { minimumIntegerDigits: 2 });
                const img_name = 'http://nckues.ddns.net/mosaic/' + current_puzzle + '_mosaic_images/' + col + '_' + row + '.jpg';
                const data = {
                    'id': Object.keys(user_table)[idx],
                    'src': img_name
                };
                update_user_table([data]);
            }
        }


        console.log("broadcaster");
        console.log(broadcastConns);
    })

    socket.on('control-tassel', (data) => {
        $('#range-input-' + data['id']).val(data['val'])
        $('#tassel-' + data['id']).css('left', data['val'] + '%')
    })

    socket.on("terminate_broadcasting", (sid, action) => {
    })
    $("#btn-logout").click(() => {
        close_all_peer_connection();
        //socket.close();
        $.get("/logout", () => window.location.replace('/home.html'));
        //$.get("/logout");
    })
})

// update video from self cam, target, self, tassel
function update_tassel_live_stream(self_id, data) {
    //if (ceremony_state == "tassel") {

    allowDragTassel = false;
    if ((self_id == data.Teacher) || (self_id == special_handle_id)) {
        //Teacher broadcast
        console.log("Update tassel live stream")
        allowDragTassel = true;
        bind_stream_to_video(self_id, self_id, $('video#teacher-cam'), video.captureStream());
        start_broadcasting();
    }
    else if (data.Students.includes(self_id)) {
        // Students broadcast
        console.log("start broadcasting as student")
        match_tag_and_bind(self_id, self_id, data, video.captureStream());
        start_broadcasting();
    }
    else if ((self_id == "E94096160") || (self_id == "E94094037")) {
        console.log("start broadcasting as master")
        match_tag_and_bind(self_id, self_id, data, video.captureStream());
        start_broadcasting();
    }
    else {
        // close any broadcasting
        $("#teacher-cam")[0].muted = false;
        $("#teacher-cam")[0].pause();
        terminate_broadcasting();
        unbind_stream_to_video(previousVideo);
        // Arrange watchers
    }
    //}
}

// update video from others
function match_tag_and_bind(sid, self_id, tassel, stream) {
    console.log(tassel)
    if (sid == "E94096160") {
        bind_stream_to_video(sid, self_id, $('video#cam-master1'), stream);
    }
    else if (sid == "E94094037") {
        bind_stream_to_video(sid, self_id, $('video#cam-master2'), stream);
    }
    else if ((sid == tassel['Teacher']) || (sid == special_handle_id)) {
        bind_stream_to_video(sid, self_id, $('video#teacher-cam'), stream);
    }
    else {
        tassel['Students'].forEach((id, idx) => {
            if (id == sid) {
                bind_stream_to_video(sid, self_id, $('video#student-cam-' + idx), stream);
            }
        })
    }
}

function bind_stream_to_video(sid, self_id, video_tag, stream) {
    video_tag[0].muted = (sid == self_id);
    video_tag[0].srcObject = stream;
    video_tag.siblings('h4').text(user_table[sid].name);
    if (sid == self_id) {
        previousVideo = video_tag;
    }
    video_tag.parent().removeClass('hide');
}

function unbind_stream_to_video(video_tag) {
    try {
        console.log("unbind")
        console.log(video_tag)
        video_tag[0].muted = false;
        video_tag[0].pause();
        $(previousVideo.siblings('h4')[0]).text("");
        video_tag.parent().addClass('hide');
    }
    catch {
        console.log("can not unbind");
        console.log(video_tag);
    }
}

function set_puzzle(socket, current_puzzle) {
    $("#input-puzzle").on('input', () => {
        let val = $('#input-puzzle').val();
        if (val < 20)
            $("#puzzle-img-0").removeClass('hide');
        else if (val < 40)
            $("#puzzle-img-1").removeClass('hide');
        else if (val < 60)
            $("#puzzle-img-2").removeClass('hide');
        else if (val < 80)
            $("#puzzle-img-3").removeClass('hide');
        else if (val < 100)
            $("#puzzle-img-4").removeClass('hide');
        else if (val >= 100) {
            const idx = sid_to_puzzel_index(self_id)
            update_puzzel_figure(socket, idx);
        }
    })
}

function sid_to_puzzel_index(sid) {
    const idx = d3.values(user_table).findIndex((e) => (e.name == user_table[sid].name));
    return idx;
}

function update_puzzel_figure(socket, idx) {
    const row = (Math.floor((idx / 12) + 1)).toLocaleString('en', { minimumIntegerDigits: 2 });
    const col = ((idx % 12) + 1).toLocaleString('en', { minimumIntegerDigits: 2 });
    const img_name = 'http://nckues.ddns.net/mosaic/' + current_puzzle + '_mosaic_images/' + col + '_' + row + '.jpg';
    const data = {
        'id': self_id,
        'src': img_name
    };
    update_user_table([data]);
    socket.emit("control", {
        "user_table_update": data
    })
}