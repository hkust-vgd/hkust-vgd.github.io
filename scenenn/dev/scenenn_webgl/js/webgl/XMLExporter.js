
XMLExporter = function() {
};

XMLExporter.prototype = {

    constructor: XMLExporter,

    export: function(AnnotationElements) {

        var serializer = new XMLSerializer();
        var rootNode = document.implementation.createDocument(null, "annotation");

        AnnotationElements.forEach( function(item) {

            var childNode = rootNode.createElement("label");
            childNode.setAttribute("id", item.labelID.toString());
            var hexStr = item.labelColor.getHexString();
            var rgbStr = parseInt(hexStr.substr(0,2), 16) + " " + parseInt(hexStr.substr(2,2), 16) + " " + parseInt(hexStr.substr(4,2), 16);
            childNode.setAttribute("color", rgbStr);
            childNode.setAttribute("text", item.labelTitle);
            if (!item.aabBox) {
                item.aabBox = item.region.getBoundingBox();
            }
            var aabbStr = item.aabBox.min.x + " " + item.aabBox.min.y + " " + item.aabBox.min.z + " " + item.aabBox.max.x + " " + item.aabBox.max.y + " " + item.aabBox.max.z;
            childNode.setAttribute("aabb", aabbStr);
            rootNode.firstElementChild.appendChild(childNode);
        });

        return serializer.serializeToString(rootNode);

    }

};