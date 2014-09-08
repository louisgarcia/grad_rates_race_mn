//Check if info exists, by school number
Array.prototype.returnCountyInfo = function(county){
		for (var i = 0; i < this.length; i++) {
				if (this[i].countyName == county){
						return this[i];
				}
		}
		return undefined;
};

function countyObj(countyInfo){
  var outArr = [];
  var IAN_G = [];
  var IAN_T = [];
  var API_G = [];
  var API_T = [];
  var BLA_G = [];
  var BLA_T = [];
  var HIS_G = [];
  var HIS_T = [];
  var WHI_G = [];
  var WHI_T = [];
  
  for(var prop in countyInfo){
    if (typeof countyInfo[prop] === 'string'){
      if (prop == 'countyName'){
        outArr.countyName = countyInfo[prop];
      } 
      else if (prop == 'metro'){
        outArr.metro = countyInfo[prop];
      }
      else if (prop.substring(0,8) == 'IAN_GRAD'){
      	IAN_G[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'IAN_TOTL'){
      	IAN_T[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'API_GRAD'){
      	API_G[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'API_TOTL'){
      	API_T[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'BLA_GRAD'){
      	BLA_G[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'BLA_TOTL'){
      	BLA_T[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'HIS_GRAD'){
      	HIS_G[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'HIS_TOTL'){
      	HIS_T[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'WHI_GRAD'){
      	WHI_G[prop.substring(9)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,8) == 'WHI_TOTL'){
      	WHI_T[prop.substring(9)] = Number(countyInfo[prop]);
      }
    }
  }
  outArr.IAN_G = IAN_G;
  outArr.IAN_T = IAN_T;
  outArr.API_G = API_G;
  outArr.API_T = API_T;
  outArr.BLA_G = BLA_G;
  outArr.BLA_T = BLA_T;
  outArr.HIS_G = HIS_G;
  outArr.HIS_T = HIS_T;
  outArr.WHI_G = WHI_G;
  outArr.WHI_T = WHI_T;
  return outArr;   
} 

var statewideOptionList = [
	{condensedName: 'Statewide', friendlyName: 'Statewide'},
	{condensedName: 'metro', friendlyName: 'All Metro'},
	{condensedName: 'nonmetro', friendlyName: 'All Non-Metro'},
	{condensedName: 'MinneapolisStPaulBloomingtonMNWI', friendlyName: 'Twin Cities Metro'},
	{condensedName: 'StCloudMN', friendlyName: '    St. Cloud Metro'},
	{condensedName: 'MankatoNorthMankatoMN', friendlyName: '    Mankato Metro'},
	{condensedName: 'DuluthMNWI', friendlyName: '    Duluth Metro'},
	{condensedName: 'FargoNDMN', friendlyName: '    Fargo Metro'},
	{condensedName: 'RochesterMN', friendlyName: '    Rochester Metro'},
	{condensedName: 'LaCrosseOnalaskaWIMN', friendlyName: '    La Crosse-Onalaska Metro'},
	{condensedName: 'GrandForksNDMN', friendlyName: '    Grand Forks Metro'}	
];

var allCountyInfo = [];
var countyJson = {};

var parseDate = d3.time.format("%Y");
var years = ["2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013"];
years = years.map(function(d){return parseDate.parse(d);});

var width = 400,height = 550;

//other functions use the projection/path for highlighting certain sections of the map
var projection = d3.geo.conicEqualArea()
	.center([1.5, 46.5])
	.rotate([95, 0])
	.parallels([29.5, 45.5])
	.scale(3800)
	.translate([width / 2, height / 2]);

var path = d3.geo.path()
	.projection(projection);

function loadData(){
	var svg = d3.selectAll("svg#mapMain")
		.attr("width", width)
		.attr("height", height);

	d3.json("data/mncounties.json", function(errorJ, mn) {
		countyJson=mn;
			d3.csv("data/gradRatesTrend.csv", function(errorC, studentData){
				allCountyInfo = studentData;
				//build the metro area list
				d3.select("select#statewideOptions").selectAll('option').data(statewideOptionList).enter()
				.append("option").attr("value", function(d){return d.condensedName;}).text(function(d){return d.friendlyName;});

				//Wacky hack to remove the last 11 of the excel sheet which are region and statewide data
				var countyList = studentData.map(function(d){return d.countyName;}).slice(0, -11).sort();
				d3.select("select#countyOptions").selectAll('option').data(countyList).enter()
				.append("option").attr("value", function(d){return d;}).text(function(d){return d;});

				svg.selectAll(".county")
				.data(topojson.feature(mn, mn.objects.counties).features).enter().append("path")
				.attr({
					d: path,
					id: function(d) {return d.properties.name;},
					stroke: '#333',
					'class' : function(d){
						var countyData = studentData.returnCountyInfo(d.properties.name);
						return 'county ' + (countyData.metro === "" ? 'nonMetro' : countyData.metro );} 
				})
				.on('click', function(d){
					var clickedCounty = studentData.returnCountyInfo(d.properties.name);
					//what happens when clicked depends on the selection option
					var displayOption = getRadioVal('displayOptions');
					if (displayOption == 'state'){
						var region = clickedCounty.metro === "" ? 'nonmetro' : clickedCounty.metro;
						var stateElement = document.getElementById('statewideOptions');
						stateElement.value = region;
						toggleRegion(region);
					}
					else { //by county
						var countyElement = document.getElementById('countyOptions');
						countyElement.value = d.properties.name;
						toggleCounty(clickedCounty);
					}
				});

				svg.append("path")
				.datum(topojson.mesh(mn, mn.objects.counties, function(a, b) { return a === b; }))
				.attr({
					"id": "highlightPath",
					"d": path
				});

				getSelectToggleRegion();
			});
	});
}

function getSelectToggleCounty(){
	var e = document.getElementById("countyOptions");
	var county = e.options[e.selectedIndex].text;
	toggleCounty(allCountyInfo.returnCountyInfo(county));
}

function getSelectToggleRegion(){
	var e = document.getElementById("statewideOptions");
	var region = e.options[e.selectedIndex].value;
	toggleRegion(region);
}

function toggleCounty(countyInfo){
	d3.select("#highlightPath").remove();

	d3.selectAll("svg#mapMain").append("path")
	.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { return a.properties.name == countyInfo.countyName || b.properties.name == countyInfo.countyName; }))
	.attr({
		"id": "highlightPath",
		"d": path
	});

	displayCountyData(countyInfo);
}

function toggleRegion(regionType){
	d3.select("#highlightPath").remove();

	if (regionType == 'Statewide'){
		d3.selectAll("svg#mapMain").append("path")
		.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { return a === b; }))
		.attr({
			"id": "highlightPath",
			"d": path
		});
		var stateInfo = _.find(allCountyInfo, function(d){return d.countyName == 'Statewide';});
		displayCountyData(stateInfo);
	}
	else if (regionType == 'metro'){
		d3.selectAll("svg#mapMain").append("path")
		.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { 
			var aCounty = allCountyInfo.returnCountyInfo(a.properties.name);
			var bCounty = allCountyInfo.returnCountyInfo(b.properties.name);
			//I realize this logic can be simplified but I need it spelled out
			return (aCounty.metro === "" && bCounty.metro !== "") || //either border between metro and non metro
				(aCounty.metro !== "" && bCounty.metro === "") || //either border between metro and non metro
				(aCounty.metro !== "" && aCounty === bCounty) || //or border between metro and outside
				(bCounty.metro !== "" && aCounty === bCounty);  })) //or border between metro and outside
		.attr({
			"id": "highlightPath",
			"d": path
		});
		var regionInfo = _.find(allCountyInfo, function(d){return d.countyName == 'Metro';});
		displayCountyData(regionInfo);
	}
	else if (regionType == 'nonmetro'){
		d3.selectAll("svg#mapMain").append("path")
		.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { 
			var aCounty = allCountyInfo.returnCountyInfo(a.properties.name);
			var bCounty = allCountyInfo.returnCountyInfo(b.properties.name);
			//I realize this logic can be simplified but I need it spelled out
			return (aCounty.metro === "" && bCounty.metro !== "") || //either border between metro and non metro
				(aCounty.metro !== "" && bCounty.metro === "") || //either border between metro and non metro
				(aCounty.metro === "" && aCounty === bCounty) || //or border between nonmetro and outside
				(bCounty.metro === "" && aCounty === bCounty);  })) //or border between nonmetro and outside
		.attr({
			"id": "highlightPath",
			"d": path
		});
		var regionInfo = _.find(allCountyInfo, function(d){return d.countyName == 'NonMetro';});
		displayCountyData(regionInfo);
	}
	else  { //specific metro region
		d3.selectAll("svg#mapMain").append("path")
		.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { 
			var aCounty = allCountyInfo.returnCountyInfo(a.properties.name);
			var bCounty = allCountyInfo.returnCountyInfo(b.properties.name);
			//I realize this logic can be simplified but I need it spelled out
			return (aCounty.metro === regionType && bCounty.metro !== regionType) || //either border between specified region and outside specified region
				(aCounty.metro !== regionType && bCounty.metro === regionType) || //either border between metro and non metro
				(aCounty.metro === regionType && aCounty === bCounty) || //or border between nonmetro and outside
				(bCounty.metro === regionType && aCounty === bCounty);  })) //or border between nonmetro and outside
		.attr({
			"id": "highlightPath",
			"d": path
		});
		var regionInfo = _.find(allCountyInfo, function(d){return d.countyName == regionType;});
		displayCountyData(regionInfo);
	}
}

