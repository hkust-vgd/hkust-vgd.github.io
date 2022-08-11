/* BEGIN Region structure ***********************************/
function Region(lid, vertices)
{
    this.lid = lid;    				// LabelID
    this.vertices = vertices;       // List of VertexIdx
    this.color = 0;
}

Region.prototype.getBoundingBox = function () {
    var aabb = new THREE.Box3();
    for (var i = 0; i < this.vertices.length; i++) {
        aabb.expandByPoint(gMesh.geometry.vertices[this.vertices[i]])
    }
    return aabb;
};

Region.prototype.verticesCount = function () {
    return this.vertices.length;
};

Region.prototype.updateToScene = function (dstMesh) {

    var dstGeometry = dstMesh.geometry;

    for (var i = 0; i < this.vertices.length; i++) {
        dstGeometry.colors[i] = this.color;
    }

    dstMesh.geometry = updateGeometryColorsToFaceVertexColors(dstGeometry);

    return dstMesh;
};

Region.prototype.clone = function () {
    return new Region(this.lid, this.vertices.slice(), this.color);
};

/* END Region structure ***********************************/


/* BEGIN Layer structure ************************************/
var Layer = function (labels, colors, annoInfo) {

    this.layerID = Layer.countID++;

    this.layerName = "Layer " + this.layerID.toString();

    this.labels = labels.slice();
    this.colors = colors.slice();

    this.annotationInfo = cloneAnnoMap(annoInfo);

    this.annotationMode = "freestyle";

};

Layer.prototype = {

    show: function (mainMesh) {

        let mainScene = mainMesh.parent;
        // Update color
        mainMesh.geometry.colors = this.colors;
        updateGeometryColorsToFaceVertexColors(mainMesh.geometry);
        mainMesh.geometry.elementsNeedUpdate = true;

        // Update labelID
        mainMesh.geometry.userData.labels = this.labels;

        // Update Annotation
        gGuiControls.__folders["Annotation"].domElement.parentNode.parentNode.removeChild(gGuiControls.__folders["Annotation"].domElement.parentNode);
        gGuiControls.__folders["Annotation"] = undefined;

        gAnnotationData = this.annotationInfo;

        var datguiCtrl = gGuiControls.addFolder("Annotation");

        for ([key, val] of gAnnotationData) {
            val.addColorControllerToFolder(datguiCtrl);
        }

        datguiCtrl.open();

    },

    clone: function () {

        var clonedLayer = new Layer(this.labels.slice(), this.colors.slice(), cloneAnnoMap(this.annotationInfo));
        return clonedLayer;

    }

};

function cloneAnnoMap(annoMap) {
    let clonedMap = new Map();
    for ([key, val] of annoMap) {
        clonedMap.set(key, val.clone());
    }
    return clonedMap;
}

Layer.countID = 0;
Layer.resetCountID = function () {
    Layer.countID = 0
};

/* END Layer structure ************************************/

/* LayerManager structure *********************************/

var LayerManager = function (objects) {

    let _this = this;
    this.lstOfLayer = [];
    this._mainMesh = null;

    Array.from(arguments).slice().forEach(function (val) {
        if (val instanceof THREE.Mesh) {
            _this._mainMesh = val;
        }
    });

    this.currentLayer = null;

    Layer.resetCountID();

};

LayerManager.prototype = {

    add: function (newLayer) {

        this.lstOfLayer.push(newLayer);

        if (this.lstOfLayer.length === 1) {
            this.currentLayer = this.lstOfLayer[0];
        }

    },

    showByLayerID: function (layerID) {

        let layerItem = null;

        for (let i = 0; i < this.lstOfLayer.length; i++) {

            if (this.lstOfLayer[i].layerID === layerID) {

                layerItem = this.lstOfLayer[i];
                layerItem.show(this._mainMesh);
                this.currentLayer = layerItem;

                return true;

            }
        }

        return false;

    },

    countLayer: function () {
        return this.lstOfLayer.length;
    },

    removeCurrentLayer: function () {

        for (var i = 0; i < this.lstOfLayer.length; i++) {
            if (this.lstOfLayer[i].layerID === this.currentLayer.layerID) {

                for (j = i; j < this.lstOfLayer.length - 1; j++) {
                    this.lstOfLayer[j] = this.lstOfLayer[j + 1];
                }
                this.lstOfLayer.length--;
            }
        }
        this.currentLayer = this.lstOfLayer[0];
        this.currentLayer.show(this._mainMesh);

    }

};

/* END LayerManager structure *****************************/

/********************************************************
 *
 */

