---
---
const svg = d3.select("body").select("svg#graph");
const circleGroup = svg.select("g#circles");
const linkGroup = svg.select("g#links");

const width = 960;
const height = 600;
const r = 5;

const scale = d3.scaleOrdinal(d3.schemeCategory10);
const color = d => scale(d.subject);

const forceProperties = {
    center: {
        x: 0.45,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: false,
        strength: .8,
        x: .5
    },
    forceY: {
        enabled: false,
        strength: .8,
        y: .5
    },
    link: {
        enabled: true,
        distance: 50,
        iterations: 1
    }
};

let map;
let gRoots = {};

const options = {
  // isCaseSensitive: false,
  // includeScore: false,
  // shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  // minMatchCharLength: 1,
  // location: 0,
  // threshold: 0.6,
  // distance: 100,
  // useExtendedSearch: false,
  keys: [
    "title",
    "id",
    "description"
  ]
};

let fuse;

d3.json('{{ '/assets/data/uoi-2020.json' | prepend: site.baseurl }}', convert).then(data => {
  console.log(data);
  data.nodes = removeGarbage(data.nodes);
  fuse = new Fuse(data.nodes, options);
  map = mapping(data);
  initDefaults();
  // draw([Object.keys(map.nodes)[0]]);
});

window.onload = function () {
  document.getElementById("search").addEventListener("input", function (e) {
    let val = $('#search').val();
    setTimeout(function() {
      addResults(fuse.search(val));
    }, 100);
  });
  // document.getElementById("filter").addEventListener("input", function (e) {
  //   draw($('#filter').val());
  // });
}

function removeGarbage(nodes) {
  const filter = document.getElementById("filter");
  // TODO: Reparse these in a cleaner manner
  const garbage = new Set(["Prerequisite: 115", "One 200", ", 257", "additional 400", "and 103", "and 173", "and 401", "of 300", "of 400", "or 221", "or 415", " 500", "244- 272", "former 320", "formerly 201", "formerly 202", ", 108", ", 172", ", 273", ", 274", ", 321", ", 371", "17, 173", "A 200", "to 200", "the 400", "the 200", "or 511", "or 348", "or 300", "or 212", "or 101", "or 016", "numbered 103", "designated 400", "appropriate 300", "any 400", "another 200", "another 100", "and/or 300", "and 435", "and 400", "and 350", "and 251", "and 223", "additional 200", "a 500"]);
  console.log(nodes);
  return nodes.filter(course => !garbage.has(course.id));
}

function toggleShow(id) {
  let show = $(`#${id}`).hasClass("show");
  $('.result-back').removeClass("show");
  $(`#${id}-buffer`).removeClass("move-back");
  if (!show) {
    $(`#${id}-buffer`).toggleClass("move-back");
    $(`#${id}`).toggleClass("show");
  }
}

/**
 * Convert string to kebab case. From:
 * https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
function kebabCase(str) {
  return str && str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('-');
}

function seasonToIcon(season) {
  let icon = null;
  if (season == 'Fall') {
    icon = 'tree';
  } else if (season == 'Spring') {
    icon = 'seedling';
  } else if (season == 'Summer') {
    icon = 'sun';
  }
  return icon;
}

function truncate(str, n) {
  return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
}

function addResults(results) {
  if (results == false || results.length == 0) {
    if (!$('#search').val()) {
      $('#results').removeClass('expand');
    } else {
      $('#results').html(`
        <div style="margin: 10px 0px; padding: 15px 30px; background-color: rgba(255, 255, 255, 0.7); border-radius: 5px;">
          <h5 style="margin-bottom: 5px; padding-top: 5px;">
            No results found.
          <h5>
        </div>
      `);
    }
    return;
  }
  $("#results").animate({
      scrollTop: 0
  }, 500);
  let result_str = '';
  for (result of results.slice(0, 100)) {
    let shortDesc = result.item.description.replace(/^(.{200}[^\s]*).*/, "$1");
    let id = kebabCase(result.item.id);
    let semesters = new Set();
    for (section of result.item.sections) {
      semesters.add(section.semester.split(' ')[0]);
    }
    result_str += `
      <div class="result" id="${result.item.id}">
        <div class="result-front" id="${id}-front" onclick="toggleShow('${id}-back');">
          <h5 style="margin-bottom: 5px; padding-top: 5px;">
            ${result.item.title == 'None'? 'Not offered in 2020': result.item.title}
          <h5>
          <div class="tags" style="justify-content: center; margin-top: 5px; margin-bottom: 2px;" onclick="event.stopPropagation();">
            <span class="tag is-link is-light is-rounded">${result.item.id}</span>
            <span class="tag is-link is-light is-rounded">${result.item.credits}</span>
            ${Object.values([...semesters]).map(function(semester) {
              return `<span class="tag is-link is-light is-rounded"><i class="fas fa-${seasonToIcon(semester)}"></i></span>`;
            }).join("")}
          </div>
          <p class="has-text-dark is-size-7">${shortDesc == 'None'? '...': shortDesc}${shortDesc.length < result.item.description.length? "...": ""}<p>
        </div>
        <div class="buffer" id="${id}-back-buffer" onclick="toggleShow('${id}-back');"></div>
        <div class="result-back" id="${id}-back" onclick="toggleShow('${id}-back');">
          <h5 style="margin-bottom: 5px; padding-top: 10px;">
            ${result.item.title == ''? 'Not offered in 2020': result.item.title} Courses
          </h5>
          <div class="tags" style="justify-content: center; margin-top: 5px; margin-bottom: 2px;">
            ${Object.values(result.item.sections).filter(section => section.start !== 'ARRANGED').map(function(section, idx) {
              return `<span class="tag is-link is-light is-rounded time tooltip" onclick="addCourse('${result.item.id}', '${idx}');">
                        <i class="fas fa-${seasonToIcon(section.semester.split(' ')[0])}"></i>&nbsp;&nbsp;${section.days} ${section.start} to ${section.end}
                        <span class="tooltiptext">${section.instructors === 'None'? 'TBD': truncate(section.instructors, 20)}</span>
                      </span>`;
            }).join("")}
            <span class="tag is-link is-light is-rounded time tooltip" onclick="addCourse('${result.item.id}', '-1');">
              No Section
            </span>
          </div>
        </div>
      </div>
    `
  }
  $('#results').html(result_str);
  $('#results').addClass('expand');
}

