'use strict'

var React = require('react');

module.exports = {
    getDefaultProps: function() {
	var margin = {top: 20, right: 10, bottom: 20, left: 10};
	return {
	    margin: margin
	};
    },

    componentDidMount: function() {
	var container = this.refs.container.getDOMNode();
	this.createChart(container, this.props, this.state);
	this.update(container, this.props, this.state);
    },

    componentWillUnmount: function() {
	var container = this.refs.container.getDOMNode();
	this.cleanChart(container, this.props, this.state);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
	var container = this.refs.container.getDOMNode();
	this.update(container, nextProps, nextState);
	// render is not called again so the container is there until
	// the end.
	return false;
    },

    render: function(){
	return (
            <div ref="container"></div>
	);
    }
};
