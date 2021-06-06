const socket = io.connect(window.location.origin);

let tassel_count = 0;
let user_table = {};
let tassel_list = {};

function update_tassel(data, count) {
    //draw_timeline('#TimelineContainer', user_table, data.slice(count));
    draw_timeline('#TimelineContainer', user_table, data, count);
}

$(document).ready(() => {
    $.getJSON("/initialization", data => {
        self_id = data['id'];
        user_table = data['user_table'];
        tassel_list = data['tassel_list'];

        console.log(data)
        update_tassel(tassel_list, tassel_count);

        for (const [id, value] of Object.entries(user_table)) {
            console.log(id, value)
            $("select#new-broadcaster")
                .append($('<option></option')
                    .attr('value', id)
                    .text(id + value['name']))
        }
    })

    $("button#stop").click(() => {
        socket.emit("control", { 'stop': "" })
    })

    $("button#switch").click(() => {
        socket.emit("control", {
            'switch': $("select#new-broadcaster").val()
        })
    })

    $("button#ceremony-state").click(() => {
        socket.emit("control", {
            'ceremony_state': $("select#ceremony-state").val()
        });
        //socket.emit("set_ceremony_stage", $("select#ceremony-state").val());
    })
    $("#btn-tassel-next").click(() => {
        if (tassel_count < tassel_list.length) {
            tassel_count++;
            //socket.emit("set-tassel", tassel_count);
            socket.emit("control", { 'tassel_count': tassel_count });
            update_tassel(tassel_list, tassel_count);
        }
    })
    $("#btn-tassel-prev").click(() => {
        if (tassel_count > 0) {
            tassel_count--;
            //socket.emit("set-tassel", tassel_count);
            socket.emit("control", { 'tassel_count': tassel_count });
            update_tassel(tassel_list, tassel_count);
        }
    })
    $("#music-value").on('input', () => {
        socket.emit("control", { 'music': $("#music-value").val() })
        $("#volume").text($("#music-value").val())
    })

    $("#btn-puzzle").click(() => {
        socket.emit("control", { 'reset_puzzle': $("#input-puzzle").val() });
    })

    $("#btn-release").click(() => {
        socket.emit("control", { 'release_puzzle': $("#input-puzzle").val() });
    })
})
