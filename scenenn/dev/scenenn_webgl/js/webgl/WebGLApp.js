
/* EVENT HANDLERS *****************************************************/

function onWindowResize() {
    gCamera.aspect = WEBGL_RENDERER_ASPECT();
    gCamera.updateProjectionMatrix();
    gRenderer.setSize(WEBGL_RENDERER_WIDTH(), WEBGL_RENDERER_HEIGHT());
    gGuiControls.width = WEBGL_RENDERER_WIDTH() / 7.0;
}

function onKeyDown(e) {

    //console.debug("Key Down");

    if (document.activeElement.tagName === "INPUT" && !document.activeElement.hasAttribute("readonly"))
        return;

    // ENTER MERGE MODE
    if (e.keyCode === MERGE_MODE_KEY) {
        gOrbitControl.enabled = false;
        isShiftKeyPressed = true;
        //console.debug("Disable orbit ctrl");
    }

    // ENTER EXTRACT MODE
    if (e.keyCode === EXTRACT_MODE_KEY && !isExtractMode) {
        gOrbitControl.enabled = false;
        isExtractMode = true;
        //console.debug("Show GraphCut");

        // Store ori data
        gOriData.colors = gMesh.geometry.colors;
        gOriData.labels = gMesh.geometry.userData.labels;

        // Show
        gMesh.geometry.colors = gGraphCutData.colors.slice(0);
        gMesh.geometry.userData.labels = gGraphCutData.labels.slice(0);
        updateGeometryColorsToFaceVertexColors(gMesh.geometry);
        gMesh.geometry.elementsNeedUpdate = true;
    }

}

function toggleLight() {

    gLightIsEnabled = !gLightIsEnabled;
    if (gLightIsEnabled) {

        gMesh.material = gArrMaterials.PhongMaterial;
        gScene.add(gCamera);

    } else {

        gMesh.material = gArrMaterials.BasicMaterial;
        gScene.remove(gCamera);

    }

}

function onKeyUp(e) {

    //console.debug("Key Up");

    if (document.activeElement.tagName !== "INPUT" || (document.activeElement.tagName === "INPUT" && document.activeElement.hasAttribute("readonly"))) {
        switch (e.keyCode) {

            // Merge mode key
            case MERGE_MODE_KEY:
                gOrbitControl.enabled = true;
                //console.debug("Enable orbit ctrl");
                isShiftKeyPressed = false;
                break;

            // Extract mode key
            case EXTRACT_MODE_KEY:
                isExtractMode = false;
                gOrbitControl.enabled = true;
                //console.debug("Restore Ori state");
                gMesh.geometry.userData.labels = gOriData.labels;
                gMesh.geometry.colors = gOriData.colors;
                updateGeometryColorsToFaceVertexColors(gMesh.geometry);
                gMesh.geometry.elementsNeedUpdate = true;
                break;

            // Key 'L'
            case TOGGLE_LIGHT_KEY:
                //console.debug("L");
                toggleLight();
                break;

            // Key 'D'
            case SHOW_ANNO_KEY:
                gbShowAllAnnotation = !gbShowAllAnnotation;

                if (gbShowAllAnnotation) {
                    showAllAnnotation(gAnnotationData);
                } else {
                    hideAllAnnotation();
                }
                break;

            // Key 'Z'
            case UNDO_KEY:
                gCommandStack.popAndUndo();
                break;

        }
    } else {
        switch (e.keyCode) {
            case ENTER_KEY:
                document.activeElement.setAttribute("readonly", "");
                break;
        }
    }

}

function onDocumentTouchStart(e) {

    e.preventDefault();
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
    onDocumentMouseDown(e);

}

function onDocumentMouseDown(event) {

    // Not left button
    if (event.button !== 0) {
        return;
    }

    var labelID = findLabelIDByClientXY(event.clientX, event.clientY);

    if (labelID !== null && !isShiftKeyPressed && !isExtractMode) {
        var correspondingTxtbox = $(".dg .cr.color#" + labelID + " :input")[0];
        correspondingTxtbox.focus();
    } else {
        document.activeElement.blur();
    }

    if (!isShiftKeyPressed && !isExtractMode)
        return;

    event.preventDefault();

    startDraw(event);

}

function onDocumentDblClick(event) {

    // Not left button
    if (event.button !== 0) {
        return;
    }

    var labelID = findLabelIDByClientXY(event.clientX, event.clientY);

    if (labelID !== null && !isShiftKeyPressed && !isExtractMode) {
        var correspondingTxtbox = $(".dg .cr.color#" + labelID + " :input")[0];
        correspondingTxtbox.removeAttribute("readonly");
        correspondingTxtbox.focus();
    } else {
        document.activeElement.blur();
    }

}

