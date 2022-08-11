// this is XMLloader.js -- Fangyu Lin
/**
 * Description: A THREE loader for XML files
 *
 * Usage:
 *    var loader = new THREE.XMLLoader();
 *    loader.load('test.xml', function (geometry) {
 *
 *		scene.add( new THREE.Mesh( geometry ) );
 *
 *	} );
 *
 */


THREE.XMLLoader = function (manager) {

    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

    this.propertyNameMapping = {};

};

THREE.XMLLoader.prototype = {

    constructor: THREE.XMLLoader,

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

        function parseXML(data) {

            var buffData = {labelID: [], labelTitle: [], labelColor: [], aabboxes: [], regions: new Map()};

            if (window.DOMParser) {
                parserr = new DOMParser();
                xmlDoc = parserr.parseFromString(data, "text/xml");
            } else {    // Internet Explorer
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(data);
            }

            var xid, xcolor, xtext, xnote, xarea, xobbox, aabb;
            var x = xmlDoc.getElementsByTagName('label');
            // var spritey_list = [];
            for (i = 0; i < x.length; i++) {
                xid = x[i].getAttribute('id');
                xcolor = x[i].getAttribute('color');
                xtext = x[i].getAttribute('text');
                // xnote = x[i].getAttribute('note');
                // xarea = x[i].getAttribute('area');
                // xobbox = x[i].getAttribute('obbox');
                aabb = x[i].getAttribute('aabbox');

                //console.log("Lable:", i, "; ObjName: ", xtext, "; AABBox: ", aabb); //test output

                xcolor = xcolor.split(" ");
                //aCube( vertex_indx, geometry, xcolor, xtext, spritey_list);

                //Store Label ID
                buffData.labelID.push(Number(xid));

                //Store Label Title
                buffData.labelTitle.push(xtext);

                //Store Label Color
                var rgbcolor = "rgb(" + xcolor[0] + "," + xcolor[1] + "," + xcolor[2] + ")";
                buffData.labelColor.push(new THREE.Color(rgbcolor));

                //Store aabb
                if (!aabb) {
                    buffData.aabboxes.push(null);
                } else {
                    aabb = aabb.split(" ");
                    var parsedAabb = aabb.map(parseFloat);
                    var minPoint = new THREE.Vector3(parsedAabb[0], parsedAabb[1], parsedAabb[2]);
                    var maxPoint = new THREE.Vector3(parsedAabb[3], parsedAabb[4], parsedAabb[5]);
                    var tmpBox3 = new THREE.Box3(minPoint, maxPoint);
                    buffData.aabboxes.push(tmpBox3);
                }

                // var folderAnnotation = gGuiControls.__folders["Annotation"];
                // var tmpAnnoInfo = new AnnoInfoElement(buffData.labelID[i],
                //     buffData.labelTitle[i],
                //     buffData.labelColor[i],
                //     buffData.aabboxes[i]);
                // tmpAnnoInfo.addColorControllerToFolder(folderAnnotation);
                // gAnnotationData.set(tmpAnnoInfo.labelID, tmpAnnoInfo);
                // console.debug("XML done + " + i);
            }

            return buffData;
        }

        //============================================
        console.time('XMLLoader');

        var outData = parseXML(data);

        console.timeEnd('XMLLoader');

        //return geometry;
        return outData;
    }

};
