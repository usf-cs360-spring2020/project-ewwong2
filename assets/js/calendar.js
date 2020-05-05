var w = 800;
var h = 400;

var calendarSvg = d3.select("#calendar")
  .attr("width", w)
  .attr("height", h)
  .attr("class", "svg");

let courseInfo = JSON.parse(`[{
  "id": "AE 451",
  "subject": "AE",
  "description": "In-depth examination of aerodynamic and dynamic structural phenomena associated with flexible airplanes and missiles; divergence of linear and nonlinear elastic lifting surfaces; effect of elastic and inelastic deformations on lift distributions and stability; elastic flutter of straight and swept wings; equations of disturbed motion of elastic and inelastic aircraft; dynamic response to forces, gusts, and continuous atmospheric turbulence; creep divergence of lifting surfaces; flutter in the presence of creep; effect of temperature on inelastic divergence and flutter. 3 undergraduate hours. 3 or 4 graduate hours. Prerequisite: AE 352 or TAM 412; TAM 251.",
  "credits": "3 OR 4 hours.",
  "prerequisites": "Prerequisite: AE 352 or TAM 412; TAM 251.",
  "title": "Aeroelasticity",
  "sections": [{
    "semester": "Fall 2020",
    "start": "10:00 AM",
    "end": "11:50 AM",
    "days": "MW",
    "instructors": "Goza, A"
  }, {
    "semester": "Fall 2020",
    "start": "ARRANGED",
    "end": "None",
    "days": "None",
    "instructors": "Goza, A"
  }]
}, {
  "id": "CS 482",
  "subject": "CS",
  "description": "Same as IE 413. See IE 413.",
  "credits": "3 or 4 hours.",
  "prerequisites": "None",
  "title": "Simulation",
  "sections": [{
    "semester": "Spring 2020",
    "start": "04:00 PM",
    "end": "04:50 PM",
    "days": "MW",
    "instructors": "Jacobson, S"
  }, {
    "semester": "Spring 2020",
    "start": "03:00 PM",
    "end": "03:50 PM",
    "days": "MW",
    "instructors": "Jacobson, S"
  }, {
    "semester": "Spring 2020",
    "start": "03:00 PM",
    "end": "03:50 PM",
    "days": "MW",
    "instructors": "Jacobson, S"
  }]
}, {
  "id": "HDFS 591",
  "subject": "HDFS",
  "description": "Qualitative methods in the social sciences: epistemological context; data collection and relationships with participants; data management, analysis and evaluation; writing strategies. Specific content emphasis alternates annually between field research and grounded theory. 4 graduate hours. No professional credit. May be repeated to a maximum of 8 hours.",
  "credits": "4 hours.",
  "prerequisites": "None",
  "title": "Qualitative Methods",
  "sections": [{
    "semester": "Spring 2020",
    "start": "02:00 AM",
    "end": "04:50 AM",
    "days": "R",
    "instructors": "Cuthbertson, C"
  }]
}]`);

var timeFormat = d3.timeParse(d3.timeParse("%I:%M %p")(time));

var timeScale = d3.scaleTime()
  .domain([d3.min(taskArray, function(d) {
      return dateFormat(d.startTime);
    }),
    d3.max(taskArray, function(d) {
      return dateFormat(d.endTime);
    })
  ])
  .range([0, w - 150]);

var categories = [];

for (var i = 0; i < taskArray.length; i++) {
  categories.push(taskArray[i].type);
}

var catsUnfiltered = categories; //for vert labels

categories = checkUnique(categories);

makeGant(taskArray, w, h);

var title = calendarSvg.append("text")
  .text("Gantt Chart Process")
  .attr("x", w / 2)
  .attr("y", 25)
  .attr("text-anchor", "middle")
  .attr("font-size", 18)
  .attr("fill", "#009FFC");