/* END OF EVENT HANDLERS *****************************************************/

if (!Detector.webgl) Detector.addGetWebGLMessage();

var WEBGL_RENDERER_WIDTH = function () {
    return window.innerWidth
};
var WEBGL_RENDERER_HEIGHT = function () {
    return window.innerHeight - $('.container').height()
};
var WEBGL_RENDERER_ASPECT = function () {
    return WEBGL_RENDERER_WIDTH() / WEBGL_RENDERER_HEIGHT()
};
var WEBGL_CAMERA_NEAR = 15;
var WEBGL_CAMERA_FAR = 1000;
var MERGE_MODE_KEY = 16; //Shift key
var EXTRACT_MODE_KEY = 17; //Control key
var TOGGLE_LIGHT_KEY = 76; // 'L'
var SHOW_ANNO_KEY = 68; // 'D'
var UNDO_KEY = 90; // 'Z'
var ENTER_KEY = 13; // Enter


var gCamera, gScene, gRenderer, gMesh;

/* Map: LabelID => AnnoInfoElement */
var gAnnotationData = new Map();

var gListOfAnnoData = [];

/* Map: LabelID => AnnoInfoElement in Graphcut domain */
var gGraphCutAnnoData = new Map();

var gMousePosition = new THREE.Vector2();
var gOrbitControl;

var isShiftKeyPressed = false;
var isExtractMode = false;

var gGuiControls = new dat.GUI({autoPlace: false, scrollable: true});

var isPLYLoaded = false, isXMLLoaded = false;

var guiRunMRFObj = {runMRF: false};
var runMRFCheckboxGuiCtrl = gGuiControls.add(guiRunMRFObj, 'runMRF').name("Run MRF");
runMRFCheckboxGuiCtrl.domElement.style.width = "30%";
runMRFCheckboxGuiCtrl.domElement.parentElement.firstElementChild.style.width = "70%";

var customContainer = $('#guicontrol');
customContainer.append(gGuiControls.domElement);

var gArrMaterials = {
    BasicMaterial: new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    }),
    PhongMaterial: new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    })
};

var gLight = [new THREE.DirectionalLight(0xffffff, 0.4), new THREE.DirectionalLight(0xffffff, 0.4)];
gLight[0].position.set(0, 10, 0);
gLight[1].position.set(0, -10, 0);
var gLightIsEnabled = true;

var gStats;

var gbShowAllAnnotation = false;

let gCommandStack = new CommandStack();

var gGraphCutData = {colors: [], labels: [], color_map: []};
var gOriData = {colors: [], labels: []};

var gProgressElement = null;

var gLayerManager = null;

var gIsClassMode = false;

var gGeoColors, gGeoVertices, gGeoNormals, gGeoIndex;

var gMeshObject;

function showScene(PLYFilePath, XMLFilePath) {
    customContainer.empty();
    customContainer.append(gGuiControls.domElement);
    loadFromPLYAndXMLPath(PLYFilePath, XMLFilePath);
    animate();
}

function preLoadScene() {

    gProgressElement = document.createElement("div");

    gProgressElement.innerHTML = "    <div class=\"progress\" style=\"width:100%\">\n" +
        "<div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" style=\"width:100%\">\n" +
        "Please wait..." +
        "</div>\n" +
        "</div>";

    gProgressElement.style.left = "20%";
    gProgressElement.style.right = "20%";
    gProgressElement.style.position = "fixed";
    gProgressElement.style.top = "50%";
    document.body.appendChild(gProgressElement);

    let container = $("#glcanvas_viewer");
    container.find("canvas").remove();
    $("#downloadscene-btn").empty();
    $("#infoButton").empty();
    $("#info").empty();

    if (gGuiControls.__folders["Annotation"] !== undefined) {
        //gGuiControls.__folders["Annotation"].close();
        gGuiControls.__folders["Annotation"].domElement.remove();
        // gGuiControls.__folders["Annotation"].domElement.parentNode.parentNode.removeChild(gGuiControls.__folders["Annotation"].domElement.parentNode);
        gGuiControls.__folders["Annotation"] = undefined;

        gGuiControls.__layer_row.remove();

    }

    gGuiControls.addFolder("Annotation");

    if (gScene && gScene.children.length > 0) {

        delete gMesh.userData.labelID;

        for (var i = gScene.children.length - 1; i >= 0; i--) {
            const object = gScene.children[i];
            if ('geometry' in object && 'material' in object) {
                object.geometry.dispose();
                object.material.dispose();
            }

            gScene.remove(object);
        }

        gRenderer.dispose();
    }

    gAnnotationData.forEach(function (item) {
        delete item._aabbInScene;
        delete item._labelTitleInScene;
    });

    gAnnotationData.clear();
    gGraphCutAnnoData.clear();
    isPLYLoaded = false;
    isXMLLoaded = false;
    gCommandStack.clear();
    gGraphCutData = {colors: [], labels: [], color_map: []};
    gOriData = {colors: [], labels: []};

    gListOfAnnoData = [];

    gCamera = new THREE.PerspectiveCamera(10, WEBGL_RENDERER_ASPECT(), WEBGL_CAMERA_NEAR, WEBGL_CAMERA_FAR);
    gCamera.position.set(20, 40, 40);
    gLight.forEach(function (item) {
        gCamera.add(item);
    });

    gScene = new THREE.Scene();

}

