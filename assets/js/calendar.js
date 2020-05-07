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
      for (day of section.days) {
          sectionInfo.push({
            'course': course.id,
            'title': course.title,
            'day': day,
            'days': section.days,
            'start': section.start,
            'end': section.end,
            'semester': section.semester,
            'instructors': section.instructors === 'None'? 'TBD': section.instructors,
            'subject': course.subject
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
  for (conflict of conflicts) {
    d3.select("div#conflicts").html(`
      ${d3.select("div#conflicts").html()}
      <span class="tag time is-danger is-light is-rounded">${conflict[0].course} overlaps ${conflict[1].course} on ${conflict[1].day}</span>
    `);
    console.log(conflict);
  }

  const timeScale = d3.scaleTime()
    .domain(d3.extent(times))
    .range([0, h - 150]);

  makeGant(courseInfo, w, h);

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
      .attr("fill", d => color(d)); // TODO: Change color here

    let tooltip = d => {
      let me = d3.select(this);
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
      d3.selectAll("div#tag").remove();
      return me;
    }
    innerRects
        .on("mouseover", tooltip)
        .on("mousemove", tooltipMove)
        .on("mouseout", tooltipLeave);
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
          return gap / 2 + i * gap + leftPad - 5;
      })
      .attr("y", 15)
      .attr("font-weight", "bold")
      .attr("font-size", 11)
      .attr("text-anchor", "start")
      .attr("text-height", 14);
  }
}
