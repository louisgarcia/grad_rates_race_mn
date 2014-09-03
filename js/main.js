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
	{condensedName: 'all', friendlyName: 'State-wide'},
	{condensedName: 'metro', friendlyName: 'All Metropolitan Counties'},
	{condensedName: 'MinneapolisStPaulBloomingtonMNWI', friendlyName: 'Minneapolis-St. Paul-Bloomington MN-WI Metro Region'},
	{condensedName: 'StCloudMN', friendlyName: '    St. Cloud MN Metro Region'},
	{condensedName: 'MankatoNorthMankatoMN', friendlyName: '    Mankato-North Mankato MN Metro Region'},
	{condensedName: 'DuluthMNWI', friendlyName: '    Duluth MN-WI Metro Region'},
	{condensedName: 'FargoNDMN', friendlyName: '    Fargo ND-MN Metro Region'},
	{condensedName: 'RochesterMN', friendlyName: '    Rochester MN Metro Region'},
	{condensedName: 'LaCrosseOnalaskaWIMN', friendlyName: '    La Crosse-Onalaska WI-MN Metro Region'},
	{condensedName: 'GrandForksNDMN', friendlyName: '    Grand Forks ND-MN Metro Region'},
	{condensedName: 'nonmetro', friendlyName: 'All Non-Metropolitan Counties'}
];

