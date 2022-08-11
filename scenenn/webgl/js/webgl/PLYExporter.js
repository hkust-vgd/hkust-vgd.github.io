/**
 * PLYBinaryExporter
 * with LabelID in vertex's properties
 * @author Ha Tan Sang
 */

THREE.PLYBinaryExporter = function () {
};

THREE.PLYBinaryExporter.prototype = {

    constructor: THREE.PLYBinaryExporter,

    parse: ( function () {

        return function parse(mesh) {

            var numberOfFaces;
            var numberOfVertices;

            if (!( mesh instanceof THREE.Mesh )) return;

            var geometry = mesh.geometry;
            if (geometry instanceof THREE.BufferGeometry) {

                geometry = new THREE.Geometry().fromBufferGeometry(geometry);

            }

            if (!( geometry instanceof THREE.Geometry )) return;

            numberOfFaces = geometry.faces.length;
            numberOfVertices = geometry.vertices.length;

            var vertexNormals = [];
            var vertexColors = [];
            for (var i = 0; i < numberOfFaces; i++) {
                vertexNormals[geometry.faces[i].a] = geometry.faces[i].vertexNormals[0];
                vertexNormals[geometry.faces[i].b] = geometry.faces[i].vertexNormals[1];
                vertexNormals[geometry.faces[i].c] = geometry.faces[i].vertexNormals[2];
                vertexColors[geometry.faces[i].a] = geometry.faces[i].vertexColors[0];
                vertexColors[geometry.faces[i].b] = geometry.faces[i].vertexColors[1];
                vertexColors[geometry.faces[i].c] = geometry.faces[i].vertexColors[2];
            }

            var strHeader = "ply\n" +
                "format binary_little_endian 1.0\n" +
                "element vertex " + numberOfVertices + "\n" +
                "property float x\n" +
                "property float y\n" +
                "property float z\n" +
                "property float nx\n" +
                "property float ny\n" +
                "property float nz\n" +
                "property uint label\n" +
                "property uchar red\n" +
                "property uchar green\n" +
                "property uchar blue\n" +
                "element face " + numberOfFaces + "\n" +
                "property list uchar int vertex_indices\n" +
                "end_header\n";

            var bufferLength = strHeader.length + numberOfVertices * (6 * 4 + 1 * 4 + 3 * 1) + numberOfFaces * (1 + 3 * 4);
            var arrayBuffer = new ArrayBuffer(bufferLength);

            var offset = 0;
            var output = new DataView(arrayBuffer);

            //Write header
            for (var i = 0; i < strHeader.length; i++) {
                output.setUint8(offset++, strHeader.charCodeAt(i));
            }

            //Write Mesh data
            for (var i = 0; i < geometry.vertices.length; i++) {
                output.setFloat32(offset, geometry.vertices[i].x, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].y, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].z, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].x, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].y, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].z, true); offset+=4;
                output.setInt32(offset, geometry.userData.labels[i], true); offset+=4;
                var colorHexString = vertexColors[i].getHexString();
                output.setUint8(offset++, parseInt(colorHexString.substr(0,2), 16));
                output.setUint8(offset++, parseInt(colorHexString.substr(2,2), 16));
                output.setUint8(offset++, parseInt(colorHexString.substr(4,2), 16));
            }

            for (var i = 0; i < numberOfFaces; i++) {
                output.setUint8(offset++, 3);
                output.setInt32(offset, geometry.faces[i].a, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].b, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].c, true); offset += 4;
            }

            return output.buffer;

        };

    }() )

};


/* PLY 2 */
THREE.PLYBinaryExporter2 = function () {
};

