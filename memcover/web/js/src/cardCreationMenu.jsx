'use strict'

var React = require('react');
var _ = require('lodash');

/**
 *  Bootstrap requires
 */
var BS = require('react-bootstrap');
var Button = BS.Button;
var Modal = BS.Modal;
var TabbedArea = BS.TabbedArea;
var TabPane = BS.TabPane;
var Input = BS.Input;
var Col = BS.Col;

var CardCreationMenu = React.createClass({
    getInitialState: function() {

	return {
	    activeTab: this.props.tabs[0].kind
	};
    },

    handleCreateCard: function() {

	var config = this.refs[this.state.activeTab].getConfig();	
	var card = {kind:this.state.activeTab, title: config.table, config: config};

	switch (this.state.activeTab) {
	    // Nothing special for: ["table", "pcp", "regions"]
	    case "scatter":
		card.title = _.capitalize(config.xColumn) + " VS " + _.capitalize(config.yColumn);
		break;
	    case "columnFilter":
		card.title = _.capitalize(config.column); // + " - " + config.table;
		card.kind = (config.attribute_type === "QUANTITATIVE") ? "rangeFilter" : "categoricalFilter";
		break;
	    case "parset":
		card.title = _.capitalize(config.value);
		break;
	    case "box":
		card.title = _.capitalize(config.attr) + " split by: " + config.facetAttr;
		break;
	    case "stats":
		card.title = _.capitalize(config.attr);
		break;
		case "image":
		card.title = _.capitalize(config.attr);
		break;
	}

	this.props.onRequestHide();
	this.props.onCreateCard(card);
    },

    handleSelectTab: function(activeTab) {
	this.setState({activeTab: activeTab});
    },

    render: function(){
	var tabs = this.props.tabs;
	var onSaveImage = this.props.onSaveImage;


	return (
	    <Modal {...this.props} bsSize="large" title="Add new card" animation={true}>
	      <div className='modal-body'>
		
		<TabbedArea activeKey={this.state.activeTab} onSelect={this.handleSelectTab}>
		  {
		      tabs.map(function(tab) {
			  var tabNode = null;
			  switch (tab.kind) {
			      case "table":
			      case "pcp":
				  tabNode = <DataTableMenu ref={tab.kind} options={tab.options}/>;
				  break;
			      case "scatter":
				  tabNode = <ScatterMenu ref={tab.kind} options={tab.options}/>;
				  break;
			      case "parset":
				  tabNode = <ParSetMenu ref={tab.kind} options={tab.options}/>;
				  break;
			      case "regions":
				  tabNode = <RegionsMenu ref={tab.kind} options={tab.options}/>;
				  break;
				  case "image":
				  tabNode = <ImageMenu ref={tab.kind} options={tab.options} onSaveImage={onSaveImage}/>;
				  break;
			      case "columnFilter":
				  tabNode = <ColumnFilterMenu ref={tab.kind} options={tab.options}/>;
				  break;
			      case "box":
				  tabNode = <BoxMenu ref={tab.kind} options={tab.options}/>;
				  break;
			      case "stats":
				  tabNode = <StatsMenu ref={tab.kind} options={tab.options}/>;
			  }
			  return (
			      <TabPane eventKey={tab.kind} tab={tab.title}>
				{tabNode}
			      </TabPane>			  
			  );
		      })
		  }
		</TabbedArea>
		
	      </div>
	      <div className='modal-footer'>
		<Button onClick={this.props.onRequestHide}>Close</Button>
		<Button onClick={this.handleCreateCard} id="idCreateCard" bsStyle="primary">Create Card</Button>
	      </div>
	    </Modal>
	);
    }
});

module.exports = CardCreationMenu;

/**
 * Shows a table selection only when props.tables has more than one item
 */
var TableMenuItem = React.createClass({
    render: function() {
	if (this.props.tables.length > 1) {
	    return (
		<Input type="select" label="Data Table" ref="table" valueLink={this.props.tableLink}>
	        {
		    this.props.tables.map(function(table, i){
			return (<option  key={"table" + i} value={table}> {table} </option>);
		    })
		 }
              </Input>
	    )
	}
	else {
	    return (<div></div>);
	}
    }
});


