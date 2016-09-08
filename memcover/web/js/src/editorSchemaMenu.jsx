'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var ModalTrigger = BS.ModalTrigger;
var TabbedArea = BS.TabbedArea;
var Button = BS.Button;
var Modal = BS.Modal;
var Input = BS.Input;

var Context = require('context');
var context = new Context(window.location.hostname, 'ws', 19000);
var rpc = context.rpc;

var fileOptions = [];
rpc.call("TableSrv.show_data", [])
		.then(function(filelist){
			fileOptions = filelist;
		});
	
var selected = [];

module.exports = React.createClass({displayName: "exports",

	  	getDefaultProps: function() {
			return {
		    tables: {},
		    label: "Select files to open:",
		    bsStyle: "default"
			};
	  	},

	    render: function() {
		var self = this;

		var loadFileMenuData = this.loadFileMenuData; 
		var filesMenuServer = this.filesMenuServer;
		var onSaveSchema = this.props.onSaveSchema;		
		var propsSelectFile = this.props.propsSelectFile;
		var datasetName = this.props.datasetName;
		if(!datasetName || datasetName == null) datasetName = "Unknown";
		var selected = this.props.selected;
		var currentState = this.props.currentState;
		var tableName = Object.keys(this.props.currentState.tables)[0];
		var new_cols = this.props.currentState.tables[tableName].new_cols;
		var currentSchema = this.props.currentState.tables[tableName].schema;
		var currentAttributes = currentSchema.attributes;
		var currentOrder = currentSchema.order;
		console.log("CURRENTSTATE:", this.props.currentState);

		var attributeTypes = ["Categorical", "Quantitative", "Ordinal"];
		var changedSchema = currentSchema;
		var originalNames = {};
		var emptyNames = 0;

		var cardEditSchema = function(attr, j, color){
				return (
						//React.createElement("div", {className: "form-group", style:{margin: "0 auto"}},
						<div className="row" style={{"marginBottom": "5px"}}>
								<div className="form-group">
									<div class="btn btn-xs btn-default card-anchor card-move">
										<span className="icon glyphicon glyphicon-move"/>
									</div>
	            				</div>
								<div className="form-group" style={{"marginLeft":"10px"}}>
									<input className="form-control" type="text" id={attr} defaultValue={attr} style={{"width":"100%", "background":color}} onChange={function (ev){
												var oldName = ev.target.id; var newName = ev.target.value;
												if(newName in changedSchema.attributes){ alert("You can't rename two attributes with the same name"); return; }
												if(newName == "") emptyNames++; if(oldName == "") emptyNames--; 
												changedSchema.attributes[oldName].name = newName; changedSchema.attributes[newName] = changedSchema.attributes[oldName];
												delete changedSchema.attributes[oldName];													
												ev.target.id = newName;
												for(var key in changedSchema.order) if(changedSchema.order[key] === oldName) changedSchema.order[key] = newName;						
												for(var key in changedSchema.quantitative_attrs) if(changedSchema.quantitative_attrs[key] === oldName) changedSchema.quantitative_attrs[key] = newName;
												originalNames[attr] = newName;
											}
										}/>
								</div>
								<div className="form-group" style={{"marginLeft":"10px"}}>
									<select className="form-control" id={"sel"+i} style={{"width":"100%", "background": "#428bca", "color": "#fff"}} onChange={function (ev){
														changedSchema.attributes[originalNames[attr]].attribute_type = ev.target.value;
													}
												}>
													{attributeTypes.map(function(attrType, j){
															if(currentAttributes[attr].attribute_type.toLowerCase() == attrType.toLowerCase()) return ( <option selected="selected" value={attrType}> {attrType} </option> );
															else return ( <option value={attrType}> {attrType} </option> );
														}
													)}
									</select>
								</div>
						</div>
				)
		}
		selected = [];
		var sel1 = document.getElementsByTagName('select')[0];
		if(sel1 != null && sel1 != 'undefined'){
			for (var i=0, iLen=sel1.options.length; i<iLen; i++) if (sel1.options[i].selected) selected.push(sel1.options[i].value);
			if(selected.length == 1) datasetName = selected[0].split('.')[0];
			else datasetName = "combined";
		}

		return (

				<Modal {...this.props} bsSize="large" title="Edit schema" animation={true}>
					<div class="modal-body"> 
						<div style={{"position": "relative", "width": "40%", "margin": "0 auto", "marginBottom": "20px"}}>
							<label> Dataset </label>
							<Input type="text" id="tableName" defaultValue={datasetName} onChange={function (ev){
									datasetName = ev.target.value;
								}
							}/>
						</div>
						<div className="container">
						<form className="form-inline" role="form" style={{"position": "relative", "width": "50%", "margin": "0 auto", "marginBottom": "10px"}}>
							{currentOrder.map(function(attr, i){
									if(attr != "id_index"){
										originalNames[attr] = attr;
										if(new_cols.indexOf(attr) != -1) return( cardEditSchema(attr, i, "#FFF") )
										return(	cardEditSchema(attr, i, "#DDD") )
									}
								}
							)}
						</form>
						</div>
					</div>	
					<div className='modal-footer'>
						<Button onClick={this.props.onHide}> Cancel </Button>
						<Button onClick={function(ev) {
							console.log("OK", changedSchema);
							// Save the edited schema
							onSaveSchema(changedSchema, originalNames, datasetName);
							//currentState.tables[tableName].dataset_name = datasetName;

							if(emptyNames > 0){ alert("Empty attribute names not allowed"); return; }
							if (propsSelectFile) propsSelectFile.onHide();							
							self.props.onHide();
						}} bsStyle="primary"> OK </Button>
	      			</div>
				</Modal>
		)
	  }
	});
