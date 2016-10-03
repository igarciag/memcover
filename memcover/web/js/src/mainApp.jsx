"use strict";

var React = require('react');
var _ = require('lodash');
var ReactGridLayout = require('react-grid-layout');

var Context = require('context');
//var saveAs = require('FileSaver');
var downloadSVG = require('download-svg');
window.ds = downloadSVG;

var reactify = require('./reactify');
var DataTable = require('./dataTable');
var DescriptionStats = require('./descriptionStats');
var BrainRegions = require('./brainRegions');
var CategoricalFilter = require('./categoricalFilter');
var RangeFilter = require('./rangeFilter');
var Card = require('./card');
var CardCreationMenu = require('./cardCreationMenu');
var AnalysisMenu = require('./analysisMenu');
var FileMenu = require('./fileMenu');
var SignInMenu = require('./signInMenu');

var PCPChart = reactify(require('./pcpChart'), "PCPChart");
var BoxChart = reactify(require('./boxChart'), "BoxChart");
var ScatterChart = reactify(require('./scatterChart'), "ScatterChart");
 var ParSetChart = reactify(require('./parsetChart'), "ParSetChart");

/**
 *  Bootstrap requires
 */
var BS = require('react-bootstrap');
var Navbar = BS.Navbar;
var Nav = BS.Nav;
var NavItem = BS.NavItem;
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var ModalTrigger = BS.ModalTrigger;
var Input = BS.Input;


var Store = {
    getSchema: function(tableName) {
	var rpc = Context.instance().rpc;

 	function getQuantitativeAttrs(schema) {
	    var attrs = _.pick(schema.attributes, function(value, key) {
		return value.attribute_type === "QUANTITATIVE" && ! value.shape.length;
	    });
	    return _(attrs).keys().sort().value();
	}

	var promise = rpc.call("TableSrv.schema", [tableName])
	    .then(function(schema) {
		console.log('***', schema);
		schema.attributes = _.mapValues(schema.attributes, function(v,k){v.name = k; return v;});
		schema.quantitative_attrs = getQuantitativeAttrs(schema);

		return schema;
	    })
	    .catch(function(e){console.error(e);});

	return promise;
    },

    getData: function(tableName) {
	var rpc = Context.instance().rpc;

	var promise = rpc.call("TableSrv.get_data", [tableName, "rows"])
	    .catch(function(e){console.error(e);});
	return promise;
    },

    isSelectionEmpty: function(selection) {
	var rpc = Context.instance().rpc;

	return rpc.call('DynSelectSrv.grammar_of_conditions', [selection])
	    .then(function (conditions) {
		if (conditions.length === 0) return true;
		if (_.any(conditions, {enabled: true})) return false;
		return true;
	    });
    },

    linkTableToSelection: function(table, selection, onChange) {
	var rpc = Context.instance().rpc;
	var hub = Context.instance().hub;

	hub.subscribe(selection + ':change', function(){
	    Store.isSelectionEmpty(selection)
		.then(function (empty) {
		    var view_args = {query: {}, projection: {}};
		    if (! empty) view_args = rpc.call('DynSelectSrv.view_args', [selection]);
		    return view_args;
		})
		.then(function(viewArgs){
		    console.log("viewArgs", viewArgs);
		    return rpc.call("TableSrv.find", [table, viewArgs.query, viewArgs.projection]);
		})
		.then(function(tableView){
		    return rpc.call("TableSrv.get_data", [tableView, "rows"])
			.then( onChange );
		})
		.catch(function(e){console.error(e);});
	});
    },

    /**
     * @param kind: "categorical", "range"
     * @return: condition
     */
    createCondition: function(selection, column, kind) {
	var rpc = Context.instance().rpc;

	var method = "DynSelectSrv.new_" + kind + "_condition"

	var promise = rpc.call(method, [selection, column])
		.catch(function(e){console.error(e);});

	return promise;
    },

    includeAll: function(condition) {
	var rpc = Context.instance().rpc;
	return rpc.call('ConditionSrv.include_all', [condition]);
    },

    getGrammar: function(condition) {
	var rpc = Context.instance().rpc;
	return rpc.call('ConditionSrv.grammar', [condition]);
    },

    /**
     * Will create a new subscription and call onChange with the grammar of the condition
     * @param: onChange(grammar)
     */
    linkCondition: function(condition, onChange) {
	var rpc = Context.instance().rpc;
	var hub = Context.instance().hub;

	hub.subscribe(condition + ':change', function(){
	    rpc.call('ConditionSrv.grammar', [condition])
		.then( onChange )
		.catch(function(e){console.error(e);});
	});

	return rpc.call('ConditionSrv.grammar', [condition]).then( onChange );
    },

    enableCondition: function(condition) {
	var rpc = Context.instance().rpc;
	return rpc.call('ConditionSrv.enable', [condition]);
    },

    disableCondition: function(condition) {
	var rpc = Context.instance().rpc;
	return rpc.call('ConditionSrv.disable', [condition]);
    },

    toggleCategory: function(condition, category) {
	var rpc = Context.instance().rpc;
	return rpc.call('ConditionSrv.toggle_category', [condition, category]);
    },

    setRange: function(condition, range) {
	var rpc = Context.instance().rpc;

	return rpc.call('ConditionSrv.set_range', [condition, range[0], range[1], false]);
    },

    getFacetedData: function(table, selection, attr, facetAttr) {
	var rpc = Context.instance().rpc;

	return Store.isSelectionEmpty(selection)
	    .then(function (empty) {
		var query = null;
		if (empty) query = {};
		else query = rpc.call('DynSelectSrv.query', [selection]);
		return query;
		})
	    .then(function (query) {
		query[attr] = {$type : 1}; // Only Number types, not NaN
		var aggregation = [{$match: query},
		    {$group: {_id: '$'+facetAttr,
			'list': {$push: '$'+attr},
			'max': {$max: '$'+attr},
			'min': {$min: '$'+attr}
		    }
		    },
		    {$project: {facetAttr: '$_id', _id: false, 'list':true, 'max':true, 'min':true}},
		    {$sort: {facetAttr: 1}}
		];
		//console.log(JSON.stringify(aggregation));
		return rpc.call('TableSrv.aggregate', [table, aggregation]);
	    })
	    .then(function (tableview) {return rpc.call('TableSrv.get_data', [tableview]);});
    },

    linkFacetedData: function(table, selection, attr, facetAttr, onChange) {
	var rpc = Context.instance().rpc;
	var hub = Context.instance().hub;

	hub.subscribe(selection + ':change', function(){
	    Store.getFacetedData(table, selection, attr, facetAttr)
		.then( onChange )
		.catch(function(e){console.error(e);});
	});

	Store.getFacetedData(table, selection, attr, facetAttr)
	    .then( onChange )
	    .catch(function(e){console.error(e);});
    },

    exportTable: function(table, fileName, excelCsv) {
	var rpc = Context.instance().rpc;

	if(!fileName || fileName == null) fileName = "joined";

	rpc.call("export_dselect", [table.selection, table.name, fileName, excelCsv])
	    .then(function(d){
		var uri = "http://" + window.location.host + window.location.pathname + d;
		window.open(uri, fileName+".json");
	    });
    },

	/*exportSchema: function(table, fileName, excelCsv) {
	var rpc = Context.instance().rpc;

	if(!fileName || fileName == null) fileName = "joined";

	rpc.call("export_schema", [table.schema, fileName])
	    .then(function(d){
		var uri = "http://" + window.location.host + window.location.pathname + d;
		window.open(uri, fileName);
	    });
    },*/

    describeStats: function(table, selection, attribute) {
	var rpc = Context.instance().rpc;

	return rpc.call("describe_stats", [selection, table, attribute]);
    },


    linkStats: function(table, selection, attr, onChange) {
	var rpc = Context.instance().rpc;
	var hub = Context.instance().hub;

	hub.subscribe(selection + ':change', function(){
	    Store.describeStats(table, selection, attr)
		.then( onChange )
		.catch(function(e){console.error(e);});
	});

	Store.describeStats(table, selection, attr)
	    .then( onChange )
	    .catch(function(e){console.error(e);});
    },
};