function AnnoInfoElement(nLabelID, sLabelTitle, labelColor, aabBox, region) {

    this.labelID = nLabelID;
    this.labelColor = labelColor;
    this.labelTitle = sLabelTitle;

    this.aabBox = (aabBox === undefined) ? null : aabBox;

    this._aabbInScene = null;
    this._aabbIsInScene = false;
    this._aabbParent = null;

    this._labelTitleInScene = null;
    this._labelIsInScene = false;
    this._labelParent = null;

    this._parentScene = null;

    this._colorControllerItem = null;

    if (region === undefined) {

        this.region = new Region(nLabelID, []);

    } else {

        this.region = region;

    }

}

AnnoInfoElement.prototype = {

    updateAnnotationInScene: function () {

        if (this.labelIsInScene())
            this._parentScene.remove(this._aabbInScene);
        if (this.aabbIsInScene())
            this._parentScene.remove(this._labelTitleInScene);

        this._aabbInScene = drawAabbox(this.aabBox, this.labelColor);
        this._labelTitleInScene = drawLabel(this.labelTitle, this.aabBox, this.labelColor);

        if (this.labelIsInScene())
            this._parentScene.add(this._aabbInScene);
        if (this.aabbIsInScene() && this._labelTitleInScene) {
            this._parentScene.add(this._labelTitleInScene);
        }

    },

    getAabbInScene: function () {

        if (!this._aabbInScene) {
            this._aabbInScene = drawAabbox(this.aabBox, this.labelColor);
        }

        return this._aabbInScene;
    },

    getLabelTitleInScene: function () {

        if (!this._labelTitleInScene) {
            this._labelTitleInScene = drawLabel(this.labelTitle, this.aabBox, this.labelColor);
        }

        return this._labelTitleInScene;
    },

    setLabelColor: function (newColor) {
        this.labelColor = newColor;
        this.updateAnnotationInScene();
    },

    getAabBox: function () {
        return this.aabBox;
    },

    setAabBox: function (newAabBox) {
        this.aabBox = newAabBox;
        this.updateAnnotationInScene();

    },

    getLabelText: function () {
        return this.labelTitle;
    },

    setLabelText: function (newText) {
        this.labelTitle = newText;
        this._labelTitleInScene = drawLabel(this.labelTitle, this.aabBox, this.labelColor);
    },

    setRegion: function (newRegion) {
        this.region = newRegion;
        this.setAabBox(this.region.getBoundingBox());
    },

    getRegion: function () {
        return this.region;
    },

    addAabbToScene: function (dstScene) {
        if (!this.aabbIsInScene()) {
            if (this._parentScene) {
                this._parentScene.add(this.getAabbInScene());
            } else {
                this._parentScene = dstScene.add(this.getAabbInScene());
            }
            this._aabbIsInScene = true;
        }
        return this._aabbInScene;
    },

    addLabelToScene: function (dstScene) {
        if (!this.labelIsInScene()) {
            var tmpItem = this.getLabelTitleInScene();
            if (tmpItem) {
                this._labelTitleInScene = tmpItem;
                if (this._parentScene) {
                    this._parentScene.add(tmpItem);
                } else {
                    this._parentScene = dstScene.add(tmpItem);
                }
            }
            this._labelIsInScene = true;
        }
        return this._labelTitleInScene;
    },

    removeAabbFromScene: function (dstScene) {
        if (this.aabbIsInScene()) {
            this._parentScene.remove(this._aabbInScene);
            this._aabbIsInScene = false;
        }

    },

    removeLabelFromScene: function (dstScene) {
        if (this.labelIsInScene()) {
            this._parentScene.remove(this._labelTitleInScene);
            this._labelIsInScene = false;
        }
    },

    removeAnnotationFromScene: function (dstScene) {
        this.removeAabbFromScene(dstScene);
        this.removeLabelFromScene(dstScene);
    },

    addAnnotationToScene: function (dstScene) {
        this.addAabbToScene(dstScene);
        this.addLabelToScene(dstScene);
    },

    labelIsInScene: function () {
        return (this._labelIsInScene);
    },

    aabbIsInScene: function () {
        return (this._aabbIsInScene);
    },

    annotationIsInScene: function () {
        return this.labelIsInScene() && this.aabbIsInScene();
    },

    addColorControllerToFolder: function (datguiFolder) {

        var tmpForAddColor = {color: "#" + this.labelColor.getHexString()};
        var tmpItem = datguiFolder.addColor(tmpForAddColor, 'color').labelBox(this.labelTitle).id(this.labelID);
        tmpItem = tmpItem.onkeyup(editLabelTitle);
        tmpItem = tmpItem.onfocus(onFocusLabelInputBox);
        tmpItem = tmpItem.onblur(onBlurLabelInputBox);
        tmpItem = tmpItem.ondblclick(onDblClickLabelInputBox);
        var colorValStr = tmpItem.__li.firstElementChild.children[1].children[0].value;
        tmpItem.__li.firstElementChild.children[1].children[0].value = "";
        tmpItem.__li.firstElementChild.children[1].children[0].addEventListener("blur", function () {
            this.value = ""
        });
        tmpItem.__li.firstElementChild.children[1].children[0].setAttribute("readonly", "");
        tmpItem.__li.firstElementChild.children[1].children[0].setAttribute("title", colorValStr);
        tmpItem.__li.firstElementChild.children[1].children[1].remove();

        this._colorControllerItem = tmpItem;

        return this._colorControllerItem;
    },

    removeColorControllerFromGui: function () {
        if (this._colorControllerItem) {
            this._colorControllerItem.remove();
            this._colorControllerItem = null;
        }
    },

    clone: function () {
        return new AnnoInfoElement(this.labelID, this.labelTitle, this.labelColor.clone(), (this.aabBox !== null) ? this.aabBox.clone() : null, this.region.clone());
    }

};

