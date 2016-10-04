'use strict'

var React = require('react');
var _ = require('lodash');

var BS = require('react-bootstrap');
var Button = BS.Button;
var Glyphicon = BS.Glyphicon;
var Button = BS.Button;
var Modal = BS.Modal;
var Input = BS.Input;

var WidthProvider = require('react-grid-layout').WidthProvider;
var ResponsiveReactGridLayout = require('react-grid-layout').Responsive;

/**
 * This layout demonstrates how to use a grid with a dynamic number of elements.
 */
var AddRemoveLayout = React.createClass({

  getDefaultProps() {
    return {
      className: "layout",
      cols: {lg: 1, md: 1, sm: 1, xs: 1, xxs: 1},
      rowHeight: 45,
	  margin: [0,7]
    };
  },

  getInitialState() {
return {
      newCounter: 0,
	  originalNames: {}
    };
  },

  /*onAddItem() {
    this.setState({
      items: this.state.items.concat({
        i: 'n' + this.state.newCounter,
        x: 0,
        y: this.state.items.length, // puts it at the bottom
        w: 1,
        h: 1
      }),
      newCounter: this.state.newCounter + 1
    });
  },*/

  // We're using the cols coming back from this to calculate where to add new items.
  onBreakpointChange(breakpoint, cols) {
    this.setState({
      breakpoint: breakpoint,
      cols: cols
    });
  },

  onLayoutChange(layout) {
    this.setState({layout: layout});
  },

  onRemoveItem(i) {
    this.setState({items: _.reject(this.state.items, {i: i})});
	var tableName = Object.keys(this.props.currentState.tables)[0];
	var currentOrder = this.props.currentState.tables[tableName].schema.order;
	if (currentOrder.indexOf(i) > -1) {
		currentOrder.splice(currentOrder.indexOf(i), 1);
	}
  },

	onChangeState(ord) {
    	return (
			ord.map(function(name, i, list) {
				return {i: name, x: 0, y: i, w: 1, h: 1};
			})
		)
	},

	orderFromLayout(layout) {
    	return _.chain(layout)
    	.map( (l) => { return {y: l.y, attr: l.i} })
        .sortBy('y')
        .pluck('attr')
        .value();
    },

	render() {
	  	var self = this;

		var loadFileMenuData = this.loadFileMenuData; 
		var filesMenuServer = this.filesMenuServer;
		var onSaveSchema = this.props.onSaveSchema;		
		var propsSelectFile = this.props.propsSelectFile;
		var selected = this.props.selected;
		var currentState = this.props.currentState;
		var tableName = Object.keys(this.props.currentState.tables)[0];
		var datasetName = this.props.currentState.tables[tableName].dataset_name;
		if(!datasetName || datasetName == null) datasetName = "Unknown";
		var new_cols = this.props.currentState.tables[tableName].new_cols;
		var currentSchema = this.props.currentState.tables[tableName].schema;
		var currentAttributes = currentSchema.attributes;
		var currentOrder = currentSchema.order;
		var index = currentOrder.indexOf("id_index");
		if(index != -1) currentOrder.splice(index, 1); // Delete "id_index" attribute from schema order

		var attributeTypes = ["Categorical", "Quantitative", "Ordinal"];
		var changedSchema = currentSchema;
		
		this.state.items = this.onChangeState(currentOrder);

		var fixedColumns = ["Patient", "Region"]; //Columns that aren't recommended to modify
		var fixedColumnsCurrent = [];

		function createElement(el) {
			var attr = el.i;
			var color1 = new_cols.indexOf(attr) != -1 ? "#CCCCCC" : "#A5A5A5";
			var color2 = new_cols.indexOf(attr) != -1 ? "#DDDDDD" : "#B5B5B5";
			return (
					<div key={attr} id={attr} data-grid={el} style={{"display":"inline-block", "width":"100%", "height":"38px", "background": color1, "border": "1px solid", "borderRadius": "8px", "borderColor": "#888"}}>
						<form className="form-horizontal" style={{"marginTop": "3px", "width":"100%", "borderRadius": "4px", "background": color2}}>
							<div className="form-group" style={{"verticalAlign":"middle"}}>
								<div className="btn btn-xs btn-default" aria-hidden="true">
									<span className="icon glyphicon glyphicon-move"/>
								</div>
								<div className="btn btn-xs btn-default" aria-hidden="true" onClick={function(ev){ self.onRemoveItem(attr); delete self.state.originalNames[attr]; delete changedSchema.attributes[attr]; if(changedSchema.order.indexOf(attr) > -1) changedSchema.order.splice(changedSchema.order.indexOf(attr), 1);; console.log("changedSchema", changedSchema); }}>
										<span className="icon glyphicon glyphicon-remove"/>
								</div>
								<input type="text" id={attr} old={attr} defaultValue={attr} style={{"border":"1px solid #CCCCCC", "width":"50%", "min-width":"20%", "height":"30px", "marginLeft":"5%"}} onChange={function (ev){
											var oldName = ev.target.old; var newName = ev.target.value;
											ev.target.old = newName;
											if(fixedColumns.indexOf(attr) != -1){
												ev.target.style.border = "3px solid #FF0000";
												if(fixedColumnsCurrent.indexOf(attr) == -1) fixedColumnsCurrent.push(attr);
												document.getElementById("warningFixedColumns").style.display = "inline";
												document.getElementById("warningFixedColumns").innerHTML = "Is not recommended to rename the attributes '" + fixedColumnsCurrent.join("', '") + "'. If you rename these attributes, is probably that the tool doesn't work correctly";												
											}
											if(newName == attr){
												ev.target.style.border = "1px solid #CCCCCC";
												if(fixedColumnsCurrent.indexOf(attr) != -1){
													fixedColumnsCurrent.splice(fixedColumnsCurrent.indexOf(attr), 1);
													if(fixedColumnsCurrent.length == 0) document.getElementById("warningFixedColumns").style.display = "none";
													else document.getElementById("warningFixedColumns").innerHTML = "Is not recommended to rename the attributes '" + fixedColumnsCurrent.join("', '") + "'. If you rename these attributes, is probably that the tool doesn't work correctly";
												}
											}
											/*changedSchema.attributes[oldName].name = newName; changedSchema.attributes[newName] = changedSchema.attributes[oldName];
											delete changedSchema.attributes[oldName];													
											ev.target.id = newName;
											for(var key in changedSchema.order) if(changedSchema.order[key] === oldName) changedSchema.order[key] = newName;						
											for(var key in changedSchema.quantitative_attrs) if(changedSchema.quantitative_attrs[key] === oldName) changedSchema.quantitative_attrs[key] = newName;
											el.i = newName;*/
										self.state.originalNames[attr] = newName;
										}
									}/>
								<select id={"sel"+attr} style={{"background": "#428bca", "color": "#FFF", "width":"25%", "height":"30px", "marginLeft":"2%", "borderRadius": "4px"}} onChange={function (ev){
											currentAttributes[attr].attribute_type = ev.target.value;
										}
									}>
										{attributeTypes.map(function(attrType, j){
												if(currentAttributes[attr].attribute_type.toLowerCase() == attrType.toLowerCase()) return ( <option value={attrType} selected> {attrType} </option> );
												else return ( <option value={attrType}> {attrType} </option> );
											}
										)}
								</select>
							</div>
						</form>
					</div>
			);
		}

		//if(currentAttributes.length > 0) {
			var selectAnyFile = true;
			var contentMenu = (
					<div>
						<div style={{"position": "relative", "width": "40%", "margin": "0 auto", "marginBottom": "20px"}}>
							<label> Dataset name: </label>
							<Input type="text" defaultValue={datasetName} onChange={function (ev){ datasetName = ev.target.value; }}/>
						</div>
						<div style={{"position": "relative", "width": "65%", "margin": "0 auto", "marginBottom": "20px", /*maxHeight: calcHeight+"px", overflowX: "hidden", overflowY: "scroll"*/}}>
							<ResponsiveReactGridLayout onBreakpointChange={this.onBreakpointChange} isResizable={false} onLayoutChange={(newLayout) => {
									console.log("onLayoutChange", newLayout);
									self.setState({layout: newLayout});
									let newOrder = self.orderFromLayout(newLayout);
									if (! _.isEqual(currentOrder, newOrder)) changedSchema.order = newOrder; // Avoids infinite recursion
								}}
								{...this.props}>
									{_.map(this.state.items, createElement)}
							</ResponsiveReactGridLayout>
							<span id="warningFixedColumns" style={{"display":"none", "color":"#FF0000"}}>It is not recommended to rename attributes</span>		
						</div>	
					</div>	
				);
		/*} else {
			var selectAnyFile = false;
			var contentMenu = (
					<div>
						<h4> Please, select some files to open data </h4>
					</div>
			);
		}*/

		var calcHeight = screen.height * 0.6;
		return (
				<Modal {...this.props} bsSize="large" title="Edit schema" animation={true}>
					<div className="modal-body">
						{contentMenu}
					</div>	
					<div className='modal-footer'>
						<Button onClick={this.props.onHide}> Cancel </Button>
						<Button onClick={function(ev) {
							var copyChangedSchema = JSON.parse(JSON.stringify(changedSchema));
							for(var key in self.state.originalNames){ //key is the old name, self.state.originalNames[key] is the new name
								if(self.state.originalNames[key] == ""){ alert("Empty attribute names not allowed"); changedSchema = copyChangedSchema; return; }
								if(changedSchema.order.indexOf(self.state.originalNames[key]) > -1){ alert("You can't rename two attributes with the same name\nInvolved attribute: '"+self.state.originalNames[key]+"'"); changedSchema = copyChangedSchema; return; }								
								console.log("Replace '"+key+"' by '"+self.state.originalNames[key]+"'");
								changedSchema.attributes[key].name = self.state.originalNames[key];
								changedSchema.attributes[self.state.originalNames[key]] = changedSchema.attributes[key];
								delete changedSchema.attributes[key];
								var index = changedSchema.order.indexOf(key);
								if(index > -1) changedSchema.order[index] = self.state.originalNames[key];
								index = changedSchema.quantitative_attrs.indexOf(key);
								if(index > -1) changedSchema.quantitative_attrs[index] = self.state.originalNames[key];
							}
							
							// Update order with new names (from original names)
							for(var h=0; h<changedSchema.order.length; h++){
								var nameAttr = self.state.originalNames[changedSchema.order[h]];
								if(nameAttr != null) changedSchema.order[h] = nameAttr;
							}

							// Save the edited schema
							onSaveSchema(changedSchema, self.state.originalNames, datasetName);

							if (propsSelectFile && selectAnyFile) propsSelectFile.onHide();							
							self.props.onHide();
						}} bsStyle="primary"> OK </Button>
	      			</div>
				</Modal>
		);
	}
});

module.exports = AddRemoveLayout;