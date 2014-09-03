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
  var AIANArr = [];
  var APIArr = [];
  var BLAArr = [];
  var HArr = [];
  var WArr = [];
  
  for(var prop in countyInfo){
    if (typeof countyInfo[prop] === 'string'){
      if (prop == 'countyName'){
        outArr.countyName = countyInfo[prop];
      } 
      else if (prop == 'metro'){
        outArr.metro = countyInfo[prop];
      }
      else if (prop.substring(0,4) == 'AIAN'){
      	AIANArr[prop.substring(5)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,3) == 'API'){
      	APIArr[prop.substring(4)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,3) == 'BLA'){
      	BLAArr[prop.substring(4)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,1) == 'H'){
      	HArr[prop.substring(2)] = Number(countyInfo[prop]);
      }
      else if (prop.substring(0,1) == 'W'){
      	WArr[prop.substring(2)] = Number(countyInfo[prop]);
      }
    }
  }
  outArr.AIAN = AIANArr;
  outArr.API = APIArr;
  outArr.BLA = BLAArr;
  outArr.H = HArr;
  outArr.W = WArr;
  return outArr;   
} 

var statewideOptionList = [
	{condensedName: 'Statewide', friendlyName: 'Statewide'},
	{condensedName: 'metro', friendlyName: 'All Metropolitan Counties'},
	{condensedName: 'nonmetro', friendlyName: 'All Non-Metropolitan Counties'},
	{condensedName: 'MinneapolisStPaulBloomingtonMNWI', friendlyName: 'Minneapolis-St. Paul-Bloomington MN-WI Metro Region'},
	{condensedName: 'StCloudMN', friendlyName: '    St. Cloud MN Metro Region'},
	{condensedName: 'MankatoNorthMankatoMN', friendlyName: '    Mankato-North Mankato MN Metro Region'},
	{condensedName: 'DuluthMNWI', friendlyName: '    Duluth MN-WI Metro Region'},
	{condensedName: 'FargoNDMN', friendlyName: '    Fargo ND-MN Metro Region'},
	{condensedName: 'RochesterMN', friendlyName: '    Rochester MN Metro Region'},
	{condensedName: 'LaCrosseOnalaskaWIMN', friendlyName: '    La Crosse-Onalaska WI-MN Metro Region'},
	{condensedName: 'GrandForksNDMN', friendlyName: '    Grand Forks ND-MN Metro Region'}
	
];

var allCountyInfo = [];
var countyJson = {};

var parseDate = d3.time.format("%Y");
var years = ["2013"];
years = years.map(function(d){return parseDate.parse(d);});

var width = 400,height = 430;

//other functions use the projection/path for highlighting certain sections of the map
var projection = d3.geo.conicEqualArea()
	.center([1.5, 46.5])
	.rotate([95, 0])
	.parallels([29.5, 45.5])
	.scale(4000)
	.translate([width / 2, height / 2]);

var path = d3.geo.path()
	.projection(projection);

function loadData(){
	var svg = d3.selectAll("svg#mapMain")
		.attr("width", width)
		.attr("height", height);

	d3.json("data/mncounties.json", function(errorJ, mn) {
		countyJson=mn;
			d3.csv("data/gradrates.csv", function(errorC, studentData){
				allCountyInfo = studentData;

				//Wacky hack to remove the last 11 of the excel sheet which are region and statewide data
				var countyList = studentData.map(function(d){return d.countyName;}).slice(0, -11).sort();
				d3.select("select#countyOptions").selectAll('option').data(countyList).enter()
				.append("option").attr("value", function(d){return d;}).text(function(d){return d;});

				//build the metro area list
				d3.select("select#statewideOptions").selectAll('option').data(statewideOptionList).enter()
				.append("option").attr("value", function(d){return d.condensedName;}).text(function(d){return d.friendlyName;});

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

				getSelectToggleCounty();
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
	var margin = {top: 20, right: 20, bottom: 30, left: 78},
    thisWidth = 348 - margin.left - margin.right,
    thisHeight = 204 - margin.top - margin.bottom;

	var chartInfo = countyObj(countyInfo);
	d3.select("div#selectedTitle>h2").remove();
	d3.selectAll("div#selectedContent>p").remove();
	d3.selectAll("svg#selectedChart>g").remove();

	d3.select("div#selectedTitle").append("h2").text(countyInfo.countyName);
	var content = d3.select("div#selectedContent");

	content.append("p").text(function(d){
		if (countyInfo.metro === "") {
			return "Not classified as a metropolitan county.";
		}
		else if (countyInfo.metro === "Statewide") {
			return "Statewide Results";
		}
		else if (countyInfo.metro === "Region") {
			return "Region Results"
		}
		else {
			return _.find(statewideOptionList, function(d){ return d.condensedName == countyInfo.metro;}).friendlyName;
		}
	});

	//content.append("p").text("Ranks " + countyInfo.rank + "/87 for number of students who plan to go to college or beyond.");
	d3.select("span.AIANgrad").text(function(d) {
		if(chartInfo['AIAN']['Tot'] > 0) {return Math.round(chartInfo['AIAN']['Grad'] / chartInfo['AIAN']['Tot'] * 100) + "%"}
		else {return ""};});
	d3.select("span.APIgrad").text(function(d) {
		if(chartInfo['API']['Tot'] > 0) {return Math.round(chartInfo['API']['Grad'] / chartInfo['API']['Tot'] * 100) + "%"}
		else {return ""};});
	d3.select("span.Hgrad").text(function(d) {
		if(chartInfo['H']['Tot'] > 0) {return Math.round(chartInfo['H']['Grad'] / chartInfo['H']['Tot'] * 100) + "%"}
		else {return ""};});
	d3.select("span.BLAgrad").text(function(d) {
		if(chartInfo['BLA']['Tot'] > 0) {return Math.round(chartInfo['BLA']['Grad'] / chartInfo['BLA']['Tot'] * 100) + "%"}
		else {return ""};});
	d3.select("span.Wgrad").text(function(d) {
		if(chartInfo['W']['Tot'] > 0) {return Math.round(chartInfo['W']['Grad'] / chartInfo['W']['Tot'] * 100) + "%"}
		else {return ""};});
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