function addCourse(course, section) {
  console.log('Add', course, section, gRoots);
  !(course in gRoots) && (gRoots[course] = new Set())
  gRoots[course].add(+section);
  $('#search').val('');
  $('#results').removeClass('expand');
  draw(Object.keys(gRoots));
}

function removeCourse(course, section) {
  console.log('Remove', course, section, gRoots);
  gRoots[course].delete(+section);
  if (gRoots[course].size === 0) {
    delete gRoots[course];
    console.log('Delete');
  }
  $('#search').val('');
  $('#results').removeClass('expand');
  draw(Object.keys(gRoots));
}

function convert(d) {
  return d;
}

function initDefaults() {
  svg.attr("viewBox", [0, 0, width, height]);

  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 16)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-4 L 7,0 L 0,4')
    .attr('fill', '#999')
    .style('stroke','none');
}

function initInteractivity() {
  d3.select("div#hover-container")
    .style("opacity", 0);

  circleGroup.selectAll("circle.circles").on("mouseover.info", function(d) {
    let shortDesc = d.description.replace(/^(.{80}[^\s]*).*/, "$1");

    d3.select(this)
      .transition()
      .attr("stroke", "rgb(255, 128, 128)");

    d3.select("div#hover")
      .html(`
        <b>Course:</b> ${d.id}<br/>
        <b>Title:</b> ${d.title == 'None'? 'Not offered in Spring 2020': d.title}<br/>
        <b>Credits:</b> ${d.credits == 'None'? '-': d.credits}<br/>
        <b>Description:</b> ${shortDesc == 'None'? '...': shortDesc}${shortDesc.length < d.description.length? "...": ""}<br/>
      `);
    d3.select("div#hover-container")
      .transition()
      .style("opacity", 1);
  });

  circleGroup.selectAll("circle.circles").on("mouseout.info", function(d) {
    d3.select(this)
      .transition()
      .attr("stroke", Object.keys(gRoots).includes(d.id)? "#7ce5fc": d3.lab(color(d)).darker());

      d3.select("div#hover-container")
        .transition()
        .style("opacity", 0);
  });
}

function draw(roots) {
  const data = search(roots);

  buildSchedule();
  drawLegend([...new Set(data.nodes.map(d => d.subject))], scale);

  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes);

  initializeForces(links, simulation);

  const link = linkGroup.attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("class", "link")
      .attr('marker-end','url(#arrowhead)');

  let nodeGroup = circleGroup.attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

  const node = nodeGroup.selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "circles")
    .attr("r", 7)
    .attr("stroke", d => Object.keys(gRoots).includes(d.id)? "#7ce5fc": d3.lab(color(d)).darker())
    .attr("fill", color)
    .call(drag(simulation));

  // node.append("title")
  //     .text(d => `${d.id}: ${d.title}`);

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  initInteractivity();
  return svg.node();
}

function drawLegend(subjects, color) {
  svg.select("g#legend").selectAll("*").remove();
  let lConfig = {
    'x': 770,
    'y': 635,
    'width': 185,
    'height': 35 + (subjects.length * 15),
    'p': 10,
    'marker': {
      'size': 10
    }
  };

  lConfig.y -= lConfig.height;

  // Legend from: https://www.d3-graph-gallery.com/graph/custom_legend.html
  svg.select("g#legend").append("rect")
    .attr("fill", "rgba(240, 240, 240, 0.6)")
    .attr("x", lConfig.x)
    .attr("y", lConfig.y)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("width", lConfig.width)
    .attr("height", lConfig.height);

  svg.select("g#legend").append("text")
    .attr("font-weight", "bold")
    .attr("x", lConfig.x + lConfig.width/2)
    .attr("y", lConfig.y + 2*lConfig.p)
    .attr("text-anchor", "middle")
    .text("Subjects");

  svg.select("g#legend").selectAll("mydots")
    .data(subjects)
    .enter()
    .append("rect")
      .attr("x", lConfig.x + lConfig.p)
      .attr("y", (d,i) => lConfig.y + 3*lConfig.p + i*(lConfig.marker.size+5))
      .attr("width", lConfig.marker.size)
      .attr("height", lConfig.marker.size)
      .style("fill", d => color(d))
      .style("alignment-baseline", "middle");

  // Add one dot in the legend for each name.
  svg.select("g#legend").selectAll("mylabels")
    .data(subjects)
    .enter()
    .append("text")
      .attr("x", lConfig.x + 2*lConfig.p + lConfig.marker.size*1.2)
      .attr("y", (d,i) => lConfig.y + 3*lConfig.p  + i*(lConfig.marker.size+5) + (lConfig.marker.size/2))
      .style("fill", d => color(d))
      .text(d => d === 'None'? 'Not offered in 2020': d)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");
  return svg.select("g#legend");
}

