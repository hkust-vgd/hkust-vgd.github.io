
THREE.LabelLoader = function (manager) {

    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

    this.propertyNameMapping = {};

};

THREE.LabelLoader.prototype = {

    constructor: THREE.LabelLoader,

    load: function (url, onLoad, onProgress, onError) {

        var scope = this;

        var loader = new THREE.FileLoader(this.manager);
        loader.setResponseType('text');
        loader.load(url, function (text) {

            onLoad(scope.parse(text));

        }, onProgress, onError);

    },

    setPropertyNameMapping: function (mapping) {

        this.propertyNameMapping = mapping;

    },

    parse: function (data) {

        function parseBin(data) {

            var labelArrs = [];

            var offset = 0;
            var dataReader = new DataView(data, offset);

            var numOfLayers = dataReader.getUint8(offset);
            offset += 1;

            var numOfVertices = ((dataReader.byteLength - 1) / numOfLayers)/4;

            for (var i = 0; i < numOfLayers; i++) {
                var tmpArr = [];
                for (var j = 0; j < numOfVertices; j++) {
                    var colorUint32 = dataReader.getUint32(offset);
                    offset += 4;
                    tmpArr.push(colorUint32);
                }
                labelArrs.push(tmpArr);
            }

            return labelArrs;
        }

        //============================================


        var outData = parseBin(data);

        return outData;
    }

};