var CheckboxColumnsMenuItem = React.createClass({

    getInitialState: function() {
	return { columns: this.props.columns };
    },

    handleCheck: function(column_i, checked) {
	var state = _.set(this.state, ["columns", column_i, "included"], checked);
	this.setState(state);
	this.props.onChange && this.props.onChange(state.columns);
    },

    handleMultiCheck: function(checked) {
	var columns = this.state.columns;
	columns = _.map(columns, function(column) {column.included = checked; return column;});
	var state = _.set(this.state, ["columns"], columns);
	this.setState(state);
	this.props.onChange && this.props.onChange(state.columns);
    },

    render: function() {
	var columns = this.state.columns;
	var handleCheck = this.handleCheck;
	var handleMultiCheck = this.handleMultiCheck;
	return (
            <div style={ {position: "relative"} }>
	      <label> {this.props.label} </label>
	      <BS.ButtonGroup style={ {position: "absolute", right: "0px", top: "-11px"} }>
                <Button onClick={function(){handleMultiCheck(true)}}> Select All </Button>
                <Button onClick={function(){handleMultiCheck(false)}}> Unselect All </Button>
	      </BS.ButtonGroup>
              <div className="row">
		<div className="col-md-12 three-col">
		  {
		      columns.map(function(column, i){
			  return (
			      <Input type='checkbox' ref={"col" + i}  key={"col" + column.name}
			      label={column.name} onChange={function(ev) {handleCheck(i, ev.target.checked)}} checked={column.included}/>
			  );
		      })
		   }
		</div>
              </div>
	    </div>
	);

    }
});




var RadioColumnsMenuItem = React.createClass({
    render: function() {
	
	return (
		  <form>
		    <div>
		      <label> {this.props.label} </label>
		    </div>
		    <div className="radio">
		      {
			  this.props.columns.map(function(column, i){
			      return (
				  <label className="radio"> 
				  <input type='radio' name="columns" ref={"col" + i}  key={"col" + column.name}
				  defaultChecked={column.included} />
				  {column.name}
				  </label>
			      );
			  })
		       }
		    </div>
		  </form>

	)}    
});


var DummyMenu = React.createClass({
    getConfig: function() { return {};},
    render: function() { return (<span></span>);}
});

var RegionsMenu = React.createClass({
    getConfig: function() { return {};},
    render: function() { return ( 
	<div style={{"text-align": "center"}}>
	  <img height="200px" style={{margin: "20px auto 0 auto"}}  src="assets/hipo_foto.svg"/>
	</div>
    );}
});

function getFiles(dir){
	/*var fs = new ActiveXObject("Scripting.FileSystemObject"); 
	var fileList = [];
	
	var files = fs.readdirSync(dir);
	for(var i in files){
		if (!files.hasOwnProperty(i)) continue;
		var name = dir+'/'+files[i];
		if (!fs.statSync(name).isDirectory()){
			fileList.push(name);
		}
	}
	return fileList;*/
	return ["hipo_foto.svg", "image1.jpg", "image2.jpg", "image3.jpg", "hipo_foto.svg", "image1.jpg", "image2.jpg", "image3.jpg"]
}

var ImageMenu = React.createClass({
    getConfig: function() { return {src: this.state.src, filename: this.state.filename}; },
    saveImageMenuData: function(){
		React.findDOMNode(this.refs.saveImageData).click();
    },
	eventFire: function(el, etype){
		if (el.fireEvent) {
			el.fireEvent('on' + etype);
		} else {
			var evObj = document.createEvent('Events');
			evObj.initEvent(etype, true, false);
			el.dispatchEvent(evObj);
		}
	},
    render: function() {
		var saveImageMenuData = this.saveImageMenuData;
		var onSaveImage = this.props.onSaveImage;
		
		var oldId;
		var self = this;
		var size = "120px";
		var idImages = 0;
		return ( 
			<div style={{"text-align": "center"}}>
				{
					getFiles("assets/images").map(function(filename, i){
						var srcFile = "assets/images/"+filename;
						idImages = i;
						return(
							<img height={size} style={{margin: "20px auto 0 auto", padding:"5px"}} src={srcFile} id={"img"+i} onClick={function(ev){
								var newEl = document.getElementById(ev.target.id);
								var oldEl = document.getElementById(oldId);
								if(oldEl) oldEl.style.border = '0px';
								newEl.style.border = '5px solid #2E64FE';
								oldId = ev.target.id;
								self.state={src: srcFile, filename: filename};
								}}/>
						); 
					})
				}

				<label className="btn btn-primary btn-file" onSelect={saveImageMenuData} style={{marginLeft: "5px", marginBottom: "5px", verticalAlign: "bottom"}}>
					<span className="glyphicon glyphicon-folder-open"></span> <span style={{marginLeft: "3px"}}> Select local image </span>
					<input type="file" id="imgInput" accept="image/png, image/jpeg, image/gif" style={{"display": "none"}} ref="saveImageData" onChange={function(ev){ 
						//onSaveImage(ev);
						var f = ev.target.files[0];
						var reader = new FileReader();
						reader.onload = (function(theFile) {
							return function (e) {
								var ext = theFile.name.split('.')[theFile.name.split('.').length - 1];
								var res = this.result;

								self.state={src: res, filename: theFile.name};
								self.eventFire(document.getElementById('idCreateCard'), 'click'); //Launch onClick event of "Create Card" button
							};
						})(f);
						reader.readAsDataURL(f);
					}}/>
				</label>

				

			</div>
    	);}
});

