var c3 = require('c3');
var _ = require('lodash');

module.exports = {
    createChart: function(container, props, state){},
    cleanChart: function(container, props, state){},
    update: function(container, nextProps, nextState){

	console.log("nextProps:", nextProps);
	function getInfoByIndex(index) { return _.filter(nextProps.data, function(obj){ return index == obj.index }); }

	var chart = c3.generate({
	    bindto: container,
	    size: {
		height: nextProps.height,
		width: nextProps.width
	    },
	    tooltip: {
		  contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
		      //return JSON.stringify(d);
			  var info = getInfoByIndex(d[0].index)[0];
			  var result = {};
			  result[nextProps.xColumn] = info.x;
			  result[nextProps.yColumn] = info.y;
			  if(info.patient != null) return '<font size="1"><table> <tr> <th bgcolor="#2E8B57" colspan="2" style="border:1px solid #CCCCCC; text-align: center; padding:2px;"><font color="#FFFFFF">Patient - '+info.patient+'</font></th> </tr> <tr> <td bgcolor="#DDDDDD" style="border:1px solid #CCCCCC; padding:2px;">'+nextProps.xColumn+'</td> <td style="border:1px solid #CCCCCC; padding:2px;"><b>'+info.x+'</b></td> </tr> <tr> <td bgcolor="#DDDDDD" style="border:1px solid #CCCCCC; padding:2px;">'+nextProps.yColumn+'</td> <td style="border:1px solid #CCCCCC; padding:2px;"><b>'+info.y+'</b></td> </tr></table></font>';
			  else return '<font size="1"><table> <td bgcolor="#DDDDDD" style="border:1px solid #CCCCCC; padding:2px;">'+nextProps.xColumn+'</td> <td style="border:1px solid #CCCCCC; padding:2px;"><b>'+info.x+'</b></td> </tr> <tr> <td bgcolor="#DDDDDD" style="border:1px solid #CCCCCC; padding:2px;">'+nextProps.yColumn+'</td> <td style="border:1px solid #CCCCCC; padding:2px;"><b>'+info.y+'</b></td> </tr></table></font>';
			}
	    },
	    data: {
			type: "scatter",
			json: nextProps.data,
			keys: {x: 'x', value:['y']},
			names: {x: nextProps.xColumn, y: nextProps.yColumn}
	    },
	    axis: {
		x: {
		    label: nextProps.xColumn,
		    tick: {fit: false}
		},
		y: {
		    label: nextProps.yColumn
		}
	    }
	});

	// This fixes a download-svg problem
	var svg = container.getElementsByTagName("svg")[0];
	svg.classList.add("scatter", "plot", "c3");
    }
};

