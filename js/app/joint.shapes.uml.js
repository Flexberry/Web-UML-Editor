/*! JointJS v0.9.3 - JavaScript diagramming library  2015-02-03 


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


joint.shapes.uml = {}

joint.shapes.uml.Class = joint.shapes.basic.Generic.extend({
   // инициализация SVG разметки элемента:
    markup: [
        
        '<g class="rotatable">',
          '<g class="scalable">',          
            '<rect class="uml-class-name-rect"/><rect class="uml-class-attrs-rect"/><rect class="uml-class-methods-rect"/>',
          '</g>',
          '<text class="uml-class-name-text"/><text class="uml-class-attrs-text"/><text class="uml-class-methods-text"/>',
        '</g>',
        '<g class="element-tools">',
        '<g class="element-tool-remove"><circle fill="red" r="11"/>',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
        '<title>Remove this element from the model</title>',
        '</g>',
        '</g>',
        
    ].join(''),

    defaults: joint.util.deepSupplement({

        type: 'uml.Class',
        umlType: 'Class', 
        //инициализация стилей       
        attrs: {
            rect: { 'width': 200},
            
            '.uml-class-name-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#3498db' },
            '.uml-class-attrs-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#2980b9' },
            '.uml-class-methods-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#2980b9' },

            '.uml-class-name-text': {
                'ref': '.uml-class-name-rect', 'ref-y': .5, 'ref-x': .5, 'text-anchor': 'middle', 'y-alignment': 'middle', 'font-weight': 'bold',
                'fill': 'black', 'font-size': 12, 'font-family': 'Times New Roman'
            },
            '.uml-class-attrs-text': {
                'ref': '.uml-class-attrs-rect', 'ref-y': 5, 'ref-x': 5,
                'fill': 'black', 'font-size': 12, 'font-family': 'Times New Roman'
            },
            '.uml-class-methods-text': {
                'ref': '.uml-class-methods-rect', 'ref-y': 5, 'ref-x': 5,
                'fill': 'black', 'font-size': 12, 'font-family': 'Times New Roman'
            }
        },

        name: [],
        methodsView: [],
        attributesView: [],        
        attributes: [],
        methods: []

    }, joint.shapes.basic.Generic.prototype.defaults),

    initialize: function() {
        
        this.on('change:name change:methodsView change:attributesView', function() {
            this.updateRectangles();
	    this.trigger('uml-update');
        }, this);

        this.updateRectangles();
        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
  
    },

    getClassName: function() {
        return this.get('name');
    },
    setClassName: function(itemName) {
        this.set('name', itemName)
    },
    setMethods: function(itemMas){
        this.set('methodsView', itemMas)
    },
    setAttrs : function(itemMas){
        this.set('attributesView', itemMas)
    },
    
    updateRectangles: function() {
    
        var attrs = this.get('attrs');
        
        var rects = [
            { type: 'name', text: this.getClassName() },
            { type: 'attrs', text: this.get('attributesView') },
            { type: 'methods', text: this.get('methodsView') }
        ];

        var offsetY = 0;

        _.each(rects, function(rect) {

            var lines = _.isArray(rect.text) ? rect.text : [rect.text];
           
	    	var rectHeight = lines.length * 20 + 30;
            
            attrs['.uml-class-' + rect.type + '-text'].text = lines.join('\n');
            attrs['.uml-class-' + rect.type + '-rect'].height = rectHeight;
            attrs['.uml-class-' + rect.type + '-rect'].transform = 'translate(0,'+ offsetY + ')';

            offsetY += rectHeight;
        });
    } 
		

});

joint.shapes.uml.ClassView = joint.dia.ElementView.extend({    
    initialize: function() {
        this.listenTo(this.model, 'uml-update', function() {
            this.update();
            this.resize();
        });
       
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);        
    }   
   
});

joint.shapes.uml.Abstract = joint.shapes.uml.Class.extend({

    defaults: joint.util.deepSupplement({
        type: 'uml.Abstract',
        umlType: 'Class',
        attrs: {
            '.uml-class-name-rect': { fill : '#e74c3c' },
            '.uml-class-attrs-rect': { fill : '#c0392b' },
            '.uml-class-methods-rect': { fill : '#c0392b' }
        }
    }, joint.shapes.uml.Class.prototype.defaults),

    getClassName: function() {
        return ['<<Abstract>>', this.get('name')];
    }

});
joint.shapes.uml.AbstractView = joint.shapes.uml.ClassView;

joint.shapes.uml.Interface = joint.shapes.uml.Class.extend({

    defaults: joint.util.deepSupplement({
        type: 'uml.Interface',
        umlType: 'Class',
        attrs: {
            '.uml-class-name-rect': { fill : '#f1c40f' },
            '.uml-class-attrs-rect': { fill : '#f39c12' },
            '.uml-class-methods-rect': { fill : '#f39c12' }
        }
    }, joint.shapes.uml.Class.prototype.defaults),

    getClassName: function() {
        return ['<<Interface>>', this.get('name')];
    },
    setClassName: function(itemName) {
        this.set('name', itemName)
    },
    setMethods: function(itemMas){
        this.set('methodsView', itemMas)
    },
    setAttrs : function(itemMas){
        this.set('attributesView', itemMas)
    },

});
joint.shapes.uml.InterfaceView = joint.shapes.uml.ClassView;

joint.shapes.uml.Generalization = joint.dia.Link.extend({
    defaults: {
        type: 'uml.Generalization',
        umlType: 'Reference',
        attrs: { '.marker-target': { d: 'M 20 0 L 0 10 L 20 20 z', fill: 'white' }}
    }
});

joint.shapes.uml.Implementation = joint.dia.Link.extend({
    defaults: {
        type: 'uml.Implementation',
        umlType: 'Reference',
        attrs: {
            '.marker-target': { d: 'M 20 0 L 0 10 L 20 20 z', fill: 'white' },
            '.connection': { 'stroke-dasharray': '3,3' }
        }
    }
});

joint.shapes.uml.Aggregation = joint.dia.Link.extend({
    defaults: {
        type: 'uml.Aggregation',
        umlType: 'Reference',
        attrs: { '.marker-target': { d: 'M 40 10 L 20 20 L 0 10 L 20 0 z', fill: 'white' }}
    }
});

joint.shapes.uml.Composition = joint.dia.Link.extend({
    defaults: {
        type: 'uml.Composition',
        umlType: 'Reference',
        attrs: { '.marker-target': { d: 'M 40 10 L 20 20 L 0 10 L 20 0 z', fill: 'black' }}
    }
});

joint.shapes.uml.Association = joint.dia.Link.extend({
    defaults: { 
        type: 'uml.Association',
        umlType: 'Reference'
    }
});