/********************************************************/


/********************************************************
 * Merge Command
 */

var MergeCommand = function () {

    if (arguments.length === 1 && arguments[0] instanceof Array) {
        this._ArrAnno = arguments[0];
    } else if (arguments.length === 2 && arguments[0] instanceof AnnoInfoElement && arguments[1] instanceof AnnoInfoElement) {
        this._ArrAnno = [arguments[0], arguments[1]];
    }

};

MergeCommand.prototype = {

    execute: function () {

        if (this._ArrAnno.length < 2)
            return;

        for (var i = 0; i < this._ArrAnno.length; i++) {
            this._ArrAnno[i].removeAnnotationFromScene(gScene);
        }

        for (var i = 1; i < this._ArrAnno.length; i++) {

            (function (firstAnno, secondAnno) {
                // Change label in mesh, change region data
                var needToBeUpdatedRegion = secondAnno.getRegion();
                var mergedRegion = firstAnno.getRegion();

                for (var i = 0; i < needToBeUpdatedRegion.vertices.length; i++) {
                    gMesh.geometry.userData.labels[needToBeUpdatedRegion.vertices[i]] = firstAnno.labelID;
                    gMesh.geometry.colors[needToBeUpdatedRegion.vertices[i]] = firstAnno.labelColor;
                    mergedRegion.vertices.push(needToBeUpdatedRegion.vertices[i]);
                }

                firstAnno.setRegion(mergedRegion);

                gAnnotationData.delete(secondAnno.labelID);
                secondAnno.removeColorControllerFromGui();
            })(this._ArrAnno[0], this._ArrAnno[i]);
        }

        if (gbShowAllAnnotation) {
            this._ArrAnno[0].addAnnotationToScene(gScene);
        } else {
            this._ArrAnno[0].removeAnnotationFromScene(gScene);
        }

        // Update Geometry.Colors (used by lines) to Geometry.faces[].vertexColors (used by faces)
        gMesh.geometry = updateGeometryColorsToFaceVertexColors(gMesh.geometry);
        // Trigger update
        gMesh.geometry.elementsNeedUpdate = true;

    },

    undo: function () {

        if (this._ArrAnno.length < 2)
            return;

        this._ArrAnno[0].removeAnnotationFromScene(gScene);

        for (var i = 1; i < this._ArrAnno.length; i++) {
            (function (firstAnno, secondAnno) {
                var needToBeUpdatedRegion = secondAnno.getRegion();
                var unMergedRegion = firstAnno.getRegion();

                for (var i = 0; i < needToBeUpdatedRegion.vertices.length; i++) {
                    gMesh.geometry.userData.labels[needToBeUpdatedRegion.vertices[i]] = secondAnno.labelID;
                    gMesh.geometry.colors[needToBeUpdatedRegion.vertices[i]] = secondAnno.labelColor;
                    unMergedRegion.vertices = unMergedRegion.vertices.filter((val) => (val !== needToBeUpdatedRegion.vertices[i]));
                }

                firstAnno.setRegion(unMergedRegion);

                gAnnotationData.set(secondAnno.labelID, secondAnno);
                secondAnno.addColorControllerToFolder(gGuiControls.__folders["Annotation"]);
                if (gbShowAllAnnotation) {
                    secondAnno.addAnnotationToScene(gScene);
                }
            })(this._ArrAnno[0], this._ArrAnno[i]);
        }

        if (gbShowAllAnnotation) {
            this._ArrAnno[0].addAnnotationToScene(gScene);
        } else {
            this._ArrAnno[0].removeAnnotationFromScene(gScene);
        }

        // Update Geometry.Colors (used by lines) to Geometry.faces[].vertexColors (used by faces)
        gMesh.geometry = updateGeometryColorsToFaceVertexColors(gMesh.geometry);
        // Trigger update
        gMesh.geometry.elementsNeedUpdate = true;

    }
};
/*******************************************************/