module.exports = React.createClass({
    getInitialState: function() {
	var layout = [
//	    {x:2, y: 0, w: 5, h: 6, i:"c0", handle:".card-title"},
	];

	var cards = {
// 	    "c0": {key:"c0", kind:"scatter", title: "Avg Cells/Vol NISSL (mm3) vs Time Postmortem (hours)", config:{}}
	};

	var tables = {};
	//tables[this.props.morphoTable] = {name: this.props.morphoTable, data: [], schema: {attributes:{}}, selection: this.props.morphoSelection};
	//tables[this.props.clinicTable] = {name: this.props.clinicTable, data: [], schema: {attributes:{}}, selection: this.props.clinicSelection};
	tables[this.props.joinedTable] = {name: this.props.joinedTable, data: [], schema: {attributes:{}}, selection: this.props.joinedSelection};


	var conditions = {};
	var subscriptions = {};
//     - Conditions: {table: {conditionSet: {condition: {subscription: <>,  name: condition } } }
//     - Selections: {table: {conditionSet: {subscription: <>, name: condition } } }
//     - TableSubscriptions: {table: {subscription: <>, name: condition } }

// -------  To load saved state:
//	var savedState = require('./savedState');
//	return JSON.parse(savedState);

	return {
	    "tables": tables,
	    "conditions": conditions,
	    "layout": layout,
	    "cards": cards,
	    "subscriptions": subscriptions,
		"username": "",
		"logged": false
	};
    },

    putState: function(path, v) {
	var newState = _.set(this.state, path, v);
	this.setState(newState);
    },

    componentDidMount: function() {
	var self = this;

	_.forEach(this.state.tables, function(table){
	    Store.linkTableToSelection(table.name, table.selection, function(rows) {
		self.state.tables[table.name].data = rows;
		self.state.subscriptions[table.name] = true;
		self.setState({"tables": self.state.tables});
	    });

	    Store.getSchema(table.name).then(function(schema){
		self.state.tables[table.name].schema = schema;
		self.setState({"tables": self.state.tables});
	    });

	    Store.getData(table.name).then(function(rows){
		self.state.tables[table.name].data = rows;
		self.setState({"tables": self.state.tables});
	    });

	});

    },

	importData: function(ev) {
				var self = this;
				var when = require("when");
				var rpc = Context.instance().rpc;

				var files = ev.target.files;
				
				var accept_data_ext = ['csv','xls','xlsx','xlsm','xlt'];
				
				// Check file (or files) selected
				for (var i = 0; i < files.length; i++) {
					var file_ext = files[i].name.split('.');
					var file_ext = file_ext[file_ext.length - 1];
					/*if ( accept_data_ext.indexOf(file_ext) == -1 ) {
						alert("El fichero '"+file.name+"' no esta en el formato correcto\n\nAccepted file extensions: "+accept_data_ext.join()+"\n");
					}*/
			
					var f = files[i];

					var reader = new FileReader();
					//ev.target.value = ""; // So same file rise onChange

					reader.onload = (function(theFile) {
						return function (e) {
							var ext = theFile.name.split('.')[theFile.name.split('.').length - 1];
							var res = this.result;

							if( ext == 'xls' || ext == 'xlsx' ){
								var wb = XLSX.read(res, {type: 'binary'});
								var ws = wb.Sheets[wb.SheetNames[0]]
								res = XLSX.utils.sheet_to_csv(ws);
							}

							var ret = rpc.call("TableSrv.import_file", [res, theFile.name])
							.then(function(resp){ if(resp != "OK" && resp != "") alert(resp); else cb(); });
							
							function cb() {
								//var resp = confirm("Imported file '"+theFile.name+"'\n\nDo you want to import the associated schema (.json)?\n");
								/*if(!resp) return;
								alert("Schema importado\n");*/
							}
					};
					})(f);
					reader.readAsBinaryString(f);
				}
	    },

		importSchema: function(ev) {			
				var self = this;
				var when = require("when");
				var rpc = Context.instance().rpc;

				var files = ev.target.files;
				
				var accept_schema_ext = ['json'];
				
				var f = files[0];

				var reader = new FileReader();
				//ev.target.value = ""; // So same file rise onChange

				reader.onload = (function(theFile) {
					return function (e) {
						var res = this.result;
						var ret = rpc.call("TableSrv.import_file", [res, theFile.name])
						.then(function(resp){ if(resp != "OK" && resp != "") alert(resp);});
					};
				})(f);
				reader.readAsBinaryString(f);
	    },
			
		loadData: function(sel, selSchema, op, fileOptionsAll) {

			var self = this;
			var when =  __webpack_require__(/*! when */ 5);
			var rpc = Context.instance().rpc;

			var tableName = Object.keys(self.state.tables)[0];
			var selected = "";

			if(!self.state.tables[tableName].dataset_name || self.state.tables[tableName].dataset_name == null){
				if(sel.length == 1) self.state.tables[tableName].dataset_name = sel[0].split('.')[0];
				else self.state.tables[tableName].dataset_name = "combined";
			}
			//rpc.call("TableSrv.show_data", [])
			//.then(function(filelist){
				//alert("SELECT A FILE:\n\n"+filelist.join("\n")+"\n");
					
				/*
				// Carga de datos segun Lobby
				var tableName = "mainTable";
				var filePath = "/app/data/joined_changed.csv";
				var schemaPath = "/app/data/joined_changed_schema.json";

				return rpc.call("IOSrv.read_csv", [tableName, filePath, schemaPath]).then(function (table) {
          console.log("TABLE:", table);
					return rpc.call("TableSrv.schema", [table]);
        }).then(function(sch){
					console.log("SCH:", sch);

					self.state.tables.joined.schema = sch;
								self.state.tables.joined.schema.attributes = _.mapValues(self.state.tables.joined.schema.attributes, function(v,k){v.name = k; return v;});
								self.state.tables.joined.schema.quantitative_attrs = getQuantitativeAttrs(sch);

					Store.getData(tableName).then(function(rows){
							console.log("ROWS:", rows);
							self.state.tables.joined.data = rows;
							self.setState({"tables": self.state.tables});
						})
				});*/

			var cols_old = Object.keys(self.state.tables[tableName].schema.attributes);

			function getQuantitativeAttrs(schema) {
	    		var attrs = _.pick(schema.attributes, function(value, key) {
					return value.attribute_type === "QUANTITATIVE" && ! value.shape.length;
				    });
	    		return _(attrs).keys().sort().value();
			}
			sel.map(function(selected, i){
				var associatedJson = false;				
				if(selSchema.indexOf(selected.split('.')[0]+"_schema.json") != -1) associatedJson = true; //Hay _schema.json asociado

				if(associatedJson == true) console.log("Schema loaded by '"+selected.split('.')[0]+"_schema.json'");
				else console.log("Schema infered");

				// Load new data and schema if necessary
				rpc.call("TableSrv.load_data_server", [selected, tableName, op, cols_old, associatedJson]) // This function returns the infer schema
					.then(function(resp){
							if( resp[0] !== "OK" ){
								alert("UPLOAD DATA CANCELED\n\n"+resp[1]+"\n");
								return;
							}
							var sch = resp[1];
							var new_cols = Object.keys(resp[2]);

							self.state.tables[tableName].schema = sch;
							self.state.tables[tableName].schema.attributes = _.mapValues(self.state.tables[tableName].schema.attributes, function(v,k){v.name = k; return v;});
							self.state.tables[tableName].schema.quantitative_attrs = getQuantitativeAttrs(sch);

							self.state.tables[tableName].new_cols = new_cols;
					});
					op = false; //Only open the first file (and add the others)
		});

		// Update new data in the state
		Store.getData(tableName).then(function(rows){
			self.state.tables[tableName].data = rows;
			self.setState({"tables": self.state.tables});
		});

		// Update conditions (filters)
		rpc.call("ConditionSrv.update_conditions", [])
			.then( function(condition){
				for (var cond in condition) {
					Store.includeAll(cond).then(Store.linkCondition.bind(self,cond));
				}
			});

		var selection = self.state.tables[tableName].selection;
		if ( self.state.conditions[tableName] != undefined && self.state.conditions[tableName][selection] != undefined){
			rpc.call("ConditionSrv.update_conditions2", [self.state.conditions[tableName][selection]])
				.then( function(conditions){
					self.state.conditions[tableName][selection] = conditions;
					self.setState({"conditions": self.state.conditions});
				});
		}
			
		//Remove cards with "old" columns
		var cols_new = Object.keys(self.state.tables[tableName].schema.attributes);
		var diff1 = cols_old.filter(function(x) { return cols_new.indexOf(x) < 0 });
							
		for (var card in self.state.cards){
			if( self.state.cards[card].kind == 'pcp' || self.state.cards[card].kind == 'table'){
				for (var col in self.state.cards[card].config.columns){
					if( self.state.cards[card].config.columns[col].included === true && diff1.indexOf(self.state.cards[card].config.columns[col].name) != -1 ){
						self.removeCard(card);
						break;
					}
				}
			}
			else if( self.state.cards[card].kind == 'scatter' ) {
				if ( diff1.indexOf(self.state.cards[card].config.xColumn) != -1 || diff1.indexOf(self.state.cards[card].config.yColumn) != -1 ) self.removeCard(card);
			}
			else if( self.state.cards[card].kind == 'box' ) {
				if ( diff1.indexOf(self.state.cards[card].config.attr) != -1 || diff1.indexOf(self.state.cards[card].config.facetAttr) != -1 ) self.removeCard(card);
			}
			else if( self.state.cards[card].kind == 'categoricalFilter' || self.state.cards[card].kind == 'rangeFilter' ) {
				if ( diff1.indexOf(self.state.cards[card].config.attr) != -1 || diff1.indexOf(self.state.cards[card].config.facetAttr) != -1 ) self.removeCard(card);
			}
		}
			//alert("Opened file '"+selected+"'");
		//});
		return "OK"
	},

	saveSchema: function(newSchema, originalNames, datasetName) {
		var self = this;
		var when = require("when");
		var rpc = Context.instance().rpc;

		var tableName = Object.keys(self.state.tables)[0];

		console.log("Saved dataset_name '"+datasetName+"'");
		self.state.tables[tableName].dataset_name = datasetName;
			
		self.state.tables[tableName].schema = newSchema;

		rpc.call("TableSrv.save_schema", [tableName, newSchema, originalNames, datasetName]); // This function returns the infer schema

		Store.getData(tableName).then(function(rows){
			self.state.tables[tableName].data = rows;
			self.setState({"tables": self.state.tables});
		});
	},

	saveData: function(dataset_name, data, schema) {
		var self = this;
		var when = require("when");
		var rpc = Context.instance().rpc;

		var tableName = Object.keys(self.state.tables)[0];

		rpc.call("TableSrv.show_data", [])
			.then(function(filelist){
				for(var i=0; i<filelist.length; i++) filelist[i] = filelist[i].split('.')[0]
				if(filelist.indexOf(dataset_name) != -1){ 
					var resp = confirm("There's a file named '"+dataset_name+"'\nDo you want to overwrite the data file?\n");
					if(!resp) return;
				}
				
				rpc.call("TableSrv.save_data", [tableName, dataset_name, data, schema])
					.then(function(resp){
							if(resp == "OK") alert("Files '"+dataset_name+".csv' and '"+dataset_name+"_schema.json' saved\n");
							else alert("Error saving dataset '"+dataset_name+"'\n"+resp+"\n");
						}
					);
			});
	},

	saveImage: function(ev) {
		var self = this;
		var when = require("when");
		var rpc = Context.instance().rpc;

		var files = ev.target.files;
			
		console.log("SAAAVE IMAGEEE");
			
		// Check file (or files) selected
		var f = files[0];
		var reader = new FileReader();

		reader.onload = (function(theFile) {
			return function (e) {
				var ext = theFile.name.split('.')[theFile.name.split('.').length - 1];
				var res = this.result;
				console.log("RES:", res);
				var ret = rpc.call("TableSrv.save_image", [res, theFile.name])
				.then(function(resp){ if(resp != "OK" && resp != "") alert(resp); /*else cb();*/ });
				
				/*function cb() {

				}*/
			};
		})(f);
		reader.readAsDataURL(f);
	},

	exportDataLocal: function(state) {
		var when =  require("when");
		var rpc = Context.instance().rpc;

		var stateToSave = _.clone(state);
		stateToSave.subscriptions = {};

		rpc.call("GrammarSrv.new_root", ['root'])
			.then(function(){ return when.map(_.pluck(stateToSave.tables, "selection"), function(dselect) {
			return rpc.call("DynSelectSrv.get_conditions", [dselect])
				.then(function(conditions){ rpc.call("GrammarSrv.add_condition", ['root', conditions]);})
				.then(function(){ rpc.call("GrammarSrv.add_dynamic", ['root', dselect]);});
			});})
			.then(function(){ return rpc.call("GrammarSrv.grammar", ['root']);})
			.then(function(grammar){
			var analysis = {state: stateToSave, grammar: grammar};
			var blob = new Blob([JSON.stringify(analysis)], {type: "text/plain;charset=utf-8"});
			var date = new Date();
			saveAs(blob, "analysis_"+ date.toJSON() +".json");
			})
			.done(function() { rpc.call("GrammarSrv.del_root", ['root']);});
    },

	exportSchema: function() {
		var when =  require("when");
		var rpc = Context.instance().rpc;

		var tableName = Object.keys(this.state.tables)[0];
		var schema = this.state.tables[tableName].schema;
		var fileName = "joined";
		if(this.state.tables[tableName].dataset_name && this.state.tables[tableName].dataset_name != null) fileName = this.state.tables[tableName].dataset_name;

		var schemaToSave = {index: schema.index, attributes: schema.attributes, order: schema.order};

		var blob = new Blob([JSON.stringify(schemaToSave)], {type: "text/plain;charset=utf-8"});
		saveAs(blob, fileName+"_schema.json");

		/*var stateToSave = _.clone(schema);
		schemaToSave.subscriptions = {};

		rpc.call("GrammarSrv.new_root", ['root'])
			.then(function(){ return when.map(_.pluck(schemaToSave.tables, "selection"), function(dselect) {
			return rpc.call("DynSelectSrv.get_conditions", [dselect])
				.then(function(conditions){ rpc.call("GrammarSrv.add_condition", ['root', conditions]);})
				.then(function(){ rpc.call("GrammarSrv.add_dynamic", ['root', dselect]);});
			});})
			.then(function(){ return rpc.call("GrammarSrv.grammar", ['root']);})
			.then(function(grammar){
			var blob = new Blob([JSON.stringify(schemaToSave)], {type: "text/plain;charset=utf-8"});
			var date = new Date();
			saveAs(blob, "analysis_"+ date.toJSON() +".json");
			})
			.done(function() { rpc.call("GrammarSrv.del_root", ['root']);});*/
    },

    loadAnalysis: function(ev) {
		var self = this;
		var when =  require("when");
		var rpc = Context.instance().rpc;

		var files = ev.target.files;
		var reader = new FileReader();
		reader.readAsText(files[0]);
		ev.target.value = ""; // So same file rise onChange

		reader.onload = function() {
			var analysis = JSON.parse(this.result);
			var grammar = analysis.grammar;
			var state = analysis.state;

			var tables = _.pluck(state.tables, "name");
			var tableName = Object.keys(analysis.state.tables)[0];
			var table = analysis.state.tables[tableName];		

			rpc.call("DynSelectSrv.clear", [])
			.then(function(){return rpc.call("GrammarSrv.build", [grammar, tables]); })
			.done(function(){ self.setState(state); });

			rpc.call("TableSrv.set_data", [tableName, table]);
		};
    },

    saveAnalysis: function(state) {
		var when =  require("when");
		var rpc = Context.instance().rpc;

		var stateToSave = _.clone(state);
		stateToSave.subscriptions = {};

		rpc.call("GrammarSrv.new_root", ['root'])
			.then(function(){ return when.map(_.pluck(stateToSave.tables, "selection"), function(dselect) {
			return rpc.call("DynSelectSrv.get_conditions", [dselect])
				.then(function(conditions){ rpc.call("GrammarSrv.add_condition", ['root', conditions]);})
				.then(function(){ rpc.call("GrammarSrv.add_dynamic", ['root', dselect]);});
			});})
			.then(function(){ return rpc.call("GrammarSrv.grammar", ['root']);})
			.then(function(grammar){
			var analysis = {state: stateToSave, grammar: grammar};
			var blob = new Blob([JSON.stringify(analysis)], {type: "text/plain;charset=utf-8"});
			var date = new Date();
			saveAs(blob, "analysis_"+ date.toJSON() +".json");
			})
			.done(function() { rpc.call("GrammarSrv.del_root", ['root']);});
    },

    addCard: function(card) {
	
	var Y = Math.max(0, _.max(this.state.layout, 'y')) + 1;

	var key = null;
	if (this.state.layout.length === 0) key = "c0";
	else key = "c" + (parseInt(_.rest(_.last(this.state.layout).i)) + 1);

	card.key = key;
	this.state.layout.push({x:0, y: Y, w: 6, h: 6, i:key, handle:".card-anchor"});
	this.state.cards[key] = card;
	this.setState({layout:this.state.layout, cards: this.state.cards});

    },

    removeCard: function(key) {
	var cards = _.omit(this.state.cards, key);
	var layout = _.reject(this.state.layout, {i: key});

	this.setState({layout:layout, cards: cards});
    },

    initCondition: function(kind, table, selection, column) {
	var condition = _.get(this.state, ["conditions", table, selection, column, "name"]);

	var self = this;
	var linkCondition = function(condition) {
	    if ( self.state.subscriptions[condition] ) return;
	    Store.linkCondition( condition, function(grammar) {
		self.state.subscriptions[condition] = true;
		self.putState(
		    ["conditions", table, selection, column],
		    {name: condition, grammar: grammar});
		console.log("GRAMMAR: ", grammar);
	    });
	};

	if (condition) {
	    console.log("Don't create a new condition. Already created");
	    Store.enableCondition(condition).done(function(){ linkCondition(condition) });
	    return;
	}
	console.log("Creating a new condition:", kind, table, selection);

	Store.createCondition(selection, column, kind)
	    .then(function(condition) {
		if (kind === "categorical") Store.includeAll(condition).then(linkCondition.bind(self,condition));
		else linkCondition(condition);
	    });
    },

    renderRegionsCard: function(card, size) {
	console.log("RENDER REGIONS..........");
	var initRegions = this.initCondition.bind(this, "categorical", this.props.joinedTable, this.props.joinedSelection, "Region");

	var conditionPath = ["conditions", this.props.joinedTable, this.props.joinedSelection, "Region"];
	var condition = _.get(this.state, conditionPath.concat(["name"]));
	var disableCondition = Store.disableCondition.bind(this, condition);

	var component = (<BrainRegions {...size}
			     onMount={initRegions}
			     onUnmount={disableCondition}
			     includedRegions={_.get(this.state, conditionPath.concat(["grammar", "included_categories"]), [])}
			     onClickRegion={Store.toggleCategory.bind(this, condition)}>
	</BrainRegions>);

	return component;
    },

    renderCategroricalFilterCard: function(card, size) {
	var table = card.config.table;
	var column = card.config.column;
	var selection = this.state.tables[table].selection;

	var initCondition = this.initCondition.bind(this, "categorical", table, selection, column);

	var conditionPath = ["conditions", table, selection, column];
	var condition = _.get(this.state, conditionPath.concat(["name"]));
	var disableCondition = Store.disableCondition.bind(this, condition);

	var included = _.get(this.state, conditionPath.concat(["grammar", "included_categories"]));
	var excluded = _.get(this.state, conditionPath.concat(["grammar", "excluded_categories"]));
	var categories = [];
	_.reduce(included, function(acc, category) {
	    acc.push({name: category, included: true});
	    return acc;
	}, categories);
	_.reduce(excluded, function(acc, category) {
	    acc.push({name: category, included: false});
	    return acc;
	}, categories);
	categories = _.sortBy(categories, "name");

	var component = (<CategoricalFilter {...size}
				 onMount={initCondition}
				 onUnmount={disableCondition}
				 categories={categories}
				 onClickedCategory={Store.toggleCategory.bind(this, condition)} />);
	return component;
    },



    renderRangeFilterCard: function(card, size) {
	var table = card.config.table;
	var column = card.config.column;
	var selection = this.state.tables[table].selection;

	var initCondition = this.initCondition.bind(this, "range", table, selection, column);

	var conditionPath = ["conditions", table, selection, column];
	var condition = _.get(this.state, conditionPath.concat(["name"]));
	var disableCondition = Store.disableCondition.bind(this, condition);

	var domain = _.get(this.state, conditionPath.concat(["grammar", "domain"])) || {min:0, max:1};
	var range = _.get(this.state, conditionPath.concat(["grammar", "range"])) || domain;
	var extent = [ range['min'], range['max'] ];

	var component = (<RangeFilter {...size}
				 onMount={initCondition}
				 onUnmount={disableCondition}
				 domain={domain}
				 extent={extent}
				 onChange={Store.setRange.bind(this, condition)} />);
	return component;
    },

    renderStatsCard: function(card, size) {
	var table = card.config.table;
	var selection = this.state.tables[table].selection;
	var attr = card.config.attr;
	var subscription = table+attr+"stats";

	var description = _.get(this.state.cards[card.key], "description", {});
	var saveData = function(description) {
	    if (! this.state.subscriptions[subscription]) return;
	    this.putState( ["cards", card.key, "description"], description );
	};
	// FIXME: Now is impossible to unsubscribe
	//   when unmounting because there is no
	//   subscription-tokens, only callbacks
	var linkData = function() {
	    if (! this.state.subscriptions[subscription]) {
		this.putState(["subscriptions", subscription], true);
		return Store.linkStats(table, selection, attr, saveData.bind(this));
	    }
	};
	var unlinkData = function() {
	    this.putState(["subscriptions", subscription], false);
	    this.putState("subscriptions", this.state.subscriptions);
	};

	console.log("DESCRIPTION:", description);
	var orderStats = ["mean", "std", "min", "max", "count", "25%", "50%", "75%"];
	var sortedDescription = {};
	for(var i=0; i<orderStats.length; i++) sortedDescription[orderStats[i]] = description[orderStats[i]];
	var component = (<DescriptionStats {...size} description={sortedDescription} attr={attr}
			     onMount={linkData.bind(this)}
			     onUnmount={unlinkData.bind(this)}/>);

	return component;

    },

    render: function(){
	var self = this;

	console.log("**** mainApp.state OnRender: ---> ", this.state);
	var contentWidth = document.getElementById('content').offsetWidth - 20;
	var rowHeight = 50;

	var layout = this.state.layout;
	var cards = _.values(this.state.cards);

	var computeWidth = function (key) {
	    var width = _.result(_.find(layout, {i: key}), "w");
	    return (contentWidth/12) * width - 20;
	};
	var computeHeight = function (key) {
	    var height = _.result(_.find(layout, {i: key}), "h");
	    return rowHeight * height - 40;
	};

	var tables = _.keys(self.state.tables);
	var columns = _.mapValues(self.state.tables, function(table){
	    return _.map(table.schema.attributes,
		function(value, key){return {name: key, included: true};}
	    );
	});

	/*var columns = _.mapValues(self.state.tables, function(table){
	    return _.map(table.schema.attributes, function(v, key){return {name: v.name, attribute_type: v.attribute_type};});
	});*/
	var columns = _.mapValues(self.state.tables, function(table){
	    return _.map(table.schema.order, function(v, key){ return {name: v, attribute_type: table.schema.attributes[v].attribute_type};});
	});
	var quantitativeColumns = _.mapValues(columns, function(tableColumns){
	    return _.filter(tableColumns, {attribute_type: "QUANTITATIVE"});
	});
	var categoricalColumns = _.mapValues(columns, function(tableColumns){
	    return _.filter(tableColumns, function(v, key) {return v.attribute_type === "CATEGORICAL" || v.attribute_type === "ORDINAL"});
	});

	var creationVisMenuTabs = [
	    { kind: "pcp", title: "Parallel Coordinates Plot", options: { tables: tables, columns: columns } },
		{ kind: "parset", title: "Parallel Set", options: { tables: tables, categoricalColumns: categoricalColumns, quantitativeColumns: quantitativeColumns} },
	    { kind: "scatter", title: "Scatter Plot", options: { tables: tables, columns: quantitativeColumns } },
	    { kind: "box", title: "Box Plot", options: { tables: tables, categoricalColumns: categoricalColumns, quantitativeColumns: quantitativeColumns } },
	    { kind: "table", title: "Data Table", options: { tables: tables, columns: columns } },
	    { kind: "stats", title: "Statistics", options: { tables: tables, columns: quantitativeColumns } },
		//{ kind: "image", title: "Image", options: { tables: tables, columns: columns } }
	];

	var creationFilterMenuTabs = [
	    { kind: "regions", title: "Regions", options: {}},
	    { kind: "columnFilter", title: "Columns Filter", options: { tables: tables, columns: columns } },
	];

	return (
	    <div className="mainApp">

			<Navbar brand='Memcover' fixedTop>
				
				<SignInMenu className="navbar-btn pull-right"
					tables={this.state.tables}
					currentState={self.state}
					>
				</SignInMenu>

				<ModalTrigger modal={<CardCreationMenu tabs={creationVisMenuTabs} onCreateCard={this.addCard} onSaveImage={self.saveImage}/>}>
					<Button className="navbar-btn pull-right" bsStyle="primary" style={ {"margin-right":40} }>
						<Glyphicon glyph='plus' /> Visualization
					</Button>
				</ModalTrigger>

				<ModalTrigger modal={<CardCreationMenu tabs={creationFilterMenuTabs} onCreateCard={this.addCard}/>}>
					<Button className="navbar-btn pull-right" bsStyle="primary" style={ {"margin-right":10} }>
						<Glyphicon glyph='plus' /> Filter
					</Button>
				</ModalTrigger>

				<AnalysisMenu className="navbar-btn pull-right"
					style={ {"margin-right":10} }
					tables={this.state.tables}
					onExport={function(table){Store.exportTable(table, table.name, true);}}
					onOpen={self.loadAnalysis}
					onSave={self.saveAnalysis.bind(self, self.state)}
					>
				</AnalysisMenu>
						
				<FileMenu className="navbar-btn pull-right"
					style={ {"margin-right":10} }
					tables={this.state.tables}
					onExportCsv={function(table){Store.exportTable(table, table.dataset_name, false);}}
					onExportExcel={function(table){Store.exportTable(table, table.dataset_name, true);}}
					onExportSchema={self.exportSchema.bind(self)}
					onLoadData={self.loadData}
					onImportData={self.importData}
					onImportSchema={self.importSchema}
					onSaveSchema={self.saveSchema}
					onSaveData={self.saveData}
					onExportData={self.exportDataLocal.bind(self, self.state)}
					currentState={self.state}
					>
				</FileMenu>
			</Navbar>

	      <ReactGridLayout className="layout"
		      layout={layout}
		      cols={12}
		      rowHeight={rowHeight}
		      useCSSTransforms={true}
		      onLayoutChange={function(layout){self.setState({"layout":layout});}}
		      onResizeStop={function(layout, oldL, l, _, ev){/* console.log(ev);*/}}
		      >
		{

		    /*
		     * Render all the cards
		     */
			
		 cards.map(function(card){
		     var component = null;
		     var menuActions = null;
		     var size = {width: computeWidth(card.key), height: computeHeight(card.key)};

		     switch (card.kind) {
			 case "pcp":
			 case "scatter":
			 case "image":
			 case "box":
			     menuActions = [{label: "Save", icon: "save",
				 action: function(){ downloadSVG(this.getDOMNode().getElementsByTagName("svg")[0]); }}];
			     //	 {label: "Edit", icon: "pencil", action: function(){}}
		     }

		     switch (card.kind) {
			 case "table":
			     // var columnNames = _.keys(self.state.schema.attributes);
			     var columnNames = _.pluck(_.filter(card.config.columns, 'included'), 'name');
			     component = (<DataTable {...size} {...card.config}
				 rows={self.state.tables[card.config.table].data} columnNames={columnNames}/>);
			     break;
			case "image":
			 	//component=(<img src={card.attr}/>);
			 	component=(<div> <label> {card.config.filename} </label> <img src={card.config.src} {...size}/> </div>);
			 	break;
			case "pcp":
			    var columnNames = _.pluck(_.filter(card.config.columns, 'included'), 'name');
			    var attributes = _.map(columnNames, function(c){
                	return self.state.tables[card.config.table].schema.attributes[c];});
				var allColumnNames = _.pluck(card.config.columns, 'name');

				console.log("self.state.cards[card.key].config.active_color:", self.state.cards[card.key].config);
			    component = <PCPChart {...size}
				data={self.state.tables[card.config.table].data}
				margin={{top: 50, right: 40, bottom: 10, left: 40}}
				attributes={attributes}
				active_color={self.state.cards[card.key].config.active_color}
				index={self.state.tables[card.config.table].schema.index}
				onBrush={function(extent) {/*console.log(extent);*/ }}
				onAttributeSort={ function(attributes){
				    var columns = _.map(attributes, function(attr){return {name: attr.name, included: true};});
				    self.putState( ["cards", card.key, "config", "columns"], columns );}
				}
				>
			    </PCPChart>;

			    break;
			case "scatter":
			     var data = [];
			     // Filter NaNs
			     _.reduce(self.state.tables[card.config.table].data, function(acc, row) {
				 if ( _.isNumber(row[card.config.xColumn]) && _.isNumber(row[card.config.yColumn]) ) {
				     if(row['Patient'] == undefined || row['Patient'] == null) acc.push({index: row[self.state.tables[card.config.table].schema.index], x: row[card.config.xColumn], y: row[card.config.yColumn], patient: "Unknown patient"});
				     else acc.push({index: row[self.state.tables[card.config.table].schema.index], x: row[card.config.xColumn], y: row[card.config.yColumn], patient: row['Patient']});
					 
				 }
				 return acc;
			     }, data);

			     component = <ScatterChart {...size} {...card.config} data={data}/>;
			     break;
			 case "parset":
			     var attributes = _.pluck(_.filter(card.config.dimensions, 'included'), 'name');

			     component = (<ParSetChart {...size}
				 data={self.state.tables[card.config.table].data}
				 margin={{top: 20, right: 40, bottom: 10, left: 40}}
				 attributes={attributes}
				 value={card.config.value}
				 onAttributesSort={ function(attributes){} }
				 >
			     </ParSetChart>);
			     break;
			 case "regions":
			     component = self.renderRegionsCard(card, size);
			     break;
			 case "categoricalFilter":
			     component =  self.renderCategroricalFilterCard(card, size);
			     break;
			 case "rangeFilter":
			     component =  self.renderRangeFilterCard(card, _.set(size, "height", 45));
			     break;
			 case "box":
			     var table = card.config.table;
			     var selection = self.state.tables[table].selection;
			     var attr = card.config.attr;
			     var facetAttr = card.config.facetAttr;
			     var subscription = table+attr+facetAttr;

			     var distributions = _.get(self.state.cards[card.key], "data", []);
			     var saveData = function(data) {
				 if (! self.state.subscriptions[table+attr+facetAttr]) return;
				 self.putState( ["cards", card.key, "data"], [data] );
			     };
			     // FIXME: Now is impossible to unsubscribe
			     //   when unmounting because there is no
			     //   subscription-tokens, only callbacks
			     var linkData = function() {
				 if (! self.state.subscriptions[table+attr+facetAttr]) {
				     self.putState(["subscriptions", subscription], true);
				     return Store.linkFacetedData(table, selection, attr, facetAttr, saveData);
				 }
			     };
			     var unlinkData = function() {
				 self.putState(["subscriptions", subscription], false);
				 self.putState("subscriptions", self.state.subscriptions);
			     };


			     var margin = {top: 20, right: 10, bottom: 20, left: 80};
			     component = (<BoxChart {...size} margin={margin} distributions={distributions}
						  onMount={linkData}
						  onUnmount={unlinkData}/>);
			     break;
			 case "stats":
			     size = _.set(size, "height", size.height - 17);
			     size = _.set(size, "width", size.width - 17);
			     component = self.renderStatsCard(card, size);
		     }

		     return (
			 <div key={card.key}>
			   <Card key={card.key} onClose={self.removeCard.bind(self, card.key)}
			        title={card.title} size={size} menuActions={menuActions} columns={columnNames} allColumns={allColumnNames} state={self.state} cardId={card.key} parent={self}>
			     	{component}
			   </Card>
			 </div>
		     );
		 })
		 }

	      </ReactGridLayout>
	    </div>
	);
    }
});
