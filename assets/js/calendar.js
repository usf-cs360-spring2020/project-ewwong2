const w = 400;
const h = 800;

const calendarSvg = d3.select("#calendar")
  .attr("viewBox", [0, 0, w, h])
  .attr("class", "svg");

const timeFormat = d3.timeParse("%I:%M %p");

const categories = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
const catsUnfiltered = categories;

function drawCalendar(courseInfo) {
  calendarSvg.selectAll("*").remove();
  console.log(courseInfo);
  const times = [];
  const sectionInfo = [];

  for (course of courseInfo) {
    for (section of course.sections) {
      for (day of section.days.trim()) {
          sectionInfo.push({
            'course': course.id,
            'title': course.title,
            'day': day,
            'days': section.days,
            'start': section.start,
            'end': section.end,
            'semester': section.semester,
            'instructors': section.instructors === 'None'? 'TBD': section.instructors,
            'subject': course.subject,
            'sectionId': section.sectionId
          });
      }
      times.push(timeFormat(section.start));
      times.push(timeFormat(section.end));
    }
  }

  const conflicts = checkOverlap(sectionInfo);
  console.log('Conflicts', conflicts);
  d3.select("div#conflicts").html("");
  let conflictCount = d3.select("span#conflict-count").html(`${conflicts.length} conflicts`);
  conflictCount.classed("is-success", conflicts.length <= 0);
  conflictCount.classed("is-danger", conflicts.length > 0);

  const timeScale = d3.scaleTime()
    .domain(d3.extent(times))
    .range([0, h - 150]);

  makeGant(courseInfo, w, h);

  for (conflict of conflicts) {
    d3.select("div#conflicts").html(`
      ${d3.select("div#conflicts").html()}
      <span class="tag time is-danger is-light is-rounded">${conflict[0].course} overlaps ${conflict[1].course} on ${conflict[1].day}</span>
    `);
    calendarSvg.select("#inner-rects").selectAll("rect").filter(e => courseMatch(conflict[0], e) || courseMatch(conflict[1], e))
      .style("stroke", "red")
      .style("stroke-width", 2);
    console.log(conflict);
  }

  function courseMatch(d, e) {
    return d.course === e.course && d.start === e.start && d.end === e.end && d.days === e.days && d.instructors === e.instructors;
  }

  function makeGant(courseInfo, pageWidth, pageHeight) {
    const barWidth = pageWidth / 7 - (6 * 4) + 5;
    const gap = barWidth + 4;
    const leftPad = 75 + 4;
    const sidePadding = 75;

    makeGrid(sidePadding, leftPad, pageWidth, pageHeight);
    drawRects(sectionInfo, gap, leftPad, sidePadding, barWidth, pageWidth, pageHeight);
    vertLabels(gap, leftPad, sidePadding);
  }

  // https://stackoverflow.com/questions/44800471/check-if-times-overlap-using-moment
  function checkOverlap(sections) {
    if (sections.length === 1) return [];
    let overlaps = [];

    for (day of categories) {
      let daySections = sections.filter(section => section.day === day).sort((section1, section2) =>
        timeFormat(section1.start) - timeFormat(section2.start)
      );
      for (let i = 0; i < daySections.length - 1; i++) {
        const currentEndTime = daySections[i].end;
        const nextStartTime = daySections[i + 1].start;

        if (timeFormat(currentEndTime) > timeFormat(nextStartTime)) {
          overlaps.push([daySections[i], daySections[i + 1]]);
        }
      }
    }
    return overlaps;
  };

  function drawRects(data, gap, leftPad, theSidePad, barWidth, w, h) {
    var bigRects = calendarSvg.append("g")
      .selectAll("rect")
      .data(categories)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return i * gap + leftPad;
      })
      .attr("y", 0)
      .attr("width", barWidth)
      .attr("height", function(d) {
        return h - theSidePad / 2;
      })
      .attr("stroke", "none")
      .attr("fill", "gainsboro")
      .attr("opacity", 0.2);

    var rectangles = calendarSvg.append('g')
      .attr("id", "inner-rects")
      .selectAll("rect")
      .data(data)
      .enter();

    var innerRects = rectangles.append("rect")
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("x", function(d) {
        return categories.findIndex(elem => elem === d.day) * gap + leftPad;
      })
      .attr("y", function(d) {
        return timeScale(timeFormat(d.start)) + theSidePad;
      })
      .attr("width", barWidth)
      .attr("height", function(d) {
        return timeScale(timeFormat(d.end)) - timeScale(timeFormat(d.start));
      })
      .attr("stroke", "none")
      .style("opacity", 0.6)
      .attr("fill", d => color(d));

    let tooltip = d => {
      let me = d3.select(this);

      calendarSvg.select("#inner-rects").selectAll("rect").filter(e => (d.course !== e.course || d.start !== e.start || d.end !== e.end || d.days !== e.days || d.instructors !== e.instructors))
        .transition()
        .style("opacity", 0.2);

      svg.selectAll("circle.circles").filter(e => d.course === e.id)
        .transition()
        .attr("r", 10);

      let div = d3.select("body").append("div");
      div.attr("id", "tag");

      let rows = div.append("table")
        .selectAll("tr")
        .data(["Course: ", "Title: ", "Days: ", "Hours: ", "Instructors: "])
        .enter()
        .append("tr");

      let formatDecimal = d3.format(".2f");

      let tips = {
        "Course: ": d.course,
        "Title: ": d.title,
        "Days: ": d.days,
        "Hours: ": `${d.start} - ${d.end}`,
        "Instructors: ": d.instructors
      };

      rows.append("th").text(key => key)
        .style("padding-right", "10px")
        .style("color", "white");
      rows.append("td").text(key => tips[key])
        .style("color", "white");

      return rows;
    }
    let tooltipMove = d => {
      let div = d3.select("div#tag");

      // get height of tooltip
      let bbox = div.node().getBoundingClientRect();

      // https://stackoverflow.com/questions/4666367/how-do-i-position-a-div-relative-to-the-mouse-pointer-using-jquery
      div.style("left", d3.event.pageX + "px")
      div.style("top",  (d3.event.pageY - bbox.height) + "px");
      return div;
    }
    let tooltipLeave = d => {
      let me = d3.select(this);

      calendarSvg.select("#inner-rects").selectAll("rect").filter(e => (d.course !== e.course || d.start !== e.start || d.end !== e.end || d.days !== e.days || d.instructors !== e.instructors))
        .transition()
        .style("opacity", 0.6);

      svg.selectAll("circle.circles").filter(e => d.course === e.id)
        .transition()
        .attr("r", 7);

      d3.selectAll("div#tag").remove();
      return me;
    }
    innerRects
        .on("mouseover", tooltip)
        .on("mousemove", tooltipMove)
        .on("mouseout", tooltipLeave)
        .on("contextmenu.info", function(d) {
          // create the div element that will hold the context menu
          d3.selectAll('.context-menu').data([1])
            .enter()
            .append('div')
            .attr('class', 'context-menu');
          // close menu
          d3.select('body').on('click.context-menu', function() {
            d3.select('.context-menu').style('display', 'none');
          });
          console.log(d);
          // this gets executed when a contextmenu event occurs
          d3.selectAll('.context-menu')
          	.html(`
              <span onclick="removeCourse('${d.course}', '${d.sectionId}');"><b>Remove ${d.course}</b></span>
            `).on('click', function(d) {
              d3.select('.context-menu').style('display', 'none');
            });

          d3.select('.context-menu').style('display', 'none');
          // show the context menu
          d3.select('.context-menu')
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px')
            .style('display', 'block');
          d3.event.preventDefault();
        });
  }

  function makeGrid(theSidePad, theTopPad, w, h) {
    var yAxis = d3.axisLeft()
      .scale(timeScale)
      .ticks(d3.timeHour, 1)
      .tickSize(-w + theTopPad + 20, 0, 0)
      .tickFormat(d3.timeFormat("%I %p"));

    var grid = calendarSvg.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + theSidePad + ', ' + theSidePad + ')')
      .call(yAxis)
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("fill", "#000")
      .attr("stroke", "none")
      .attr("font-size", 10)
      .attr("dx", "-1.5em");
  }

  function vertLabels(gap, leftPad, theSidePad) {
    let axisText = calendarSvg.append("g")
      .selectAll("text")
      .data(categories)
      .enter()
      .append("text")
      .text(function(d) {
        return d;
      })
      .attr("x", function(d, i) {
          return gap / 2 + i * gap + leftPad - 6;
      })
      .attr("y", 15)
      .attr("font-weight", "bold")
      .attr("font-size", 11)
      .attr("text-anchor", "start")
      .attr("text-height", 14);
  }
}