/************
 * Extract Command
 */

var ExtractCommand = function () {

    if (arguments[0] instanceof Array && arguments.length === 2) {
        this._ArrAnno = arguments[0];
        this._OriAnno = arguments[1];
        this._storedOriRegionsVertices = [];
    }

};

ExtractCommand.prototype = {

    execute: function () {

        var annoGuiFolder = gGuiControls.__folders["Annotation"];

        var mergedRegionVertices = this._ArrAnno[0].getRegion().vertices.slice(0);
        var mergedRegion = new Region(this._ArrAnno[0].labelID, mergedRegionVertices);
        var mergedAnno = new AnnoInfoElement(this._ArrAnno[0].labelID, this._ArrAnno[0].labelTitle, this._ArrAnno[0].labelColor, this._ArrAnno[0].aabBox, mergedRegion);

        // Merge by using GraphCut regions
        for (var i = 1; i < this._ArrAnno.length; i++) {
            var itemRegion = this._ArrAnno[i].getRegion();
            mergedRegion.vertices = mergedRegion.vertices.concat(itemRegion.vertices);
        }

        mergedAnno.setRegion(mergedRegion);

        // Change related region in Ori (gAnnotation)
        for (var i = 0; i < this._OriAnno.length; i++) {

            var oriRegion = this._OriAnno[i].getRegion();

            this._storedOriRegionsVertices.push(oriRegion.vertices.slice(0));

            oriRegion.vertices = oriRegion.vertices.filter(function (item) {

                if (mergedRegion.vertices.includes(item))
                    return false;
                else
                    return true;

            });

            // if oriRegion empty, delete it (gAnnotation)
            if (oriRegion.vertices.length === 0) {
                this._OriAnno[i].removeAnnotationFromScene(gScene);
                this._OriAnno[i].removeColorControllerFromGui(annoGuiFolder);
                gAnnotationData.delete(this._OriAnno[i].labelID);
            } else {

                this._OriAnno[i].setRegion(oriRegion);
            }
        }

        // Update colors, labelIDs

        for (var i = 0; i < mergedRegion.vertices.length; i++) {
            gOriData.labels[mergedRegion.vertices[i]] = mergedAnno.labelID;
            gOriData.colors[mergedRegion.vertices[i]] = mergedAnno.labelColor;
            gMesh.geometry.colors[mergedRegion.vertices[i]] = mergedAnno.labelColor;
        }

        if (gAnnotationData.has(mergedAnno.labelID)) {
            var lstVerInOri = gAnnotationData.get(mergedAnno.labelID).getRegion().vertices;
            var mergedReg2 = mergedAnno.getRegion();
            mergedReg2.vertices = mergedReg2.vertices.concat(lstVerInOri);
            mergedAnno.setRegion(mergedReg2);
            var tmp = gAnnotationData.get(mergedAnno.labelID);
            tmp.removeAnnotationFromScene(gScene);
            tmp.removeColorControllerFromGui();
            gAnnotationData.delete(mergedAnno.labelID);
        }

        mergedAnno.addColorControllerToFolder(annoGuiFolder);
        gAnnotationData.set(mergedAnno.labelID, mergedAnno);

        if (gbShowAllAnnotation) {
            gAnnotationData.get(mergedAnno.labelID).addAnnotationToScene(gScene);
        } else {
            gAnnotationData.get(mergedAnno.labelID).removeAnnotationFromScene(gScene);
        }

        // Update Geometry.Colors (used by lines) to Geometry.faces[].vertexColors (used by faces)
        gMesh.geometry = updateGeometryColorsToFaceVertexColors(gMesh.geometry);
        // Trigger update
        gMesh.geometry.elementsNeedUpdate = true;


    },

    undo: function () {

        var scope = this;
        var annoGuiFolder = gGuiControls.__folders["Annotation"];

        var mergedAnno = gAnnotationData.get(scope._ArrAnno[0].labelID);
        mergedAnno.removeColorControllerFromGui();
        mergedAnno.removeAnnotationFromScene(gScene);
        gAnnotationData.delete(mergedAnno.labelID);

        for (var i = 0; i < this._OriAnno.length; i++) {
            var oriReg = scope._OriAnno[i].getRegion();
            oriReg.vertices = this._storedOriRegionsVertices[i];
            oriReg.vertices.forEach(function (itemVertexIdx) {
                gMesh.geometry.userData.labels[itemVertexIdx] = scope._OriAnno[i].labelID;
                gMesh.geometry.colors[itemVertexIdx] = scope._OriAnno[i].labelColor;
            });

            scope._OriAnno[i].setRegion(oriReg);
            var isAddedColorCtrl = (gAnnotationData.get(scope._OriAnno[i].labelID) !== undefined);
            gAnnotationData.set(scope._OriAnno[i].labelID, scope._OriAnno[i]);
            if (!isAddedColorCtrl) {
                gAnnotationData.get(scope._OriAnno[i].labelID).addColorControllerToFolder(annoGuiFolder);
            }
        }

        gMesh.geometry = updateGeometryColorsToFaceVertexColors(gMesh.geometry);
        gMesh.geometry.elementsNeedUpdate = true;

    }

};