THREE.PLYBinaryExporter2.prototype = {

    constructor: THREE.PLYBinaryExporter2,

    parse: ( function () {

        return function parse(mesh) {

            var numberOfFaces;
            var numberOfVertices;
            var numberOfLayers;

            if (!( mesh instanceof THREE.Mesh )) return;

            var geometry = mesh.geometry;
            if (geometry instanceof THREE.BufferGeometry) {

                geometry = new THREE.Geometry().fromBufferGeometry(geometry);

            }

            if (!( geometry instanceof THREE.Geometry )) return;

            numberOfFaces = geometry.faces.length;
            numberOfVertices = geometry.vertices.length;
            numberOfLayers = gLayerManager.countLayer();

            var vertexNormals = [];
            var vertexColors = [];
            for (var i = 0; i < numberOfFaces; i++) {
                vertexNormals[geometry.faces[i].a] = geometry.faces[i].vertexNormals[0];
                vertexNormals[geometry.faces[i].b] = geometry.faces[i].vertexNormals[1];
                vertexNormals[geometry.faces[i].c] = geometry.faces[i].vertexNormals[2];
                vertexColors[geometry.faces[i].a] = geometry.faces[i].vertexColors[0];
                vertexColors[geometry.faces[i].b] = geometry.faces[i].vertexColors[1];
                vertexColors[geometry.faces[i].c] = geometry.faces[i].vertexColors[2];
            }

            var strHeader = "ply\n" +
                "format binary_little_endian 1.0\n" +
                "element vertex " + numberOfVertices + "\n" +
                "property float x\n" +
                "property float y\n" +
                "property float z\n" +
                "property float nx\n" +
                "property float ny\n" +
                "property float nz\n" +
                "property list uint8 uint32 arrlabels" + "\n" +
                "property list uint8 uint32 arrcolors\n" +
                "element face " + numberOfFaces + "\n" +
                "property list uchar int vertex_indices\n" +
                "end_header\n";

            var bufferLength = strHeader.length + numberOfVertices * (6 * 4 + 1*1 + numberOfLayers*(1 * 4) + 1*1 + numberOfLayers*(1 * 4)) + numberOfFaces * (1 + 3 * 4);
            var arrayBuffer = new ArrayBuffer(bufferLength);

            var offset = 0;
            var output = new DataView(arrayBuffer);

            //Write header
            for (var i = 0; i < strHeader.length; i++) {
                output.setUint8(offset++, strHeader.charCodeAt(i));
            }

            //Write Mesh data
            for (var i = 0; i < geometry.vertices.length; i++) {

                output.setFloat32(offset, geometry.vertices[i].x, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].y, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].z, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].x, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].y, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].z, true); offset+=4;

                output.setUint8(offset++, numberOfLayers);
                for (var j = 0; j < numberOfLayers; j++) {
                    output.setUint32(offset, gLayerManager.lstOfLayer[j].labels[i], true); offset+=4;
                }

                output.setUint8(offset++, numberOfLayers);
                for (var j = 0; j < numberOfLayers; j++) {
                    output.setUint32(offset, gLayerManager.lstOfLayer[j].colors[i].getHex(), true); offset+=4;
                }

                // for (var j = 0; j < numberOfLayers; j++) {
                //
                //     output.setInt32(offset, geometry.userData.labels[i], true); offset+=4;
                //     var colorHexString = vertexColors[i].getHexString();
                //     output.setUint8(offset++, parseInt(colorHexString.substr(0,2), 16));
                //     output.setUint8(offset++, parseInt(colorHexString.substr(2,2), 16));
                //     output.setUint8(offset++, parseInt(colorHexString.substr(4,2), 16));
                //
                // }

            }

            for (var i = 0; i < numberOfFaces; i++) {

                output.setUint8(offset++, 3);
                output.setInt32(offset, geometry.faces[i].a, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].b, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].c, true); offset += 4;

            }

            return output.buffer;

        };

    }() )

};


/* PLYExporter3 */

THREE.PLYBinaryExporter3 = function () {
};