var DataTableMenu = React.createClass({

    // options: { 
    //     tables:["morpho", "clinic"],
    //     columns:[
    // 	     {name: "col1", included: true}, 
    // 	     {name: "col2", included: false}
    //     ]
    // }
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	return {
	    table: this.props.options.tables[0],
	    columns: this.props.options.columns,
	    all_columns: this.props.options.columns,
		active_color: "darkred"
	};
    },

    getConfig: function() {
	var self = this;
//	var columns = this.props.options.columns[ this.state.table ].map(
//	    function(column, i){return {name: column.name, included: self.refs["col"+i].getChecked()};})
	var columns = this.state.columns[this.state.table];
	var selectedColumns = _.pluck(_.filter(columns, 'included'), 'name');
	return {
	    table: this.state.table,
	    columns: columns,
	    all_columns: columns,
		history_columns: selectedColumns,
		active_color: "darkred"
	};
    },

    handleCheck: function(table, columns) {
	var state = _.set(this.state, ["columns", table], columns);
	console.log("COOOOOOOLUMNS:", columns);	
	this.setState(state);
    },

    render: function() {
	var options = this.props.options;
	var columns = this.state.columns[this.state.table];
	var handleCheck = this.handleCheck.bind(this, this.state.table);
	
	if(columns.length <= 1){
		alert("Please, open a data file\n");
		return {};
	}

	return (
        <div>
			<form>
				<TableMenuItem tableLink={this.linkState('table')} tables={options.tables}> </TableMenuItem>

				<CheckboxColumnsMenuItem label={"Columns"} columns={columns} onChange={handleCheck}> </CheckboxColumnsMenuItem>
			</form>
	    </div>
	);

    }
});



