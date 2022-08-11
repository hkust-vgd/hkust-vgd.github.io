
LabelExporter = function() {
};

LabelExporter.prototype = {

    constructor: LabelExporter,

    export: function(LabelArrs) {

        var numOfLayers = LabelArrs.length;
        var numOfVertices = LabelArrs[0].length;
        var bufferLength = 1 + 4*numOfVertices*numOfLayers;
        var arrayBuffer = new ArrayBuffer(bufferLength);

        var offset = 0;
        var output = new DataView(arrayBuffer);

        output.setUint8(offset, numOfLayers);
        offset += 1;

        for (var i = 0; i < numOfLayers; i++) {
            for (var j = 0; j < numOfVertices; j++) {
                output.setUint32(offset, LabelArrs[i][j]);
                offset += 4;
            }
        }

        return output.buffer;

    }

};