function postLoadScene() {

    // Axis helper
    var axes = new THREE.AxisHelper(1);
    gScene.add(axes);

    // renderer
    gRenderer = new THREE.WebGLRenderer({antialias: true});
    gRenderer.setClearColor(0xf0f0f0);
    gRenderer.setPixelRatio(window.devicePixelRatio);
    gRenderer.setSize(WEBGL_RENDERER_WIDTH(), WEBGL_RENDERER_HEIGHT());

    let container = $("#glcanvas_viewer");
    container.append(gRenderer.domElement);

    gGuiControls.width = WEBGL_RENDERER_WIDTH() / 7.0;

    gOrbitControl = new THREE.OrbitControls(gCamera, gRenderer.domElement);
    gOrbitControl.userPanSpeed = 0.1;
    gOrbitControl.minPolarAngle = 0;
    gOrbitControl.maxPolarAngle = Math.PI;
    gOrbitControl.zoomIn(2);

    gStats = new Stats();
    gStats.domElement.style.top = "";
    gStats.domElement.style.bottom = '0px';
    container.append(gStats.dom);

    // resize
    window.addEventListener('resize', onWindowResize, false);

    gRenderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    gRenderer.domElement.addEventListener('dblclick', onDocumentDblClick, false);
    gRenderer.domElement.addEventListener('touchstart', onDocumentTouchStart, false);

    // For startDraw, stopDraw, doDraw, used to draw a continuous line by mouse
    //gRenderer.domElement.addEventListener('mousedown', startDraw, false);
    gRenderer.domElement.addEventListener('mouseup', stopDraw, false);
    gRenderer.domElement.addEventListener('mousemove', doDraw, false);

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

function writeLineLog(strMessage) {

    var infoString = $('#info').html();
    infoString += strMessage;
    infoString += "<br />";
    $('#info').html(infoString);

}

function writeGeometryInfoToLog(geometry) {
    writeLineLog(geometry.name);
    writeLineLog("- Number of vertices: " + "\t" + geometry.vertices.length.toString());
    writeLineLog("- Number of faces: " + "\t" + geometry.faces.length.toString());
}

function loadFromPLYAndXMLPath(PLYFilePath, XMLFilePath) {
    preLoadScene();

    // PLY file
    var loader = new THREE.PLYLoader();
    loader.load(PLYFilePath, function (geometry) {

        isPLYLoaded = true;

        var annotationArr;
        var graphCutOut;
        var graphCutAnnoArr;

        gGeoColors = geometry.attributes.color;
        gGeoNormals = geometry.attributes.normal;
        gGeoVertices = geometry.attributes.position;
        gGeoIndex = geometry.index;

        gMeshObject = new MeshObject(geometry);

        geometry.attributes.arrLabels = [];
        geometry.attributes.arrColors = [];

        geometry.attributes.arrLabels.push(geometry.attributes.labels.array.slice());

        var tmpColorArr = [];
        for (let i = 0; i < geometry.attributes.color.count * geometry.attributes.color.itemSize; i += geometry.attributes.color.itemSize) {
            tmpColorArr.push(new THREE.Color(geometry.attributes.color.array[i], geometry.attributes.color.array[i + 1], geometry.attributes.color.array[i + 2]));
        }

        geometry.attributes.arrColors.push((tmpColorArr));

        if (guiRunMRFObj.runMRF) {

            [geometry, annotationArr, graphCutOut, graphCutAnnoArr] = execGraphCutMRF(geometry, true);

            gAnnotationData = annotationArr[0];
            gListOfAnnoData.push(gAnnotationData);
            isXMLLoaded = true;
            var folderAnnotation = gGuiControls.__folders["Annotation"];

            for ([key, val] of gAnnotationData) {
                val.addColorControllerToFolder(folderAnnotation);
            }
            folderAnnotation.open();

        } else {

            [geometry, graphCutOut, graphCutAnnoArr] = execGraphCutMRF(geometry, false);

        }

        gGraphCutData.labels = graphCutOut.label_vec;
        gGraphCutData.colors = graphCutOut.color_vec;
        gGraphCutData.color_map = graphCutOut.color_map;

        gGraphCutAnnoData = graphCutAnnoArr;

        geometry.computeVertexNormals();

        if (gLightIsEnabled) {
            gMesh = new THREE.Mesh(geometry, gArrMaterials.PhongMaterial);
            gScene.add(gCamera);
        } else {
            gMesh = new THREE.Mesh(geometry, gArrMaterials.BasicMaterial);
        }

        gScene.add(gMesh);

        geometry.name = /[^\\/]+$/.exec(PLYFilePath).toString();

        writeGeometryInfoToLog(geometry);

        PLYAndXMLLoaded();

    });

    if (!guiRunMRFObj.runMRF) {
        loadXMLAnnotation(XMLFilePath);
    }

    postLoadScene();

}

function loadFromGeometry(objects) {

    if (arguments.length !== 4) {
        return;
    }

    var geometry = arguments[0];
    var annoInfoArr = arguments[1];
    var graphcutData = arguments[2];
    var graphcutAnnoInfo = arguments[3];

    preLoadScene();

    gGraphCutData.labels = graphcutData.label_vec;
    gGraphCutData.colors = graphcutData.color_vec;
    gGraphCutData.color_map = graphcutData.color_map;

    gGraphCutAnnoData = graphcutAnnoInfo;
    gAnnotationData = annoInfoArr[0];
    gListOfAnnoData = annoInfoArr;

    writeGeometryInfoToLog(geometry);

    geometry.colors = geometry.userData.arrColors[0];
    updateGeometryColorsToFaceVertexColors(geometry);
    geometry.elementsNeedUpdate = true;

    //geometry.computeVertexNormals();

    if (gLightIsEnabled) {
        gMesh = new THREE.Mesh(geometry, gArrMaterials.PhongMaterial);
        gScene.add(gCamera);
    } else {
        gMesh = new THREE.Mesh(geometry, gArrMaterials.BasicMaterial);
    }

    gScene.add(gMesh);

    var folderAnnotation = gGuiControls.__folders["Annotation"];

    gAnnotationData.forEach(function (value) {
        value.addColorControllerToFolder(folderAnnotation);
    });

    folderAnnotation.open();

    postLoadScene();

    isPLYLoaded = true;
    isXMLLoaded = true;

    PLYAndXMLLoaded();

}

/* THREE.JS RENDER LOOP *************************************************/

function animate() {

    gOrbitControl.update();
    gStats.update();
    render();
    requestAnimationFrame(animate);

}

function render() {

    gRenderer.render(gScene, gCamera);

}

/* END OF THREE.JS RENDER LOOP ****************************************/

function updateGeometryColorsToFaceVertexColors(inGeometry) {

    for (var i = 0; i < inGeometry.faces.length; i++) {
        inGeometry.faces[i].vertexColors[0] = inGeometry.colors[inGeometry.faces[i].a];
        inGeometry.faces[i].vertexColors[1] = inGeometry.colors[inGeometry.faces[i].b];
        inGeometry.faces[i].vertexColors[2] = inGeometry.colors[inGeometry.faces[i].c];
    }

    return inGeometry;
}

function loadXMLAnnotation(filePath) {
    var XMLLoader = new THREE.XMLLoader();
    XMLLoader.load(filePath, function (annotationData) {

        var folderAnnotation = gGuiControls.__folders["Annotation"];

        for (var i = 0; i < annotationData.labelID.length; i++) {

            var tmpAnnoInfo = new AnnoInfoElement(annotationData.labelID[i],
                annotationData.labelTitle[i],
                annotationData.labelColor[i],
                annotationData.aabboxes[i]);

            gAnnotationData.set(tmpAnnoInfo.labelID, tmpAnnoInfo);
            gAnnotationData.get(tmpAnnoInfo.labelID).addColorControllerToFolder(folderAnnotation);
        }

        gListOfAnnoData.push(gAnnotationData);

        isXMLLoaded = true;

        folderAnnotation.open();
        PLYAndXMLLoaded();
    });
}

function PLYAndXMLLoaded() {
    if (isPLYLoaded && isXMLLoaded) {
        $('.progress').children().html("PLY&XML post Loading ...");

        var labelIDSet = new Set(gMesh.geometry.userData.labels);

        if (labelIDSet.size !== gAnnotationData.size) {

            for ([key, val] of gAnnotationData) {
                if (!labelIDSet.has(key)) {
                    val.removeColorControllerFromGui();
                    gAnnotationData.delete(key);
                }
            }
        }

        // Generate Region data: push vertices to the corresponding region
        for (let i = 0; i < gMesh.geometry.userData.arrLabels.length; i++) {
            for (let j = 0; j < gMesh.geometry.userData.arrLabels[i].length; j++) {
                // var tmpRegion = gAnnotationData.regions.get(gMesh.geometry.userData.labels[i]);
                // tmpRegion.vertices.push(i);

                var tmpRegion = gListOfAnnoData[i].get(gMesh.geometry.userData.arrLabels[i][j]).getRegion();
                tmpRegion.vertices.push(j);
                gListOfAnnoData[i].get(gMesh.geometry.userData.arrLabels[i][j]).setRegion(tmpRegion);

                // var idx = gAnnotationData.labelID.indexOf(gMesh.geometry.userData.labels[i]);
                // if (!checkSet.has(idx)){
                //     gAnnotationData.labelColor[idx] = gMesh.geometry.colors[i];
                //     checkSet.add(idx);
                // }
            }
        }

        for (var i = 0; i < gGraphCutData.labels.length; i++) {

            var annoItem = gGraphCutAnnoData.get(gGraphCutData.labels[i]);
            var tmpRegion = annoItem.getRegion();
            tmpRegion.vertices.push(i);
            gGraphCutAnnoData.get(gGraphCutData.labels[i]).setRegion(tmpRegion);
            if (gMesh.geometry.userData.labels[i] === gGraphCutData.labels[i]
                && !gMesh.geometry.colors[i].equals(gGraphCutData.colors[i])) {
                gGraphCutData.colors[i] = gMesh.geometry.colors[i];
                annoItem.setLabelColor(gGraphCutData.colors[i]);
            }

        }

        // Layer manager init
        gLayerManager = new LayerManager(gMesh);

        for (let i = 0; i < gMesh.geometry.userData.arrLabels.length; i++) {
            gLayerManager.add(new Layer(gMesh.geometry.userData.arrLabels[i], gMesh.geometry.userData.arrColors[i], gListOfAnnoData[i]));
        }

        gGuiControls.addLayerControl(gLayerManager.lstOfLayer, newLayerHandler, changeLayerHandler, deleteLayerHandler);

        if (gbShowAllAnnotation) {
            showAllAnnotation(gAnnotationData);
        }

        var downloadBtnElement = document.createElement("a");
        downloadBtnElement.className = "btn btn-primary";
        downloadBtnElement.setAttribute("role", "button");
        downloadBtnElement.innerHTML = "<span class=\"glyphicon glyphicon-download-alt\"></span> Download";

        downloadBtnElement.addEventListener("click", function () {
            downloadMesh(gMesh)
        }, false);
        $('#downloadscene-btn').append(downloadBtnElement);

        document.body.removeChild(gProgressElement);

        $("#infoButton")
            .text("") // sets text to empty
            .css(
                {
                    "z-index": "2",
                    "background": "rgba(0,0,0,0)", "opacity": "0.9",
                    "position": "absolute", "bottom": "4px", "left": "210px"
                }) // adds CSS
            .append('<a class="btn btn-primary" role="button"><span class="glyphicon glyphicon-info-sign"></span> Help</a>')
            .button()
            .click(
                function () {
                    $("#infoBox").dialog("open");
                });

        $("#runMRF-btn")
            .text("")
            .css({
                position: "absolute",
                bottom: "4px",
                left: "300px",
            })
            .append('<a class="btn btn-primary" role="button"> Run MRF</a>')
            .button()
            .click(
                function () {
                   var tmpGeo, tmpAnno;
                   var tmpArrLabels = [], tmpArrColors = [];

                   var tmpCopiedGeo = gMesh.geometry.clone();

                   tmpGeo = new THREE.BufferGeometry().fromGeometry(tmpCopiedGeo);

                   tmpGeo.attributes.color = gGeoColors;
                   tmpGeo.attributes.normal = gGeoNormals;
                   tmpGeo.attributes.position = gGeoVertices;
                   tmpGeo.index = gGeoIndex;

                    for (var i = 0; i < gLayerManager.countLayer(); i++) {
                       tmpArrLabels.push(gLayerManager.lstOfLayer[i].labels);
                       tmpArrColors.push(gLayerManager.lstOfLayer[i].colors);
                   }

                    tmpGeo.attributes.arrLabels = tmpArrLabels;
                    tmpGeo.attributes.arrColors = tmpArrColors;

                    var newColor, newLabel, newAnno;
                    var graphCutParams = {label_vec: gGraphCutData.labels, color_vec: [], color_map: []};

                    graphCutParams.color_vec = gGraphCutData.colors.map(function (item) {
                        return {x: item.r, y: item.g, z: item.b};
                    });

                    graphCutParams.color_map = gGraphCutData.color_map.map(function(item) {
                        if (item) {
                            return {x: item.r, y: item.g, z: item.b, w: 0};
                        } else {
                            return item;
                        }
                    });

                    [newColor, newLabel, newAnno] = execMRF(graphCutParams);

                    gLayerManager.currentLayer.labels = newLabel;
                    gLayerManager.currentLayer.colors = newColor;
                    gLayerManager.currentLayer.annotationInfo = newAnno;

                    for (let i = 0; i < newLabel.length; i++) {
                            var tmpAnno = newAnno.get(newLabel[i]);
                            var tmpRegion = tmpAnno.getRegion();
                            tmpRegion.vertices.push(i);
                            tmpAnno.setRegion(tmpRegion);
                    }

                    gLayerManager.currentLayer.show(gMesh);

                });

        updateAnnotationModeInfo();

    }

}

function showAllAnnotation(annotationData) {

    for (var [labelID, annoInfo] of annotationData) {

        if (annoInfo.aabBox === null) {
            annoInfo.aabBox = annoInfo.region.getBoundingBox();
        }

        if (!annoInfo.annotationIsInScene()) {
            annoInfo.addAnnotationToScene(gScene);
        }
    }

}

/***************************************
 * The function return the point of the given face which is nearest the given point
 * @param face: THREE.Face3
 * @param pointOnFace: THREE.Vector3
 * @return THREE.Vector3
 * **************************************/
function getNearestVertexIdxOfFace(face, pointOnFace) {
    var d1 = gMesh.geometry.vertices[face.a].distanceTo(pointOnFace);
    var d2 = gMesh.geometry.vertices[face.b].distanceTo(pointOnFace);
    var d3 = gMesh.geometry.vertices[face.c].distanceTo(pointOnFace);

    var result = face.a;
    var minDistance = d1;

    if (minDistance > d2) {
        minDistance = d2;
        result = face.b;
    }

    if (minDistance > d3) {
        result = face.c
    }

    return result;
}

function drawAabbox(inAabb, xcolor) {

    if (inAabb === null) {
        return null;
    }

    var vertex_indx = [
        new THREE.Vector3(inAabb.min.x, inAabb.min.y, inAabb.min.z),  //0
        new THREE.Vector3(inAabb.max.x, inAabb.min.y, inAabb.min.z),  //1
        new THREE.Vector3(inAabb.max.x, inAabb.min.y, inAabb.max.z),  //2
        new THREE.Vector3(inAabb.min.x, inAabb.min.y, inAabb.max.z),  //3
        new THREE.Vector3(inAabb.min.x, inAabb.max.y, inAabb.min.z),  //4
        new THREE.Vector3(inAabb.max.x, inAabb.max.y, inAabb.min.z),  //5
        new THREE.Vector3(inAabb.max.x, inAabb.max.y, inAabb.max.z),  //6
        new THREE.Vector3(inAabb.min.x, inAabb.max.y, inAabb.max.z)   //7
    ];
    var tmpGeometry = new THREE.Geometry();
    var indices = [0, 1, 2, 3, 0, 4, 5, 1, 2, 6, 5, 4, 7, 6, 7, 3, 1, 2, 5, 6, 0, 3, 4, 7]; //Used to draw LineSegment
    //var indices = [0, 6]; //Used to draw LineSegment

    for (var i = 0; i < indices.length; ++i) {
        tmpGeometry.vertices.push(vertex_indx[indices[i]]);
        tmpGeometry.colors.push(new THREE.Color(xcolor));
    }

    var annotationMaterial = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    //var lineOfBox = new THREE.Line( tmpGeometry, annotationMaterial, THREE.LinePieces ); //LinePieces is deprecated
    var lineOfBox = new THREE.LineSegments(tmpGeometry, annotationMaterial);

    return lineOfBox;

}

function drawLabel(xtext, aabb, xcolor) {

    if (xtext === "" || xtext === ".") {
        return null;
    }

    var canvas1 = document.createElement('canvas');
    canvas1.width = 256;
    canvas1.height = 256;
    var context1 = canvas1.getContext('2d');
    context1.textAlign = "center";
    context1.font = "Bold 24pt Arial";
    context1.fillStyle = "#" + xcolor.getHexString();
    context1.shadowBlur = 20;
    context1.shadowColor = "black";
    context1.fillText(xtext, 256 / 2, 256 / 2);
    var texture1 = new THREE.Texture(canvas1);
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial({map: texture1, side: THREE.DoubleSide});
    material1.transparent = true;

    var spriteMaterial = new THREE.SpriteMaterial({map: texture1});
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set((aabb.max.x + aabb.min.x) / 2,
        (aabb.max.y) + 0.05,
        (aabb.min.z + aabb.max.z) / 2);

    return sprite;

}

function downloadMesh___(inMesh, filename) {

    var zip = new JSZip();
    var exporter = new THREE.PLYBinaryExporter();
    var outputFile = exporter.parse(inMesh);
    var file = new Blob([outputFile], {type: "application/octet-binary;charset=utf-8"});

    exporter = new XMLExporter();
    outputFile = exporter.export(gAnnotationData);
    var file2 = new Blob([outputFile], {type: "application/xml;charset=utf-8"});

    zip.file(inMesh.geometry.name, file);
    zip.file(inMesh.geometry.name.toString().replace(/ply/g, "xml"), file2);

    zip.generateAsync({type: "blob", compression: "DEFLATE", compressionOptions: {level: 5}}).then(function (blob) {
        var a = document.createElement("a"), url = URL.createObjectURL(blob);
        a.download = "export_" + inMesh.geometry.name.toString().replace(/ply/g, "zip");
        a.href = url;
        a.click();
    }, function (err) {
        jQuery("#data_uri").text(err);
    });

}

function downloadMesh(inMesh, filename) {

    var strFileName = inMesh.geometry.name.toString().split('.')[0];
    var zip = new JSZip();
    var exporter = new THREE.PLYBinaryExporter3();
    var outputFile = exporter.parse(inMesh);
    var file = new Blob([outputFile], {type: "application/octet-binary;charset=utf-8"});
    zip.file(strFileName + ".ply", file);

    var lblExporter = new LabelExporter();

    var colorArr = [];
    var labelArr = [];

    for (let i = 0; i < gLayerManager.countLayer(); i++) {
        colorArr.push(gLayerManager.lstOfLayer[i].colors);
        labelArr.push(gLayerManager.lstOfLayer[i].labels);
    }

    var lblOutputFile = lblExporter.export(labelArr);

    zip.file(strFileName + ".lbl", lblOutputFile);

    exporter = new XMLExporter();
    for (let i = 0; i < gLayerManager.countLayer(); i++) {
        outputFile = exporter.export(gLayerManager.lstOfLayer[i].annotationInfo);
        var file2 = new Blob([outputFile], {type: "application/xml;charset=utf-8"});
        zip.file(strFileName + "_" + gLayerManager.lstOfLayer[i].layerID + ".xml", file2);
    }

    zip.generateAsync({type: "blob", compression: "DEFLATE", compressionOptions: {level: 5}}).then(function (blob) {
        var a = document.createElement("a"), url = URL.createObjectURL(blob);
        a.download = "export_" + strFileName + ".zip";
        a.href = url;
        a.click();

    }, function (err) {
        jQuery("#data_uri").text(err);
    });

}


function updateLabelTextInScence(id, newText) {

    var currentText = gAnnotationData.get(id).getLabelText();
    if (currentText === newText)
        return;
    gAnnotationData.get(id).removeLabelFromScene(gScene);
    gAnnotationData.get(id).setLabelText(newText);
    gAnnotationData.get(id).addLabelToScene(gScene);

}

function hideAllAnnotation() {

    for (var [labelID, annoInfo] of gAnnotationData) {
        annoInfo.removeAnnotationFromScene(gScene);
    }

}

/****************************/

var gLstOfLines = [];
var gLastPoint = null;
var gSetOfLabelForMerging = new Set();
var gSetOfVertexIdx = new Set();

function startDraw(event) {

    if (!isShiftKeyPressed && !isExtractMode)
        return;

    var vectorMouse = new THREE.Vector2(
        ( (event.clientX - gRenderer.domElement.offsetLeft) / gRenderer.domElement.clientWidth ) * 2 - 1,
        -( (event.clientY - gRenderer.domElement.offsetTop) / gRenderer.domElement.clientHeight ) * 2 + 1);

    gLastPoint = vectorMouse;

    //console.debug("StartDraw");

}

function clearDraw() {
    for (var i = 0; i < gLstOfLines.length; i++) {
        gScene.remove(gLstOfLines[i]);
    }
    gLstOfLines = [];

    gLastPoint = null;
    //console.debug("--------------STOP------------------");
    gSetOfLabelForMerging.clear();
    gSetOfVertexIdx.clear();
}

function stopDraw(event) {

    if (!isShiftKeyPressed && !isExtractMode)
        return;

    if (gSetOfLabelForMerging.size > 0) {
        var arrTobeMerged = [];
        var arrAnnoOri = [];

        if (isShiftKeyPressed) {
            gSetOfLabelForMerging.forEach(function (labelID) {
                arrTobeMerged.push(gAnnotationData.get(labelID))
            });
            gCommandStack.pushAndDo(new MergeCommand(arrTobeMerged));

            // console.debug(Array.from(gSetOfVertexIdx));
            // console.debug(arrTobeMerged);

        } else if (isExtractMode) {
            var setOfLabelOnOri = new Set();

            gSetOfVertexIdx.forEach(function (vertexIdx) {
                setOfLabelOnOri.add(gOriData.labels[vertexIdx])
            });

            gSetOfLabelForMerging.forEach(function (labelID) {
                arrTobeMerged.push(gGraphCutAnnoData.get(labelID))
            });

            setOfLabelOnOri.forEach(function (labelID) {
                arrAnnoOri.push(gAnnotationData.get(labelID));
            });

            // console.log(Array.from(gSetOfVertexIdx));
            // console.log(arrTobeMerged);
            // console.log(arrAnnoOri);
            gCommandStack.pushAndDo(new ExtractCommand(arrTobeMerged, arrAnnoOri));

        }
    }

    clearDraw();

}

function doDraw(event) {

    if (!isShiftKeyPressed && !isExtractMode) {
        clearDraw();
        return;
    }

    var vectorMouse = new THREE.Vector2(
        ( (event.clientX - gRenderer.domElement.offsetLeft) / gRenderer.domElement.clientWidth ) * 2 - 1,
        -( (event.clientY - gRenderer.domElement.offsetTop) / gRenderer.domElement.clientHeight ) * 2 + 1);

    if (gLastPoint) {
        drawAndFillLineByMouse(gLastPoint, vectorMouse);
        gLastPoint = vectorMouse;
    }

}

function drawAndFillLineByMouse(mousePoint1, mousePoint2) {

    var intersect1 = intersect2DMousePointToMesh(mousePoint1);
    var intersect2 = intersect2DMousePointToMesh(mousePoint2);

    if (intersect1.length === 0 || intersect2.length === 0)
        return;

    var tmpVertexIdx1 = getNearestVertexIdxOfFace(intersect1[0].face, intersect1[0].point);
    var tmpVertexIdx2 = getNearestVertexIdxOfFace(intersect2[0].face, intersect2[0].point);
    var tmpLabelID1 = gMesh.geometry.userData.labels[tmpVertexIdx1];
    var tmpLabelID2 = gMesh.geometry.userData.labels[tmpVertexIdx2];

    gSetOfLabelForMerging.add(tmpLabelID1);
    gSetOfLabelForMerging.add(tmpLabelID2);
    gSetOfVertexIdx.add(tmpVertexIdx1);
    gSetOfVertexIdx.add(tmpVertexIdx2);

    drawLineOnMesh(intersect1[0].point, intersect2[0].point);

}

function drawLineOnMesh(vec3Point1, vec3Point2) {

    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 10
    });

    var geometry = new THREE.Geometry();
    geometry.vertices.push(vec3Point1);
    geometry.vertices.push(vec3Point2);
    var line = new THREE.Line(geometry, material);

    gLstOfLines.push(line);
    gScene.add(line);
}

