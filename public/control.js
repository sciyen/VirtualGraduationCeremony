const socket = io.connect(window.location.origin);

let tassel_count = 0;
let user_table = {};
let tassel_list = {};

function update_tassel(data, count){
    //draw_timeline('#TimelineContainer', user_table, data.slice(count));
    draw_timeline('#TimelineContainer', user_table, data, count);
}

$(document).ready(()=>{
    $.getJSON("/initialization", data=>{
        self_id = data['id'];
        user_table = data['user_table'];
        tassel_list = data['tassel_list'];

        console.log(data)
        update_tassel(tassel_list, tassel_count);
    })

    $("button#ceremony-state").click(()=>{
        socket.emit("set_ceremony_stage", $("select#ceremony-state").val());
    })
    $("#btn-tassel-next").click(()=>{
        if (tassel_count < tassel_list.length){
            tassel_count++;
            socket.emit("set-tassel", tassel_count);
            update_tassel(tassel_list, tassel_count);
        }
    })
    $("#btn-tassel-prev").click(()=>{
        if (tassel_count > 0){
            tassel_count--;
            socket.emit("set-tassel", tassel_count);
            update_tassel(tassel_list, tassel_count);
        }
    })
})
