function draw_timeline(timelineDivId, user_table, data, count) {
    console.log(data)
    if (Object.keys(user_table).length > 0) {
        console.log("tassel updating")

        const timelineDiv = d3.select(timelineDivId)

        timelineDiv.selectAll("div")
            .data(data).order()
            .join(
                enter => {
                    console.log(enter)
                    var block = enter.append("div")
                        .style('top', (d, i) => ((i - count) * 5) + "em")
                        .style('background-color', (d, i) => ((i == count) ? 'hsla(70, 33%, 75%, 0.75)' : 'transparent'))
                        .attr('class', 'timeline-div')

                    block.append("h5")
                        .text(d => user_table[d.Teacher].name)
                    block.append("p")
                        .text(d => {
                            let names = []
                            d.Students.forEach(id => {
                                if (id != '')
                                    names.push(user_table[id].name)
                            });
                            return d.Essay + names.join(', ');
                        })
                },
                update => update
                    .transition().duration(500)
                    .style('top', (d, i) => ((i - count) * 5) + "em")
                    .style('background-color', (d, i) => ((i == count) ? 'hsla(70, 33%, 75%, 0.75)' : 'transparent'))
                /*,
                exit => exit
                    .remove()*/)
        /*.order()*/
        //.sort(d3.descending);
        //.data([...data.sort(d3.descending)])

        //block_div.exit().remove();

        /*block_div_enter.append('h5').text(d => user_table[d.Teacher].name);
        block_div_enter.append('p').text(d => {
            let names = "";
            d.Students.forEach(id=>{
                //console.log(id)
                if (id != '')
                    names += user_table[id].name + ', ';
            })
            return names
        })*/
    }
}