var ScatterMenu = React.createClass({

    // options: { 
    //     tables:["morpho", "clinic"],
    //     attributes:[
    // 	     {name: "attr1", attribute_type: "QUANTITATIVE", included: true}, 
    //     ]
    // }
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	var table = this.props.table || this.props.options.tables[0];
	
	if(Object.keys(this.props.options.columns[table]).length <= 1){
		alert("Please, open a data file\n");
		return {};
	}

	return {
	    table: table,
	    xColumn: this.props.xColumn || this.props.options.columns[table][0].name,
	    yColumn: this.props.yColumn || this.props.options.columns[table][0].name,
	};
    },

    getConfig: function() {
	return {
	    table: this.state.table,
	    xColumn: this.state.xColumn,
	    yColumn: this.state.yColumn,
	};
    },

    handleTableChange: function(table) {
	this.setState({
	    table: table,
	    xColumn: this.props.options.columns[table][0].name,
	    yColumn: this.props.options.columns[table][0].name,
	});
    },

    render: function() {
	var options = this.props.options;
	var columns = options.columns[this.state.table];
	var tableLink = {
	    value: this.state.table,
	    requestChange: this.handleTableChange
	};

	return (
            <div>
              <form>
 		<TableMenuItem tableLink={tableLink} tables={options.tables} /> 
	      </form>

	      <Input type='select' label='X Coordinate' ref="x" valueLink={this.linkState('xColumn')} >
	      {
		  columns.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

	      <Input type='select' label='Y Coordinate' ref="y" valueLink={this.linkState('yColumn')}>
	      {
		  columns.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

            </div>
	);

    }
});


var ColumnFilterMenu = React.createClass({

    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	var table = this.props.table || this.props.options.tables[0];
	return {
	    table: table,
	    column: this.props.column || this.props.options.columns[table][0].name,
	};
    },

    getConfig: function() {
	var attribute_type = _.find(this.props.options.columns[this.state.table], {name: this.state.column}).attribute_type;
	return {
	    table: this.state.table,
	    column: this.state.column,
	    attribute_type: attribute_type
	};
    },

    handleTableChange: function(table) {
	this.setState({
	    table: table,
	    column: this.props.options.columns[table][0].name,
	});
    },

    render: function() {
	var options = this.props.options;
	var columns = options.columns[this.state.table];
	var tableLink = {
	    value: this.state.table,
	    requestChange: this.handleTableChange
	};

	return (
            <div>
              <form>
 		<TableMenuItem tableLink={tableLink} tables={options.tables} /> 
	      </form>

	      <Input type='select' label='Column' ref="col" valueLink={this.linkState('column')} >
	      {
		  columns.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

            </div>
	);

    }
});


var BoxMenu = React.createClass({

    // options: { 
    //     tables:["morpho", "clinic"],
    //     attributes:[
    // 	     {name: "attr1", attribute_type: "QUANTITATIVE", included: true}, 
    //     ]
    // }
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	var table = this.props.table || this.props.options.tables[0];
	return {
	    table: table,
	    attr: this.props.attr || this.props.options.quantitativeColumns[table][0].name,
	    facetAttr: this.props.facetAttr || this.props.options.categoricalColumns[table][0].name,
	};
    },

    getConfig: function() {
	return {
	    table: this.state.table,
	    attr: this.state.attr,
	    facetAttr: this.state.facetAttr,
	};
    },

    handleTableChange: function(table) {
	this.setState({
	    table: table,
	    attr: this.props.options.quantitativeColumns[table][0].name,
	    facetAttr: this.props.options.categoricalColumns[table][0].name,
	});
    },

    render: function() {
	var options = this.props.options;
	var attrs = options.quantitativeColumns[this.state.table];
	var facetAttrs = options.categoricalColumns[this.state.table];
	var tableLink = {
	    value: this.state.table,
	    requestChange: this.handleTableChange
	};

	return (
            <div>
              <form>
 		<TableMenuItem tableLink={tableLink} tables={options.tables} /> 
	      </form>

	      <Input type='select' label='Column' ref="attr" valueLink={this.linkState('attr')} >
	      {
		  attrs.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

	      <Input type='select' label='Split By' ref="facetAttr" valueLink={this.linkState('facetAttr')}>
	      {
		  facetAttrs.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

            </div>
	);

    }
});


var StatsMenu = React.createClass({

    // options: { 
    //     tables:["morpho", "clinic"],
    //     attributes:[
    // 	     {name: "attr1", attribute_type: "QUANTITATIVE", included: true}, 
    //     ]
    // }
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	var table = this.props.table || this.props.options.tables[0];
	return {
	    table: table,
	    attr: this.props.attr || this.props.options.columns[table][0].name,
	};
    },

    getConfig: function() {
	return {
	    table: this.state.table,
	    attr: this.state.attr,
	};
    },

    handleTableChange: function(table) {
	this.setState({
	    table: table,
	    attr: this.props.options.columns[table][0].name,
	});
    },

    render: function() {
	var options = this.props.options;
	var attrs = options.columns[this.state.table];
	var tableLink = {
	    value: this.state.table,
	    requestChange: this.handleTableChange
	};

	return (
            <div>
              <form>
 		<TableMenuItem tableLink={tableLink} tables={options.tables} /> 
	      </form>

	      <Input type='select' label='Column' ref="attr" valueLink={this.linkState('attr')} >
	      {
		  attrs.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
	       }
	      </Input>

            </div>
	);

    }
});




var ParSetMenu = React.createClass({

    // options: { 
    //     tables:["morpho", "clinic"],
    //     attributes:[
    // 	     {name: "attr1", attribute_type: "QUANTITATIVE", included: true}, 
    //     ]
    // }
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
	var table = this.props.table || this.props.options.tables[0];
	return {
	    table: table,
	    value: this.props.value || this.props.options.quantitativeColumns[table][0].name,
	    dimensions: this.props.dimensions || [],
	};
    },

    getConfig: function() {
	return {
	    table: this.state.table,
	    value: this.state.value,
	    dimensions: this.state.dimensions,
	};
    },

    handleTableChange: function(table) {
	this.setState({
	    table: table,
	    value: this.props.options.quantitativeColumns[table][0].name,
	    dimensions: [],
	});
    },

    onDimensionsChange: function(table, columns) {
	console.log("YEAHHHHH", table, columns);
	this.setState({"dimensions": columns});
    },

    render: function() {
	var options = this.props.options;
	var values = options.quantitativeColumns[this.state.table];
	var dimensions = options.categoricalColumns[this.state.table];
	var tableLink = {
	    value: this.state.table,
	    requestChange: this.handleTableChange
	};

	var onDimensionsChange = this.onDimensionsChange.bind(this, this.state.table);
	
	return (
            <div>
              <form>

 		<TableMenuItem tableLink={tableLink} tables={options.tables} /> 

		<Input type='select' label='Value to Show' ref="value" valueLink={this.linkState('value')} >
		{
		    values.map(function(column, i){ return (<option key={column.name} value={column.name}> {column.name} </option>); })
		}
		</Input>
	      
		<CheckboxColumnsMenuItem label={"Columns"} columns={dimensions} onChange={onDimensionsChange}> </CheckboxColumnsMenuItem>

	      </form>
            </div>
	);

    }
});


