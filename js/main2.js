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
		d3.csv("data/ruralPostSecondary-condensed.csv", function(errorC, countyData){
			//var countyExtent = d3.extent(countyData, function(d){return Number(d.rank);});
			var countyExtent = d3.extent(countyData, function(d){return Number(d.collOrByond) === 0 ? undefined : Number(d.collOrByond);});
			console.log(countyExtent);

			var colorScale = d3.scale.linear()
			.range(['#fff', '#005BCF'])
			.domain(countyExtent);

			svg.selectAll(".county")
			.data(topojson.feature(mn, mn.objects.counties).features).enter().append("path")
			.attr({
				d: path,
				id: function(d) {return d.properties.name;},
				stroke: '#000',
				fill: function(d) { return colorScale(Number(_.find(countyData, function(d2){return d2.countyName == d.properties.name;}).collOrByond));} //return colorScale(d.rank);}
			})
			.on('click', function(d){ console.log(d.properties.name + " - " + (_.find(countyData, function(d2){return d2.countyName == d.properties.name;}).collOrByond));});
		});
	});
}