/************************************/

/******************************************************
 * Command Stack
 */

var CommandStack = function () {
    this._commandStackIdx = -1;
    this._commandStack = [];
};

CommandStack.prototype = {
    pushAndDo: function (cmd) {
        this._commandStack.push(cmd);
        this._commandStackIdx++;
        cmd.execute();
    },
    popAndUndo: function () {
        if (this._commandStackIdx >= 0) {
            var cmd = this._commandStack.pop();
            this._commandStackIdx--;
            cmd.undo();
        }
    },
    clear: function () {
        this._commandStackIdx = -1;
        this._commandStack = [];
    }

};

/******************************************************/

/* Event handler for editing label title ***************/
function editLabelTitle() {

    if (gLayerManager.currentLayer.annotationMode === "class")
        return;

    var currentElement = event.target;
    var newTxt = currentElement.value;
    var id = currentElement.parentNode.parentNode.parentNode.getAttribute("id");
    id = parseInt(id);
    updateLabelTextInScence(id, newTxt);

    return newTxt;

}

/******************************************************/

function onBlurLabelInputBox() {

    var currentElement = event.target;

    if (gbShowAllAnnotation) {
        showAllAnnotation(gAnnotationData);
    } else {
        hideAllAnnotation();
    }

    currentElement.setAttribute("id", "");

    // if (currentElement.getAttribute("id") === "classSelector") {
    //     $(currentElement).autocomplete("destroy");
    //     $(currentElement).removeData('autocomplete');
    // }

}

function onFocusLabelInputBox() {

    var currentElement = event.target;
    var id = currentElement.parentNode.parentNode.parentNode.getAttribute("id");
    id = parseInt(id);

    currentElement.setAttribute("readonly", "");
    hideAllAnnotation();
    var requestedItem = gAnnotationData.get(id);
    requestedItem.addAnnotationToScene(gScene);

    if (gLayerManager.currentLayer.annotationMode === "class") {
        currentElement.setAttribute("id", "classSelector");
        $(currentElement).autocomplete({
            source: availableTags,
            minLength: 0,
            position: { my : "right top", at: "right bottom" },
            change: function(event, ui) {
                var sourceList =  $(currentElement).autocomplete("option", "source");
                if(!ui.item && !sourceList.includes(currentElement.value)){
                    currentElement.value = "";
                }
            },
            select: function (event, ui) {
                currentElement.value = ui.item.value;
                var newTxt = currentElement.value;
                updateLabelTextInScence(id, newTxt);
                $(currentElement).autocomplete("destroy");
                $(currentElement).removeData('autocomplete');
                return false;
            }
        });

        $(currentElement).autocomplete("search", "");

    } else {
        if (!gLayerManager.currentLayer.annotationMode === "class" && currentElement.getAttribute("id") === "classSelector") {
            $(currentElement).autocomplete("destroy");
            $(currentElement).removeData('autocomplete');
        }
    }

}

function onDblClickLabelInputBox() {
    var currentElement = event.target;
    currentElement.removeAttribute("readonly");
    currentElement.focus();
    $(currentElement).find("input").select();

    var id = currentElement.parentNode.parentNode.parentNode.getAttribute("id");
    id = parseInt(id);

    hideAllAnnotation();
    var requestedItem = gAnnotationData.get(id);
    requestedItem.addAnnotationToScene(gScene);
}

jQuery.fn.sortColorControllers = (function () {
    return function (comparator) {
        return Array.prototype.sort.call(this, comparator).each(function (i) {
            this.parentNode.parentNode.appendChild(this.parentNode);
        });
    };
})();