function intersect2DMousePointToMesh(mouse2DPoint) {
    gCamera.aspect = WEBGL_RENDERER_ASPECT();
    var raycaster = new THREE.Raycaster();
    raycaster.near = WEBGL_CAMERA_NEAR;
    raycaster.setFromCamera(mouse2DPoint, gCamera);
    return raycaster.intersectObject(gMesh);

}

function findLabelIDByClientXY(clientX, clientY) {

    gMousePosition.x = ( (clientX - gRenderer.domElement.offsetLeft) / gRenderer.domElement.clientWidth ) * 2 - 1;
    gMousePosition.y = -( (clientY - gRenderer.domElement.offsetTop) / gRenderer.domElement.clientHeight ) * 2 + 1;

    gCamera.aspect = WEBGL_RENDERER_ASPECT();

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(gMousePosition, gCamera);
    raycaster.near = WEBGL_CAMERA_NEAR;
    var intersects = raycaster.intersectObject(gMesh);

    if (intersects.length > 0) {

        var vertexIdx = getNearestVertexIdxOfFace(intersects[0].face, intersects[0].point);
        var labelID = gMesh.geometry.userData.labels[vertexIdx];
        return labelID;

    } else {

        return null;

    }

}

function newLayerHandler() {

    var inputModal = $("#myModal");

    inputModal.find("#layername").val("");
    inputModal.modal();

}

function changeLayerHandler(optElement) {

    hideAllAnnotation();
    var layerID = parseInt(optElement.value);
    gLayerManager.showByLayerID(layerID);

    gCommandStack.clear();

    updateAnnotationModeInfo();
}

function deleteLayerHandler(selectList) {

    if (gLayerManager.countLayer() <= 1)
        return;

    gLayerManager.removeCurrentLayer();

    selectList[selectList.selectedIndex].remove();

}

function updateAnnotationModeInfo(){
    $("#annotation-mode")
        .text("Annotation mode: " + gLayerManager.currentLayer.annotationMode)
        .css({
            "position": "absolute",
            "bottom": "4px",
            "left": "400px"
        })
}