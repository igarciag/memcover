'use strict'

var React = require('react');
var _ = require('lodash');
var BS = require('react-bootstrap');


module.exports = React.createClass({

    render: function() {
	var self = this;
	var title = this.props.title;
	var cardId = this.props.cardId;
	var state = this.props.state;
	var parent = this.props.parent;

	function eventFire(el, etype){
		if (el.fireEvent) {
			el.fireEvent('on' + etype);
		} else {
			var evObj = document.createEvent('Events');
			evObj.initEvent(etype, true, false);
			el.dispatchEvent(evObj);
		}
	}

	/* var child = React.cloneElement(
	   React.Children.only(this.props.children),
	   {width: this.props.width, height: this.props.height}); */
	var contentSize = {width: this.props.size.width + 17, height: this.props.size.height + 17};
	var menuActions = this.props.menuActions || [];
	var columns = this.props.columns || [];
	var allColumns = this.props.allColumns || [];
	var historyColumns = state.cards[cardId].config.history_columns;

	if (! _.isEmpty(menuActions)) {
	    var menu = (
		<div className="card-menu btn-group">
		  <button className="btn btn-xs btn-default dropdown-toggle" type="button" data-toggle="dropdown">
		    <span className="caret"></span>
		  </button>
		  <ul className="dropdown-menu dropdown-menu-right">
		    {
			menuActions.map(function(a){ 
			    var icon = "glyphicon glyphicon-" + a.icon;
			    var action = a.action.bind(self);
			    return (<li><a href="#" onClick={action}><span className={icon}> {a.label}</span></a></li>);})
		    }
		  </ul>
		</div>
	    );
	}


	if (state.cards[cardId].kind == "pcp") {
	    var attr = (
				<div className="card-menu btn-group" style={{marginRight:"23px"}}>
					<BS.DropdownButton id="dropdownmenu_attr" title={<span className="glyphicon glyphicon-list"></span>} style={{maxWidth:"150px"}} bsStyle="default" bsSize="xsmall">
						<div id="checklist_attr" style={{maxHeight:(this.props.size.height-30)+"px", maxWidth:"160px", overflowY:"scroll"}}>
							<a href="#" class="btn btn-default"><span className="glyphicon glyphicon-remove" style={{float:"right", color:"gray", marginRight:"5px"}} onClick={function(ev){ eventFire(document.getElementById('dropdownmenu_attr'), 'click'); }}></span></a>
							{_.map(allColumns, function(column, i) {
									var color = "#555555";
									var is_history = historyColumns.indexOf(column);
									if(is_history != -1) color = "#9932CC";
									if(columns.indexOf(column) != -1){
										return (<li><small><input type="checkbox" id={column} value={column} checked onChange={function(ev) { state.cards[cardId].config.columns[i].included = ev.target.checked; if(is_history == -1) historyColumns.push(column); parent.forceUpdate(); }}/><label style={{fontWeight:"normal", color: color}}> {column} </label></small></li>);
									}
									return (<li><small><input type="checkbox" value={column} onChange={function(ev){ state.cards[cardId].config.columns[i].included = ev.target.checked; if(is_history == -1) historyColumns.push(column); parent.forceUpdate(); }}/><label style={{fontWeight:"normal", color: color}}> {column} </label></small></li>);
								})
							}
						</div>
					</BS.DropdownButton>
				</div>
			);

		var color_list = ["darkred", "brown", "red", "orangered", "chocolate", "orange", "yellow", "indigo", "darkmagenta", "deeppink", "rosybrown", "pink", "darkblue", "blue", "darkslategray", "teal", "darkgreen", "olive", "green", "chartreuse", "black"];
		var colors = (
				<div className="card-menu btn-group" style={{marginRight:"62px"}}>
					<BS.DropdownButton id="dropdownmenu_color" title={<div id="menu_color_square" style={{float: "left", width: "15px", height: "15px", background: color_list[0], marginRight:"4px", marginTop:"1px"}}></div>} style={{maxWidth:"50px"}} bsStyle="default" bsSize="xsmall">
						<div class="dropdown-menu" role="menu">
							{_.map(color_list, function(color, i) {
									//if(color == active_color) return (<BS.MenuItem active onClick={function(ev){ document.getElementById("menu_color_square").style.background=color; active_color=color; eventFire(document.getElementById('dropdownmenu_color'), 'click'); }}> <div value={color} style={{float: "left", width: "15px", height: "15px", background:color, marginRight:"4px", marginTop:"1px"}}></div> {color} </BS.MenuItem>);
									return (<div onClick={function(ev){ document.getElementById("menu_color_square").style.background=color; state.cards[cardId].config.active_color=color; parent.forceUpdate(); eventFire(document.getElementById('dropdownmenu_color'), 'click'); }} value={color} style={{float: "left", width: "15px", height: "15px", background:color, marginLeft:"6px", marginTop:"4px", cursor: "pointer"}}></div>);
								})
							}
						</div>
					</BS.DropdownButton>
				</div>
	    	);
		console.log(self.props.children._store.props.active_color);
	}

	console.log("CHHH", this.props.children);
	return (
	    <div className="card" id="card_div" key={this.props.key}>
			<div className="card-header">
				<div className="card-move btn btn-xs btn-default card-anchor glyphicon glyphicon-move" aria-hidden="true"></div>

				{attr}

				{colors}

				{{menu}}

				<button className="card-close btn btn-xs btn-default glyphicon glyphicon-remove" aria-hidden="true" onClick={this.props.onClose}></button>

			</div>
			<div className="card-content" style={contentSize}>
				{this.props.children}
			</div>
		</div>
	);
    }
});
