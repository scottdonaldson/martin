/*

    Martin.Element constructor

    Elements:
    .line()
    .rect()
    .circle()
    .ellipse()
    .polygon()

    Element methods:
    .moveTo()

    Finally:
    - Loop through drawing methods and
      create a corresponding method on the main Martin instance
*/


Martin.Element = function(type, canvas, obj) {

    if ( Martin.Element.prototype.hasOwnProperty(type) ) {

        // adds a new canvas within the current layer
        var layer = canvas.currentLayer;

        // base refers to the instance of Martin
        this.base = canvas;

        this.data = obj;
        this.type = type;
        this.layer = layer;

        layer.addElement(this);

        return this;

    } else {

        throw new Error('Given type is not an allowed element.');
    }
};

Martin.Element.prototype.renderElement = function() {
    return this[this.type]();
};

Martin.Element.prototype.image = function() {

    var context = this.layer.context,
        obj = this.data;

    context.drawImage(obj.original, obj.x || 0, obj.y || 0);

    return this;
};

Martin.Element.prototype.line = function() {

    var base = this.base,
        context = this.layer.context,
        obj = this.data;

    context.beginPath();

    context.moveTo(
        base.normalizeX( obj.x || 0 ),
        base.normalizeY( obj.y || 0 )
    );

    context.lineTo(
        base.normalizeX( obj.height || base.width() ),
        base.normalizeY( obj.width || base.height() )
    );

    if ( !obj.strokeWidth ) obj.strokeWidth = 1;
    obj.stroke = obj.color ? obj.color : '#000';

    Martin.setContext( context, obj );

    context.closePath();

    return this;

};

Martin.Element.prototype.rect = function() {

    var base = this.base,
        context = this.layer.context,
        obj = this.data;

    context.beginPath();

    context.rect(
        base.normalizeX( obj.x || 0 ),
        base.normalizeY( obj.y || 0 ),
        base.normalizeX( obj.width ),
        base.normalizeY( obj.height )
    );

    Martin.setContext( context, obj );

    context.closePath();

    return this;
};

Martin.Element.prototype.circle = function() {

    var base = this.base,
        context = this.layer.context,
        obj = this.data,
        centerX = base.normalizeX( obj.x || 0 ),
        centerY = base.normalizeY( obj.y || 0 );

    context.beginPath();

    context.arc( centerX, centerY, obj.radius, 0, 2 * Math.PI, false);

    Martin.setContext( context, obj );

    context.closePath();

    return this;

};

Martin.Element.prototype.ellipse = function(canvas, obj) {

    if ( obj.radiusX === obj.radiusY ) {
        obj.radius = obj.radiusX;
        return this.circle( canvas, obj );
    }

    var centerX = canvas.normalizeX( obj.offsetX || 0 ),
        centerY = canvas.normalizeY( obj.offsetY || 0 ),
        scale;

    this.context.beginPath();

    if ( obj.radiusX > obj.radiusY ) {

        scale = obj.radiusX / obj.radiusY;

        this.context.scale( scale, 1 );

        this.context.arc( centerX / scale, centerY, obj.radiusX / scale, 0, 2 * Math.PI, false);

        this.context.scale( 1 / scale, 1 );

    } else {

        scale = obj.radiusY / obj.radiusX;

        this.context.scale( 1, scale );

        this.context.arc( centerX, centerY / scale, obj.radiusY / scale, 0, 2 * Math.PI, false);

        this.context.scale( 1, 1 / scale );

    }

    Martin.setContext( this.context, obj );

    this.context.closePath();

    return this;
}

Martin.Element.prototype.polygon = function() {

    var base = this.base,
        context = this.layer.context,
        obj = this.data;

    context.beginPath();

    for ( var i = 0; i < obj.points.length; i++ ) {

        var x = obj.points[i][0],
            y = obj.points[i][1],
            toX = canvas.normalizeX( x ),
            toY = canvas.normalizeY( y );

        if ( i === 0 ) context.moveTo( toX, toY );

        context.lineTo( toX, toY );

    }

    // close the path
    context.lineTo(
        base.normalizeX(obj.points[0][0]),
        base.normalizeY(obj.points[0][1])
    );

    Martin.setContext( context, obj );

    context.closePath();

    return this;
};

Martin.Element.prototype.text = function() {

	var base = this.base,
        context = this.layer.context,
        obj = this.data,
        text,
		size,
		fontString;

    text = obj.text;
	size = obj.size || 16;

	fontString = size + 'px ';
	fontString += obj.font ? '"' + obj.font + '"' : 'sans-serif';

	context.font = fontString;
	context.fillStyle = obj.color || '#000';
	context.textBaseline = 'top';
	context.textAlign = obj.align || 'left';
	context.fillText(
		text,
		base.normalizeX(obj.x || 0),
		base.normalizeY(obj.y || 0)
	);

	return this;
};

// ----- Removing and moving elements within the stack in the layer

Martin.Element.prototype.layerIndex = function() {
    return this.layer.elements.indexOf(this);
};

Martin.Element.prototype.remove = function() {
    this.layer.elements.splice(this.layerIndex(), 1);
    this.base.render();
    return this;
};

Martin.Element.prototype.bump = function(i) {
    var layerIndex = this.layerIndex();
    this.remove();
    this.layer.elements.splice(layerIndex + i, 0, this);
    this.base.render();
    return this;
};

Martin.Element.prototype.bumpUp = function() {
    return this.bump(1);
};

Martin.Element.prototype.bumpDown = function() {
    return this.bump(-1);
};

Martin.Element.prototype.bumpToTop = function() {
    this.remove();
    this.layer.elements.push(this);
    this.base.render();
    return this;
};

Martin.Element.prototype.bumpToBottom = function() {
    this.remove();
    this.layer.elements.unshift(this);
    this.base.render();
    return this;
};

// ----- Move an element to new coordinates
Martin.Element.prototype.moveTo = function(x, y) {

    var data = this.data;

    if ( this.type === 'line' ) {
        data.endX += x - data.x;
        data.endY += y - data.y;
    } else if ( this.type === 'polygon' ) {
        data.points.forEach(function(pt, i) {
            if ( i > 0 ) {
                var thisX = pt[0],
                    thisY = pt[1];
                data.points[i] = [
                    thisX + (x - data.points[0][0]),
                    thisY + (y - data.points[0][1])
                ];
            }
        });
        data.points[0] = [x, y];
    }

    data.x = x;
    data.y = y;

    this[this.type]();

    this.base.render();

    return this;

};

(function(){
    var drawingElements = ['line', 'rect', 'circle', 'ellipse', 'polygon', 'text'];

    drawingElements.forEach(function(el) {
        Martin.prototype[el] = function(obj) {
            return new Martin.Element(el, this, obj);
        };
    });
})();
