
ColorExporter = function() {
};

ColorExporter.prototype = {

    constructor: ColorExporter,

    export: function(ColorArrs) {

        var numOfLayers = ColorArrs.length;
        var numOfVertices = ColorArrs[0].length;
        var bufferLength = 1 + 4*numOfVertices*numOfLayers;
        var arrayBuffer = new ArrayBuffer(bufferLength);

        var offset = 0;
        var output = new DataView(arrayBuffer);

        output.setUint8(offset, numOfLayers);
        offset += 1;

        for (var i = 0; i < numOfLayers; i++) {
            for (var j = 0; j < numOfVertices; j++) {
                output.setUint32(offset, ColorArrs[i][j].getHex());
                offset += 4;
            }
        }

        return output.buffer;

    }

};