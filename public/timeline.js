function draw_timeline(timelineDivId, user_table, data){
    console.log(data)
     const timelineDiv = d3.select(timelineDivId);
     if (Object.keys(user_table).length > 0){
         console.log("tassel updating")
         block_div = timelineDiv.selectAll("div").data(data);
     
         const block_div_enter = block_div.enter()
             .append('div')
             .attr('class', 'timeline-div')
     
         block_div.exit().remove();
     
         block_div_enter.append('h5').text(d => user_table[d.Teacher].name);
         block_div_enter.append('p').text(d => {
             let names = "";
             d.Students.forEach(id=>{
                 console.log(id)
                 if (id != '')
                     names += user_table[id].name + ', ';
             })
             return names
         })
     }
}