var allCountyInfo = [];
var allRegionInfo = [];
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
		d3.csv("data/regionGradRates.csv", function(errorC, regionData){
			allRegionInfo=regionData;
			d3.csv("data/gradrates.csv", function(errorC, studentData){
				allCountyInfo = studentData;

				//build the county list in a separate variable so we can sort them easily
				//remove the last element, which is statewide
				var countyList = studentData.map(function(d){return d.countyName;}).slice(0, -1).sort();
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

	if (regionType == 'all'){
		d3.selectAll("svg#mapMain").append("path")
		.datum(topojson.mesh(countyJson, countyJson.objects.counties, function(a, b) { return a === b; }))
		.attr({
			"id": "highlightPath",
			"d": path
		});

		displayStateData();
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

		displayMetroOrRuralData(true);
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

		displayMetroOrRuralData(false);
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

		displayMetroRegionData(regionType);
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
		else {
			return _.find(statewideOptionList, function(d){ return d.condensedName == countyInfo.metro;}).friendlyName;
		}
	});

	//content.append("p").text("Ranks " + countyInfo.rank + "/87 for number of students who plan to go to college or beyond.");
	d3.select("span.AIANgrad").text(function(d) {
		if(chartInfo['AIAN']['Tot'] > 0) {return chartInfo['AIAN']['Grad'] + " " + Math.round(chartInfo['AIAN']['Grad'] / chartInfo['AIAN']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.APIgrad").text(function(d) {
		if(chartInfo['API']['Tot'] > 0) {return chartInfo['API']['Grad'] + " " + Math.round(chartInfo['API']['Grad'] / chartInfo['API']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Hgrad").text(function(d) {
		if(chartInfo['H']['Tot'] > 0) {return chartInfo['H']['Grad'] + " " + Math.round(chartInfo['H']['Grad'] / chartInfo['H']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.BLAgrad").text(function(d) {
		if(chartInfo['BLA']['Tot'] > 0) {return chartInfo['BLA']['Grad'] + " " + Math.round(chartInfo['BLA']['Grad'] / chartInfo['BLA']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Wgrad").text(function(d) {
		if(chartInfo['W']['Tot'] > 0) {return chartInfo['W']['Grad'] + " " + Math.round(chartInfo['W']['Grad'] / chartInfo['W']['Tot'] * 100) + "%"}
		else {return "0"};});

	d3.select("span.AIANdrop").text(function(d) {
		if(chartInfo['AIAN']['Tot'] > 0) {return chartInfo['AIAN']['Drop'] + " " + Math.round(chartInfo['AIAN']['Drop'] / chartInfo['AIAN']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.APIdrop").text(function(d) {
		if(chartInfo['API']['Tot'] > 0) {return chartInfo['API']['Drop'] + " " + Math.round(chartInfo['API']['Drop'] / chartInfo['API']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Hdrop").text(function(d) {
		if(chartInfo['H']['Tot'] > 0) {return chartInfo['H']['Drop'] + " " + Math.round(chartInfo['H']['Drop'] / chartInfo['H']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.BLAdrop").text(function(d) {
		if(chartInfo['BLA']['Tot'] > 0) {return chartInfo['BLA']['Drop'] + " " + Math.round(chartInfo['BLA']['Drop'] / chartInfo['BLA']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Wdrop").text(function(d) {
		if(chartInfo['W']['Tot'] > 0) {return chartInfo['W']['Drop'] + " " + Math.round(chartInfo['W']['Drop'] / chartInfo['W']['Tot'] * 100) + "%"}
		else {return "0"};});

	d3.select("span.AIANcont").text(function(d) {
		if(chartInfo['AIAN']['Tot'] > 0) {return chartInfo['AIAN']['Cont'] + " " + Math.round(chartInfo['AIAN']['Cont'] / chartInfo['AIAN']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.APIcont").text(function(d) {
		if(chartInfo['API']['Tot'] > 0) {return chartInfo['API']['Cont'] + " " + Math.round(chartInfo['API']['Cont'] / chartInfo['API']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Hcont").text(function(d) {
		if(chartInfo['H']['Tot'] > 0) {return chartInfo['H']['Cont'] + " " + Math.round(chartInfo['H']['Cont'] / chartInfo['H']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.BLAcont").text(function(d) {
		if(chartInfo['BLA']['Tot'] > 0) {return chartInfo['BLA']['Cont'] + " " + Math.round(chartInfo['BLA']['Cont'] / chartInfo['BLA']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Wcont").text(function(d) {
		if(chartInfo['W']['Tot'] > 0) {return chartInfo['W']['Cont'] + " " + Math.round(chartInfo['W']['Cont'] / chartInfo['W']['Tot'] * 100) + "%"}
		else {return "0"};});

	d3.select("span.AIANunk").text(function(d) {
		if(chartInfo['AIAN']['Tot'] > 0) {return chartInfo['AIAN']['Unk'] + " " + Math.round(chartInfo['AIAN']['Unk'] / chartInfo['AIAN']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.APIunk").text(function(d) {
		if(chartInfo['API']['Tot'] > 0) {return chartInfo['API']['Unk'] + " " + Math.round(chartInfo['API']['Unk'] / chartInfo['API']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Hunk").text(function(d) {
		if(chartInfo['H']['Tot'] > 0) {return chartInfo['H']['Unk'] + " " + Math.round(chartInfo['H']['Unk'] / chartInfo['H']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.BLAunk").text(function(d) {
		if(chartInfo['BLA']['Tot'] > 0) {return chartInfo['BLA']['Unk'] + " " + Math.round(chartInfo['BLA']['Unk'] / chartInfo['BLA']['Tot'] * 100) + "%"}
		else {return "0"};});
	d3.select("span.Wunk").text(function(d) {
		if(chartInfo['W']['Tot'] > 0) {return chartInfo['W']['Unk'] + " " + Math.round(chartInfo['W']['Unk'] / chartInfo['W']['Tot'] * 100) + "%"}
		else {return "0"};});

	}

function displayMetroRegionData(regionName){
	var longRegionName = _.find(statewideOptionList, function(d){ return d.condensedName == regionName;}).friendlyName;
	var regionData = _.find(allRegionInfo, function(d){ return d.regionName == regionName;});

	d3.select("div#selectedTitle>h2").remove();
	d3.selectAll("div#selectedContent>p").remove();
	d3.selectAll("svg#selectedChart>g").remove();

	d3.select("div#selectedTitle").append("h2").text(longRegionName);

	var content = d3.select("div#selectedContent");

	content.append("p").text("This region is ranked " + regionData.regionRank + "/8 for having " + Math.floor(regionData.collOrByond) + "% of students interested in going to college or beyond.");
}

function displayMetroOrRuralData(isMetro){
	var metroDataPct = Math.floor(_.find(allRegionInfo, function(d){if (d.regionName == 'Metro')  { return d;}}).collOrByond);
	var nonMetroDataPct = Math.floor(_.find(allRegionInfo, function(d){if (d.regionName == 'NonMetro')  { return d;}}).collOrByond);

	d3.select("div#selectedTitle>h2").remove();
	d3.selectAll("div#selectedContent>p").remove();
	d3.selectAll("svg#selectedChart>g").remove();

	d3.select("div#selectedTitle").append("h2").text(function(){return isMetro ? "All Metropolitan Regions" : "All Non-Metropolitan Regions";});
	var content = d3.select("div#selectedContent");
	content.append("p").text((isMetro ? "Metro" : "Non-Metro") + " regions had an average of " + (isMetro? metroDataPct : nonMetroDataPct)+ "% of students express interest in attending college or beyond.");

	var difference = isMetro? metroDataPct - nonMetroDataPct : nonMetroDataPct - metroDataPct;
	var compareWord = difference > 0 ? "more" : "less";
	difference = Math.abs(difference); //todo the same as
	content.append("p").text("This is " + difference + "% " + compareWord + " than " + (isMetro ? "non-metro" : "metro") + " regions.");
}

function displayStateData(){
	var stateInfo = _.find(allCountyInfo, function(d){return d.countyName == 'Statewide';});

	d3.select("div#selectedTitle>h2").remove();
	d3.selectAll("div#selectedContent>p").remove();
	d3.selectAll("svg#selectedChart>g").remove();

	d3.select("div#selectedTitle").append("h2").text("Minnesota");
	var content = d3.select("div#selectedContent");

	var avgStudents = d3.mean([stateInfo['pop-1998'], stateInfo['pop-2001'], stateInfo['pop-2004'], stateInfo['pop-2007'], stateInfo['pop-2010']]);
	var avgPct = d3.mean([stateInfo['collOrByond-1998'], stateInfo['collOrByond-2001'], stateInfo['collOrByond-2004'], stateInfo['collOrByond-2007'], stateInfo['collOrByond-2010']]);
	content.append("p").text("On average, " + Math.floor(avgStudents)+ " students were surveyed a year.");
	content.append("p").text("Of those students, on average " + Math.floor(avgPct) + "% planned to go to college or beyond.");
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