THREE.PLYBinaryExporter3.prototype = {

    constructor: THREE.PLYBinaryExporter3,

    parse: ( function () {

        return function parse(mesh) {

            var numberOfFaces;
            var numberOfVertices;
            var numberOfLayers;

            if (!( mesh instanceof THREE.Mesh )) return;

            var geometry = mesh.geometry;
            if (geometry instanceof THREE.BufferGeometry) {

                geometry = new THREE.Geometry().fromBufferGeometry(geometry);

            }

            if (!( geometry instanceof THREE.Geometry )) return;

            numberOfFaces = geometry.faces.length;
            numberOfVertices = geometry.vertices.length;
            numberOfLayers = gLayerManager.countLayer();

            var vertexNormals = [];
            var vertexColors = [];
            for (var i = 0; i < numberOfFaces; i++) {
                vertexNormals[geometry.faces[i].a] = geometry.faces[i].vertexNormals[0];
                vertexNormals[geometry.faces[i].b] = geometry.faces[i].vertexNormals[1];
                vertexNormals[geometry.faces[i].c] = geometry.faces[i].vertexNormals[2];
                vertexColors[geometry.faces[i].a] = geometry.faces[i].vertexColors[0];
                vertexColors[geometry.faces[i].b] = geometry.faces[i].vertexColors[1];
                vertexColors[geometry.faces[i].c] = geometry.faces[i].vertexColors[2];
            }

            var strHeader = "ply\n" +
                "format binary_little_endian 1.0\n" +
                "element vertex " + numberOfVertices + "\n" +
                "property float x\n" +
                "property float y\n" +
                "property float z\n" +
                "property float nx\n" +
                "property float ny\n" +
                "property float nz\n" +
                // "property list uint8 uint32 arrlabels" + "\n" +
                // "property list uint8 uint32 arrcolors\n" +
                "element face " + numberOfFaces + "\n" +
                "property list uchar int vertex_indices\n" +
                "end_header\n";

            var bufferLength = strHeader.length + numberOfVertices * (6 * 4 ) + numberOfFaces * (1 + 3 * 4);
            var arrayBuffer = new ArrayBuffer(bufferLength);

            var offset = 0;
            var output = new DataView(arrayBuffer);

            //Write header
            for (var i = 0; i < strHeader.length; i++) {
                output.setUint8(offset++, strHeader.charCodeAt(i));
            }

            //Write Mesh data
            for (var i = 0; i < geometry.vertices.length; i++) {

                output.setFloat32(offset, geometry.vertices[i].x, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].y, true); offset+=4;
                output.setFloat32(offset, geometry.vertices[i].z, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].x, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].y, true); offset+=4;
                output.setFloat32(offset, vertexNormals[i].z, true); offset+=4;

                // output.setUint8(offset++, numberOfLayers);
                // for (var j = 0; j < numberOfLayers; j++) {
                //     output.setUint32(offset, gLayerManager.lstOfLayer[j].labels[i], true); offset+=4;
                // }
                //
                // output.setUint8(offset++, numberOfLayers);
                // for (var j = 0; j < numberOfLayers; j++) {
                //     output.setUint32(offset, gLayerManager.lstOfLayer[j].colors[i].getHex(), true); offset+=4;
                // }

                // for (var j = 0; j < numberOfLayers; j++) {
                //
                //     output.setInt32(offset, geometry.userData.labels[i], true); offset+=4;
                //     var colorHexString = vertexColors[i].getHexString();
                //     output.setUint8(offset++, parseInt(colorHexString.substr(0,2), 16));
                //     output.setUint8(offset++, parseInt(colorHexString.substr(2,2), 16));
                //     output.setUint8(offset++, parseInt(colorHexString.substr(4,2), 16));
                //
                // }

            }

            for (var i = 0; i < numberOfFaces; i++) {

                output.setUint8(offset++, 3);
                output.setInt32(offset, geometry.faces[i].a, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].b, true); offset += 4;
                output.setInt32(offset, geometry.faces[i].c, true); offset += 4;

            }

            return output.buffer;

        };

    }() )

};