function buildSchedule() {
  let table = document.querySelector("div#schedule");
  table.innerHTML = "";
  let data = Object.values(map.nodes).sort().filter(course => Object.keys(gRoots).includes(course.id));
  let creditsMin = 0;
  let creditsMax = 0;
  let calendarData = [];
  console.log(data);
  for (course of data) {
    let creditSplit = course.credits.split(' ');
    if (creditSplit.length > 1 && gRoots[course.id].has(-1)) {
      creditsMin += +creditSplit[0];
      creditsMax += creditSplit.length > 3? +creditSplit[2]: +creditSplit[0];
    }
    let sectionNums = [...gRoots[course.id]].sort().filter(sectionIdx => sectionIdx !== -1);
    let sections = sectionNums.map(sectionIdx => map.nodes[course.id].sections.filter(section => section.start !== 'ARRANGED')[sectionIdx]);
    let tempCourse = {...course};
    tempCourse.sections = sections;
    calendarData = calendarData.concat(tempCourse);
    table.innerHTML += `
    <div class="schedule-entry">
      <h4 style="margin-bottom: 5px; padding-top: 5px;">
        ${course.title == 'None'? 'Not offered in 2020': course.title}
        <div style="float: right;">
          <span class="tag is-link is-light is-rounded">${course.id}</span>
          <span class="tag is-link is-light is-rounded">${course.credits}</span>
        </div>
      </h4>
      <p class="has-text-dark is-size-7">${course.description}<p>
      <h5 class="is-size-7">Selected Sections:<h5>
      <div class="tags" style="margin-top: 5px; margin-bottom: 2px;">
        ${sections.filter(section => section.start !== 'ARRANGED' && section.credits !== 'None').map(function(section, idx) {
          creditsMin += +creditSplit[0];
          creditsMax += creditSplit.length > 3? +creditSplit[2]: +creditSplit[0];
          return `<span class="tag is-link is-light is-rounded time tooltip" onclick="removeCourse('${course.id}', '${sectionNums[idx]}');">
                    <i class="fas fa-${seasonToIcon(section.semester.split(' ')[0])}"></i>&nbsp;&nbsp;${section.days} ${section.start} to ${section.end}
                    <span class="tooltiptext">${section.instructors === 'None'? 'TBD': truncate(section.instructors, 20)}</span>
                  </span>`;
        }).join("")}
        ${gRoots[course.id].has(-1)? `<span class="tag time is-link is-light is-rounded" onclick="removeCourse('${course.id}', '-1');">No Section</span>`: ''}
      </div>
    </div>
    `;
  }
  d3.select("span#credit-hours").node().innerHTML = `${creditsMin === creditsMax? `${creditsMin}`: `${creditsMin} to ${creditsMax}`} credit hours`;
  drawCalendar(calendarData);
}

function initializeForces(links, simulation) {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces(links, simulation);
}

function updateForces(links, simulation) {
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(d => d.id)
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}

let mapping = (rawData) => {
  let graph = {
    nodes: {},
    links: {}
  };

  rawData.nodes.forEach(node => {
    const elem = document.createElement('textarea');
    elem.innerHTML = node.title;
    node.title = elem.childNodes[0].nodeValue;
    graph.nodes[node.id] = node;
  });
  rawData.links.forEach(link => {
    !(link.source in graph.links) && (graph.links[link.source] = []);
    graph.links[link.source].push(link);
  });
  return graph;
}

let search = (roots) => {
  let graph = {
    nodes: [],
    links: []
  };
  let visited = new Set();
  let stack = [];
  roots.forEach(root => {
    stack.push(root);
  });
  while (stack !== undefined && stack.length != 0) {
    let curr = stack.pop();
    if (visited.has(curr)) {
      continue;
    } else {
      visited.add(curr);
    }
    graph.nodes.push(map.nodes[curr]);
    if (!(curr in map.links)) {
      continue;
    }
    map.links[curr].forEach(link => {
      stack.push(link.target);
      graph.links.push(link);
    });
  }
  return graph;
}

let drag = simulation => {
  function dragstarted(d) {
    dragged = true;
    // svg.select("g#annotation").select("text#label").remove();
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    dragged = false;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}
