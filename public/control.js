const socket = io.connect(window.location.origin);

let tassel_count = 0;
let user_table = {};
let tassel_list = {};

function update_tassel(data, count){
    draw_timeline('#TimelineContainer', user_table, data.slice(count));
}

$(document).ready(()=>{
    socket.on("update_user_table", (data) => {
        user_table = data;
        socket.emit('request_tassel_list')
    })
    socket.on("update_tassel_list", (data) => {
        console.log(data)
        tassel_list = data;
        update_tassel(data, tassel_count);
    })

    $("#btn-tassel-next").click(()=>{
        if (tassel_count < tassel_list.length){
            tassel_count++;
            socket.emit("set-tassel", tassel_list.slice(tassel_count));
            update_tassel(tassel_list, tassel_count);
        }
    })
    $("#btn-tassel-prev").click(()=>{
        if (tassel_count > 0){
            tassel_count--;
            socket.emit("set-tassel", tassel_list.slice(tassel_count));
            update_tassel(tassel_list, tassel_count);
        }
    })
})