function makeGant(tasks, pageWidth, pageHeight) {
  var barHeight = 20;
  var gap = barHeight + 4;
  var topPadding = 75;
  var sidePadding = 75;

  var colorScale = d3.scaleLinear()
    .domain([0, categories.length])
    .range(["#00B9FA", "#F95002"])
    .interpolate(d3.interpolateHcl);

  makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
  drawRects(tasks, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
  // vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);
}

function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {
  var bigRects = calendarSvg.append("g")
    .selectAll("rect")
    .data(theArray)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i) {
      return i * theGap + theTopPad - 2;
    })
    .attr("width", function(d) {
      return w - theSidePad / 2;
    })
    .attr("height", theGap)
    .attr("stroke", "none")
    .attr("fill", function(d) {
      for (var i = 0; i < categories.length; i++) {
        if (d.type == categories[i]) {
          return d3.rgb(theColorScale(i));
        }
      }
    })
    .attr("opacity", 0.2);

  var rectangles = calendarSvg.append('g')
    .selectAll("rect")
    .data(theArray)
    .enter();

  var innerRects = rectangles.append("rect")
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("x", function(d) {
      console.log(d.startTime);
      return timeScale(dateFormat(d.startTime)) + theSidePad;
    })
    .attr("y", function(d, i) {
      return i * theGap + theTopPad;
    })
    .attr("width", function(d) {
      return (timeScale(dateFormat(d.endTime)) - timeScale(dateFormat(d.startTime)));
    })
    .attr("height", theBarHeight)
    .attr("stroke", "none")
    .attr("fill", function(d) {
      for (var i = 0; i < categories.length; i++) {
        if (d.type == categories[i]) {
          return d3.rgb(theColorScale(i));
        }
      }
    });

  var rectText = rectangles.append("text")
    .text(function(d) {
      return d.task;
    })
    .attr("x", function(d) {
      return (timeScale(dateFormat(d.endTime)) - timeScale(dateFormat(d.startTime))) / 2 + timeScale(dateFormat(d.startTime)) + theSidePad;
    })
    .attr("y", function(d, i) {
      return i * theGap + 14 + theTopPad;
    })
    .attr("font-size", 11)
    .attr("text-anchor", "middle")
    .attr("text-height", theBarHeight)
    .attr("fill", "#fff");


  rectText.on('mouseover', function(e) {
    // console.log(this.x.animVal.getItem(this));
    var tag = "";

    if (d3.select(this).data()[0].details != undefined) {
      tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
        "Type: " + d3.select(this).data()[0].type + "<br/>" +
        "Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
        "Ends: " + d3.select(this).data()[0].endTime + "<br/>" +
        "Details: " + d3.select(this).data()[0].details;
    } else {
      tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
        "Type: " + d3.select(this).data()[0].type + "<br/>" +
        "Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
        "Ends: " + d3.select(this).data()[0].endTime;
    }
    var output = document.getElementById("tag");

    var x = this.x.animVal.getItem(this) + "px";
    var y = this.y.animVal.getItem(this) + 25 + "px";

    output.innerHTML = tag;
    output.style.top = y;
    output.style.left = x;
    output.style.display = "block";
  }).on('mouseout', function() {
    var output = document.getElementById("tag");
    output.style.display = "none";
  });

  innerRects.on('mouseover', function(e) {
    //console.log(this);
    var tag = "";
    if (d3.select(this).data()[0].details != undefined) {
      tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
        "Type: " + d3.select(this).data()[0].type + "<br/>" +
        "Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
        "Ends: " + d3.select(this).data()[0].endTime + "<br/>" +
        "Details: " + d3.select(this).data()[0].details;
    } else {
      tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
        "Type: " + d3.select(this).data()[0].type + "<br/>" +
        "Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
        "Ends: " + d3.select(this).data()[0].endTime;
    }
    var output = document.getElementById("tag");

    var x = (this.x.animVal.value + this.width.animVal.value / 2) + "px";
    var y = this.y.animVal.value + 25 + "px";

    output.innerHTML = tag;
    output.style.top = y;
    output.style.left = x;
    output.style.display = "block";
  }).on('mouseout', function() {
    var output = document.getElementById("tag");
    output.style.display = "none";
  });
}

function makeGrid(theSidePad, theTopPad, w, h) {
  var xAxis = d3.axisBottom()
    .scale(timeScale)
    .ticks(d3.timeDay, 1)
    .tickSize(-h + theTopPad + 20, 0, 0)
    .tickFormat(d3.timeFormat('%d %b'));

  var grid = calendarSvg.append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle")
    .attr("fill", "#000")
    .attr("stroke", "none")
    .attr("font-size", 10)
    .attr("dy", "1em");
}

function vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale) {
  var numOccurances = new Array();
  var prevGap = 0;

  for (var i = 0; i < categories.length; i++) {
    numOccurances[i] = [categories[i], getCount(categories[i], catsUnfiltered)];
  }

  var axisText = calendarSvg.append("g") //without doing this, impossible to put grid lines behind text
    .selectAll("text")
    .data(numOccurances)
    .enter()
    .append("text")
    .text(function(d) {
      return d[0];
    })
    .attr("x", 10)
    .attr("y", function(d, i) {
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          prevGap += numOccurances[i - 1][1];
          // console.log(prevGap);
          return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
        }
      } else {
        return d[1] * theGap / 2 + theTopPad;
      }
    })
    .attr("font-size", 11)
    .attr("text-anchor", "start")
    .attr("text-height", 14)
    .attr("fill", function(d) {
      for (var i = 0; i < categories.length; i++) {
        if (d[0] == categories[i]) {
          //  console.log("true!");
          return d3.rgb(theColorScale(i)).darker();
        }
      }
    });

}

//from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript
function checkUnique(arr) {
  var hash = {},
    result = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (!hash.hasOwnProperty(arr[i])) { //it works with objects! in FF, at least
      hash[arr[i]] = true;
      result.push(arr[i]);
    }
  }
  return result;
}

//from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array
function getCounts(arr) {
  var i = arr.length, // var to loop over
    obj = {}; // obj to store results
  while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
  return obj;
}

// get specific from everything
function getCount(word, arr) {
  return getCounts(arr)[word] || 0;
}
