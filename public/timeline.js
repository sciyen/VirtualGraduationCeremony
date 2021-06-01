function draw_timeline(timelineDivId, user_table, data){
    console.log(data)
     if (Object.keys(user_table).length > 0){
         console.log("tassel updating")
         /*d3.select(timelineDivId).selectAll('div')
            .data(data)
            .enter().append('div')
                .attr('class', 'timeline-div')
                .each((d)=>{
                    console.log(d)
                    d3.select(this).selectAll('h5')
                        .data([d.Teacher])
                        .enter()
                            .append('h5')
                            .text(d => user_table[d].name)
                    d3.select(this).selectAll('p')
                        .data([d.Students])
                        .enter()
                        .append('p')
                        .text((d)=>{
                             let names = "";
                             d.forEach(id=>{
                                 console.log(id)
                                 if (id != '')
                                     names += user_table[id].name + ', ';
                             })
                             return names
                        })
                })*/

         const timelineDiv = d3.select(timelineDivId);
         block_div = timelineDiv.selectAll("div").data(data.reverse());
     
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

