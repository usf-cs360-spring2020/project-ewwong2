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
        x: 0.6,
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

var map;
var gRoots;

d3.json('{{ '/assets/data/data-uoi.json' | prepend: site.baseurl }}', convert).then(data => {
  console.log(data);
  map = mapping(data);
  initDefaults();
  draw([Object.keys(map.nodes)[0]]);
});

window.onload = function () {
  document.getElementById("filter").addEventListener("input", function (e) {
    draw($('#filter').val());
  });
}

function convert(d) {
  return d;
}

function initDefaults() {
  const filter = document.getElementById("filter");
  // TODO: Reparse these in a cleaner manner
  const garbage = new Set([" 500", "244- 272", "former 320", "formerly 201", "formerly 202", ", 108", ", 172", ", 273", ", 274", ", 321", ", 371", "17, 173", "A 200", "to 200", "the 400", "the 200", "or 511", "or 348", "or 300", "or 212", "or 101", "or 016", "numbered 103", "designated 400", "appropriate 300", "any 400", "another 200", "another 100", "and/or 300", "and 435", "and 400", "and 350", "and 251", "and 223", "additional 200", "a 500"]);
  const courses = Object.keys(map.nodes).sort().filter(course => !garbage.has(course));
  console.log(courses);
  courses.forEach(course => {
    let option = document.createElement("option");
    option.text = course;
    filter.add(option);
  });

  svg.attr("viewBox", [0, 0, width, height]);

  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 13)
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
      .attr("stroke", gRoots.has(d.id)? "#7ce5fc": d3.lab(color(d)).darker());

      d3.select("div#hover-container")
        .transition()
        .style("opacity", 0);
  });
}

function draw(roots) {
  const data = search(roots);

  buildSchedule();

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
    .attr("r", 5)
    .attr("stroke", d => gRoots.has(d.id)? "#7ce5fc": d3.lab(color(d)).darker())
    .attr("fill", color)
    .call(drag(simulation));

  node.append("title")
      .text(d => `${d.id}: ${d.title}`);

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

function generateTableHead(table, keys) {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of keys) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
}

function generateTable(table, data, keys) {
  for (let element of data) {
    let row = table.insertRow();
    for (key of keys) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[key]);
      cell.appendChild(text);
    }
  }
}

function buildSchedule() {
  let table = document.querySelector("table#schedule");
  table.innerHTML = "";
  let data = Object.values(map.nodes).sort().filter(course => gRoots.has(course.id));
  let keys = {
    'id': 'Course',
    'title': 'Title',
    'credits': 'Credits',
    'description': 'Description',
    'prerequisites': 'Prereq'
  }
  generateTableHead(table, Object.values(keys));
  generateTable(table, data, Object.keys(keys));
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
  gRoots = new Set();
  roots.forEach(root => {
    stack.push(root);
    gRoots.add(root)
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