function toggleDisplay(displayType) {
	if (displayType == 'state') {
		document.getElementById('statewideOptions').disabled = false;
		document.getElementById('countyOptions').disabled = true;
		getSelectToggleRegion();
	}
	else { //displayType is county
		document.getElementById('statewideOptions').disabled = true;
		document.getElementById('countyOptions').disabled = false;
		getSelectToggleCounty();
	}
}

function displayCountyData(countyInfo){
	var margin = {top: 20, right: 20, bottom: 10, left: 30},
    thisWidth = 400 - margin.left - margin.right,
    thisHeight = 380 - margin.top - margin.bottom;

	var chartInfo = countyObj(countyInfo);
	
	d3.selectAll("svg#selectedChart>g").remove();

	d3.select("span.AIANgrad").text(function(d) {
		if(chartInfo['IAN_G']['2013'] > 0) {return Math.round(chartInfo['IAN_G']['2013'] / chartInfo['IAN_T']['2013'] * 100) + "%"}
		else {return ""};});
	d3.select("span.APIgrad").text(function(d) {
		if(chartInfo['API_G']['2013'] > 0) {return Math.round(chartInfo['API_G']['2013'] / chartInfo['API_T']['2013'] * 100) + "%"}
		else {return ""};});
	d3.select("span.Hgrad").text(function(d) {
		if(chartInfo['HIS_G']['2013'] > 0) {return Math.round(chartInfo['HIS_G']['2013'] / chartInfo['HIS_T']['2013'] * 100) + "%"}
		else {return ""};});
	d3.select("span.BLAgrad").text(function(d) {
		if(chartInfo['BLA_G']['2013'] > 0) {return Math.round(chartInfo['BLA_G']['2013'] / chartInfo['BLA_T']['2013'] * 100) + "%"}
		else {return ""};});
	d3.select("span.Wgrad").text(function(d) {
		if(chartInfo['WHI_G']['2013'] > 0) {return Math.round(chartInfo['WHI_G']['2013'] / chartInfo['WHI_T']['2013'] * 100) + "%"}
		else {return ""};});

	//code for the line chart starts here
	var x = d3.time.scale()
		.range([0, thisWidth])
		.domain(d3.extent(years));

	var y = d3.scale.linear()
		.range([thisHeight, 0])
		.domain([0, 100]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.tickValues(years)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var IANline = d3.svg.line()
		.defined(function(d) { return chartInfo.IAN_G[d.getFullYear()] != ""; })
		.x(function(d,i) {return x(years[i]);})
		.y(function(d) {if(chartInfo.IAN_G[d.getFullYear()] > 0) {return y(Math.round(chartInfo.IAN_G[d.getFullYear()] / chartInfo.IAN_T[d.getFullYear()] * 100, 2)); }
						else {return y(null)}})
		.interpolate("basis");

	var HISline = d3.svg.line()
		.defined(function(d) { return chartInfo.HIS_G[d.getFullYear()] != ""; })
		.x(function(d,i) {return x(years[i]);})
		.y(function(d) {if(chartInfo.HIS_G[d.getFullYear()] > 0) {return y(Math.round(chartInfo.HIS_G[d.getFullYear()] / chartInfo.HIS_T[d.getFullYear()] * 100, 2)); }
						else {return y(null)}})
		.interpolate("basis");

	var BLAline = d3.svg.line()
		.defined(function(d) { return chartInfo.BLA_G[d.getFullYear()] != ""; })
		.x(function(d,i) {return x(years[i]);})
		.y(function(d) {if(chartInfo.BLA_G[d.getFullYear()] > 0) {return y(Math.round(chartInfo.BLA_G[d.getFullYear()] / chartInfo.BLA_T[d.getFullYear()] * 100, 2)); }
						else {return y(null)}})
		.interpolate("basis");

	var APIline = d3.svg.line()
		.defined(function(d) { return chartInfo.API_G[d.getFullYear()] != ""; })
		.x(function(d,i) {return x(years[i]);})
		.y(function(d) {if(chartInfo.API_G[d.getFullYear()] > 0) {return y(Math.round(chartInfo.API_G[d.getFullYear()] / chartInfo.API_T[d.getFullYear()] * 100, 2)); }
						else {return y(null)}})
		.interpolate("basis");

	var WHIline = d3.svg.line()
		.defined(function(d) { return chartInfo.WHI_G[d.getFullYear()] != ""; })
		.x(function(d,i) {return x(years[i]);})
		.y(function(d) {if(chartInfo.WHI_G[d.getFullYear()] > 0) {return y(Math.round(chartInfo.WHI_G[d.getFullYear()] / chartInfo.WHI_T[d.getFullYear()] * 100, 2)); }
						else {return y(null)}})
		.interpolate("basis");

	var svg = d3.select("svg#selectedChart").append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	
	svg.append("path")
		.datum(years)
		.attr("class", "IANline")
		.attr("d", IANline);

	svg.append("path")
		.datum(years)
		.attr("class", "HISline")
		.attr("d", HISline);

	svg.append("path")
		.datum(years)
		.attr("class", "BLAline")
		.attr("d", BLAline);

	svg.append("path")
		.datum(years)
		.attr("class", "APIline")
		.attr("d", APIline);

	svg.append("path")
		.datum(years)
		.attr("class", "WHIline")
		.attr("d", WHIline);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + thisHeight + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
	}

window.setInterval(function(){
  if(document.getElementById('cycleToggle').checked){
	selectRandom();
  }
}, 10000);

function selectRandom(){
	var displayType = getRadioVal('displayOptions');

	if(displayType == 'state'){
		var newIdxState = getRandomInt(0, statewideOptionList.length-1);
		var toggledValueState = statewideOptionList[newIdxState].condensedName;
		document.getElementById('statewideOptions').value = toggledValueState;
		toggleRegion(toggledValueState);
		
	}
	else { //displayType == county
		var newIdxCounty = getRandomInt(0, allCountyInfo.length-1);
		var toggledCountyInfo = allCountyInfo[newIdxCounty];
		document.getElementById('countyOptions').value = toggledCountyInfo.countyName;
		toggleCounty(toggledCountyInfo);
	}
}

function getRadioVal (groupName){
	var radioElements = document.getElementsByName(groupName);
	for(var i = 0; i < radioElements.length; i++){
		if(radioElements[i].checked){
			return radioElements[i].value;
		}
	}
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resize() {
  /* Find the new window dimensions */
var width = parseInt(d3.select("#mapDiv").style("width")) - margin*2,
height = parseInt(d3.select("#mapDiv").style("height")) - margin*2;

/* Update the range of the scale with new width/height */
xScale.range([0, width]).nice(d3.time.year);
yScale.range([height, 0]).nice();

/* Update the axis with the new scale */
graph.select('.x.axis')
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

graph.select('.y.axis')
  .call(yAxis);

/* Force D3 to recalculate and update the line */
graph.selectAll('.line')
  .attr("d", line);
}

d3.select(window).on('resize', resize); 

