
var cur_page = 0, height = 3, end_page = 0;
var downsample_level = 1;
var ip = "http://103.24.77.34:8080";
var xmlPathPattern = ip + "/scenenn/main/@id/@id.xml";
var plyPathPattern = ip + "/scenenn/downsample/@id/@id-" + downsample_level + ".ply";

function show_category(){
    var scene_data = parseSceneXML();
    var scene_type = scene_data.scene_type;
    var scene_type_map = scene_data.scene_type_map;

    $("#scene_category").empty();
    var rows="<ul class=\"nav nav-tabs\" id=\"scene_category\">";
    for (var i = 0; i < scene_type.length; i++){
        var cate = scene_type[i];
        rows += "<li class=\"dropdown\">";
        rows += "<a class=\"dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\">"+ cate +"<span class=\"caret\"></span></a>";
        rows += "<ul class=\"dropdown-menu scrollable-menu\"  role=\"menu\">";
        for (var j=0; j<scene_type_map.get(cate).length;j++){
            rows+="<li><a href=\"#\">"+scene_type_map.get(cate)[j]+"</a></li>";
        }
        rows+="</ul></li>";
    }
    rows+="<li class=\"download_all\"><a href=\"#\">All</a></li>";
    rows+="<div style=\"float: right; position: relative\">";
    rows+="<a class='btn btn-primary' href='javascript:;'>	Choose File...";
    rows+="<input accept='.zip' type=\"file\" id=\"mysignature_upload\" style='position:absolute;z-index:2;top:0;left:0;filter: alpha(opacity=0);-ms-filter:\"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)\";" +
        "opacity:0;background-color:transparent;color:transparent;width:100%; height:100%' name=\"file_source\" size=\"40\"  onchange='segment_scene(this)'>";
    rows+="</a>&nbsp;";
    //rows+="<span class='label label-info' id=\"upload-file-info\"></span>";
    rows+="</div>";
    rows+="</ul>";


    $("#scene_category").append(rows);

}

// show scene list
function show_scene_list(cur_page, height) {
    // Change the scene ID here for other scenes
    var scene_data = parseSceneXML();
    var scene_type_map = scene_data.scene_type_map;
    var images = ( () => {
        var tmpArr = [];
        for (var item of scene_type_map.values()) {
            tmpArr = tmpArr.concat(item);
        }
        return tmpArr;
    })();
    var width = 6;
    end_page = Math.floor(images.length/(width*height));

    $("#teaser").empty();
    var img_row = "<div class=\"container\">";
    img_row += "<div id=\"collapse1\" class=\"panel-collapse collapse in\">";
    img_row += "</div>";
    img_row += "</div>";
    $("#teaser").append(img_row);
    for (var i = cur_page*height; i < (cur_page+1)*height; ++i) {
        var row = "<div class=\"row\" style=\"padding-bottom: 2%;\">";
        for (var j = 0; j < width; ++j) {
            if ((i * width + j)<images.length){
                var id = images[i * width + j];
                var file = ip + "/scenenn/images/" + id + "/" + id + "_segmented.png";
                row += "<div class=\"three columns hover\" style='margin-left: 2%;'>";
                // Change margin above to adjust gaps between columns

                row += "<div class=\"col-sm-2\" ><figure><img id=\"" + id + "\" class=\"img-thumbnail\" src=\"" + file + "\" data-popup-open=\"popup-1\"></img></figure>";
                row += "<div class=\"carousel-caption\"><p>"+id+"</p></div>";
                row += "<div class=\"btn-group btn-group-xs\">";
                var shrec_label2d = ip + "/scenenn/shrec17/labels/"+id+".zip";
                var shrec_label3d = ip + "/scenenn/main/zip/"+id+".zip";
                var shrec_raw = ip + "/scenenn/main/oni/"+id+".oni";
                row += "<a href=\""+shrec_label3d+"\" class=\"btn btn-default\">3D label</a>";
                row += "<a href=\""+shrec_label2d+"\" class=\"btn btn-default\">2D label</a>";
                row += "<a href=\""+shrec_raw+"\" class=\"btn btn-default\">2D raw</a>";
                row += "</div>";
                row += "</div></div>";
            }
        }
        $("#teaser").append(row);
    }
    var row ="<ul class=\"pager\">";
    row+="<li class=\"previous\"><a href=\"#\">Previous</a></li>";
    row+="<li class=\"next\"><a href=\"#\">Next</a></li>";
    row+="</ul>";
    row += "</div>";
    $("#teaser").append(row);

    $('.previous').on("click",function () {
        if (cur_page>0)
            cur_page--;
        show_scene_list(cur_page,height);
    });

    $('.next').on("click",function () {
        if (cur_page < end_page)
            cur_page++;
        show_scene_list(cur_page,height);
    });

    // Pop-up dialog for WebGL
    //----- OPEN'
    $('[data-popup-open]').on('click', function(e)  {
        // enable scene image
        var scene_xml = xmlPathPattern.replace(/@id/g, this.id.trim());
        var scene_ply = plyPathPattern.replace(/@id/g, this.id.trim());
        showScene(scene_ply, scene_xml);
        $("#teaser").empty();
        e.preventDefault();
    });

    $(".carousel-caption").css({"color":"red","padding-bottom":"0","padding-top":"0", "width":"50", "text-align":"-webkit-match-parent"});
}

$(document).ready(function(){

    show_category();
    //show_scene_list();

    $('.dropdown-menu').on('click','li',function() {
        var scene_xml = xmlPathPattern.replace(/@id/g, this.innerText.trim());
        var scene_ply = plyPathPattern.replace(/@id/g, this.innerText.trim());
        showScene(scene_ply, scene_xml);
        $("#teaser").empty();
    });

    $('.download_all').on('click',function() {
        cur_page=0;
        show_scene_list(cur_page,height);
        $("#glcanvas_viewer").find("canvas").remove();
        $("#guicontrol").empty();
        $("#info").empty();
        $("#downloadscene-btn").empty();
        $("#infoButton").empty();
    });
});

function parseSceneXML(){
    var scene_type = [];
    var scene_type_map = new Map();
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", ip + "/scenenn/main/category.csv", false);
    rawFile.onload = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                var allText = rawFile.responseText;
                for (var i = 0; i < allText.split('\n').length; i++){
                    var line = allText.split('\n')[i];
					if (line[0] === '#') continue;
                    scene_type.push(line.split(',')[0]);
                    var scenes = [];
                    for (var j = 1; j < line.split(',').length - 1; j++){
                        scenes.push(line.split(',')[j]);
                    }
                    scene_type_map.set(scene_type[scene_type.length - 1],scenes.slice());
                }
            }
        }

    };
    rawFile.send(null);
    return {'scene_type':scene_type, 'scene_type_map':scene_type_map};
}

function segment_scene(e) {
    //$("#upload-file-info").html(/[^\\/]+$/.exec(e.value));
    if (e.files.length > 0) {

        var file = e.files[0];
        $(e).val("");

        var promiseChain = [];
        var geometry = null;
        var annotation = [];
        var graphCutOut;
        var graphCutAnnoMap;
        var colorArrs = [];
        var labelArrs = [];


        JSZip.loadAsync(file)
            .then(function (zipItems) {

                zipItems.forEach(function (relativePath, zipEntry) {
                    var fileExtension = zipEntry.name.split('.').pop();

                        switch (fileExtension) {
                            case "ply":
                                var tmp = zipEntry.async("arraybuffer").then(function (data) {
                                    geometry = new THREE.PLYLoader2().parse(data);
                                    geometry.name = zipEntry.name;
                                    gMeshObject = new MeshObject(geometry);
                                });
                                promiseChain.push(tmp);
                                break;

                            case "xml":
                                var tmp = zipEntry.async("text").then(function (data) {
                                    var tmpAnnoItem = new THREE.XMLLoader().parse(data);
                                    annotation.push(tmpAnnoItem);
                                });
                                promiseChain.push(tmp);
                                break;

                            case "lbl":
                                var tmp = zipEntry.async("arraybuffer").then(function (data) {
                                    labelArrs = new THREE.LabelLoader().parse(data);
                                });
                                promiseChain.push(tmp);
                                break;
                        }

                });

            }).then(function(){
            Promise.all(promiseChain).then(function() {

                if (promiseChain.length < 1) {
                    return;
                }

                for (let i = 0 ; i < annotation.length; i++) {
                    // Create map from annotation
                    var annotationMap = new Map();
                    annotation[i].labelID.forEach(
                        (labelID, idx) =>
                            (annotationMap.set(labelID, new AnnoInfoElement(labelID, annotation[i].labelTitle[idx], annotation[i].labelColor[idx])))
                    );

                    annotation[i] = annotationMap;
                }

                geometry.attributes.arrLabels = labelArrs;

                colorArrs = labelArrs.map(function(row, idx) {
                    return (labelArrs[idx].map(function(label) {
                        return annotation[idx].get(label).labelColor;
                    }));
                });
                geometry.attributes.arrColors = colorArrs;

                if (guiRunMRFObj.runMRF || annotation.length === 0) {

                    [geometry, annotation, graphCutOut, graphCutAnnoMap] = execGraphCutMRF(geometry, true);

                } else {

                    [geometry, graphCutOut, graphCutAnnoMap] = execGraphCutMRF(geometry);
                }

                loadFromGeometry(geometry, annotation, graphCutOut, graphCutAnnoMap);

                $("#teaser").empty();

                animate();

            });
        });

    }
}

function extractAnnoFromLabels(labels, getColorFunc) {
    let resultAnno =  new Map();

    let tmpSetLabelIDs = new Set(labels);

    tmpSetLabelIDs.forEach( function(item) {
        let tmpAnnoInfoItem = new AnnoInfoElement(item, "", getColorFunc(item), null);
        resultAnno.set(item, tmpAnnoInfoItem);

    } );

    return resultAnno;
}

function execGraphCutMRF(geometry, execMRF = false) {

    let fileName = geometry.name;
    let mo = gMeshObject;

    if (geometry instanceof THREE.BufferGeometry) {
        let tmpArrLabels = geometry.attributes.arrLabels;
        let tmpArrColors = geometry.attributes.arrColors;
        geometry =  new THREE.Geometry().fromBufferGeometry(geometry);
        geometry.userData = { labels: [], arrLabels: [], arrColors: [] };
        geometry.userData.arrLabels = tmpArrLabels;
        geometry.userData.labels = geometry.userData.arrLabels[0];
        geometry.userData.arrColors = tmpArrColors;
    }

    let graphcut_label_vec = [];
    graphcut_label_vec.length = geometry.vertices.length;
    graphcut_label_vec.fill(0);

    var graphcut_param = {
        'mesh_vertex_threshold': 0.001,
        'seg_min_size': 100,
        'graphcut_color_map': [],
        'graphcut_color_vec': [],
        'graphcut_label_vec': graphcut_label_vec,
        'normal' : true,
        'color' : false
    };

    var mrf_param = {
        'mrf_rgb_weight' : 0.1,
        'mrf_potential' : 0.1,
        'mrf_iteration' : 10
    };

    var graphCutOut = mo.GraphSegmentation(graphcut_param);
    var graphcutOutClone = {color_vec:[], label_vec:[], color_map:[] };
    graphcutOutClone.color_vec = graphCutOut.color_vec.map( (item) => new THREE.Color(item.x, item.y, item.z));
    graphcutOutClone.label_vec = graphCutOut.label_vec.slice(0);
    graphcutOutClone.color_map = graphCutOut.color_map.map( (item) => { if (item) return new THREE.Color(item.x, item.y, item.z); });

    var graphCutAnnoInfo = extractAnnoFromLabels(graphcutOutClone.label_vec, function(i) { return graphcutOutClone.color_map[i] } );

    if (execMRF) {

        var mrfOut = mo.MRF(graphCutOut, mrf_param);

        var mrfAnnoInfo = extractAnnoFromLabels(mrfOut.label_vec, function (i) {
            return new THREE.Color(mrfOut.color_map[i].x, mrfOut.color_map[i].y, mrfOut.color_map[i].z)
        });

        var loadedData = geometry.userData;
        var arrAnnoInfo = [mrfAnnoInfo];

        geometry = mo.geometry;

        loadedData.labels = mrfOut.label_vec;
        loadedData.arrLabels[0] = mrfOut.label_vec;

        geometry.userData = { labels: [] };
        geometry.userData.labels = mrfOut.label_vec;

        geometry.userData.arrLabels = [];
        geometry.userData.arrLabels.push(geometry.userData.labels);

        geometry.userData.arrColors = [];

        var bArrColorsDone = [];
        bArrColorsDone.length = geometry.vertices.length;
        bArrColorsDone.fill(false);

        if (geometry.colors.length === 0) {
            for (var i = 0; i < geometry.vertices.length; i++) {
                geometry.colors.push(new THREE.Color());
            }
        }

        for (var i = 0; i < geometry.faces.length; i++) {

            var face = geometry.faces[i];

            if (face.vertexColors[0] === undefined) {
                face.vertexColors.push(new THREE.Color(mrfOut.color_vec[face.a].x, mrfOut.color_vec[face.a].y, mrfOut.color_vec[face.a].z));
            } else {
                face.vertexColors[0].r = mrfOut.color_vec[face.a].x;
                face.vertexColors[0].g = mrfOut.color_vec[face.a].y;
                face.vertexColors[0].b = mrfOut.color_vec[face.a].z;
            }

            if (face.vertexColors[1] === undefined) {
                face.vertexColors.push(new THREE.Color(mrfOut.color_vec[face.b].x, mrfOut.color_vec[face.b].y, mrfOut.color_vec[face.b].z));

            } else {
                face.vertexColors[1].r = mrfOut.color_vec[face.b].x;
                face.vertexColors[1].g = mrfOut.color_vec[face.b].y;
                face.vertexColors[1].b = mrfOut.color_vec[face.b].z;
            }

            if (face.vertexColors[2] === undefined) {
                face.vertexColors.push(new THREE.Color(mrfOut.color_vec[face.c].x, mrfOut.color_vec[face.c].y, mrfOut.color_vec[face.c].z));
            } else {
                face.vertexColors[2].r = mrfOut.color_vec[face.c].x;
                face.vertexColors[2].g = mrfOut.color_vec[face.c].y;
                face.vertexColors[2].b = mrfOut.color_vec[face.c].z;
            }

            if (!bArrColorsDone[face.a]) {
                geometry.colors[face.a].r = mrfOut.color_vec[face.a].x;
                geometry.colors[face.a].g = mrfOut.color_vec[face.a].y;
                geometry.colors[face.a].b = mrfOut.color_vec[face.a].z;
                bArrColorsDone[face.a] = true;
            }
            if (!bArrColorsDone[face.b]) {
                geometry.colors[face.b].r = mrfOut.color_vec[face.b].x;
                geometry.colors[face.b].g = mrfOut.color_vec[face.b].y;
                geometry.colors[face.b].b = mrfOut.color_vec[face.b].z;
                bArrColorsDone[face.b] = true;
            }
            if (!bArrColorsDone[face.c]) {
                geometry.colors[face.c].r = mrfOut.color_vec[face.c].x;
                geometry.colors[face.c].g = mrfOut.color_vec[face.c].y;
                geometry.colors[face.c].b = mrfOut.color_vec[face.c].z;
                bArrColorsDone[face.c] = true;
            }
        }

        geometry.userData.arrColors.push(geometry.colors);
        loadedData.arrColors[0] = geometry.colors;

        geometry.userData = loadedData;

        for (var i = 1 ; i < geometry.userData.arrLabels.length; i++) {
            var tmpAnno = extractAnnoFromLabels(geometry.userData.arrLabels[i], function (labelID) {
                var idx = geometry.userData.arrLabels[i].indexOf(labelID);
                return geometry.userData.arrColors[i][idx];
            });
            arrAnnoInfo.push(tmpAnno);
        }

        // Geometry is made from MRF, AnnoInfo is extracted from MRF Segmentation
        geometry.name = fileName;
        return [geometry, arrAnnoInfo, graphcutOutClone, graphCutAnnoInfo];
    }

    // Original geometry loaded, AnnoInfo will be loaded from XML
    geometry.name = fileName;
    return [geometry, graphcutOutClone, graphCutAnnoInfo];

}

function execMRF(graphCutData, mrfParams) {

    var mrf_param = {
        'mrf_rgb_weight' : 0.1,
        'mrf_potential' : 0.1,
        'mrf_iteration' : 10
    };

    var mrfOut = gMeshObject.MRF(graphCutData, mrf_param);

    var mrfAnnoInfo = extractAnnoFromLabels(mrfOut.label_vec, function (i) {
        return new THREE.Color(mrfOut.color_map[i].x, mrfOut.color_map[i].y, mrfOut.color_map[i].z)
    });

    var color_vec = mrfOut.color_vec.map(function (item) { return new THREE.Color(item.x, item.y, item.z)});

    return [color_vec, mrfOut.label_vec, mrfAnnoInfo];

}

function executeGraphcutAndMRF(geometry) {

    var mo = new MeshObject(geometry);

    var tmpLabelIDArr = null;
    if (geometry.attributes.labels !== undefined) {
        tmpLabelIDArr = Array.from(geometry.attributes.labels.array);
    }

    if (geometry instanceof THREE.BufferGeometry) {
        geometry =  new THREE.Geometry().fromBufferGeometry(geometry);
    }

    var graphcut_label_vec = [];
    graphcut_label_vec.length = geometry.vertices.length;
    graphcut_label_vec.fill(0);

    // mrf code
    var graphcut_param = {
        'mesh_vertex_threshold': 0.001,
        'seg_min_size': 100,
        'graphcut_color_map': [],
        'graphcut_color_vec': [],
        'graphcut_label_vec': graphcut_label_vec,
        'normal' : true,
        'color' : false
    };

    var mrf_param = {
        'mrf_rgb_weight' : 0.1,
        'mrf_potential' : 0.1,
        'mrf_iteration' : 10
    };

    var out = { label_vec: tmpLabelIDArr, color_vec: geometry.colors, color_map: null };
    var annotationArr = [];
    var graphCutAnnoArr = [];


    var graphCutOut = mo.GraphSegmentation(graphcut_param);
    $('.progress').children().html("PLY&XML post Loading ...");
    var graphcutOutClone = {color_vec:[], label_vec:[], color_map:[] };
    graphcutOutClone.color_vec = graphCutOut.color_vec.map( (item) => new THREE.Color(item.x, item.y, item.z));
    graphcutOutClone.label_vec = graphCutOut.label_vec.slice(0);
    graphcutOutClone.color_map = graphCutOut.color_map.map( (item) => { if (item) return new THREE.Color(item.x, item.y, item.z); });
    var tmpSetLabelIDs = new Set(graphcutOutClone.label_vec);

    tmpSetLabelIDs.forEach( function(item) {

        var tmpAnnoInfoItem = new AnnoInfoElement(item, "", graphcutOutClone.color_map[item], null);
        graphCutAnnoArr.push(tmpAnnoInfoItem);

    } );

    if (guiRunMRFObj.runMRF) {
        $('.progress').children().html("PLY&XML post Loading ...");
        out = mo.GraphcutAndMRF(graphcut_param, mrf_param);

        var uniqueSetLabelIDs = new Set(out.label_vec);
        uniqueSetLabelIDs.forEach( function(item) {

            var tmpColor = new THREE.Color(out.color_map[item].x, out.color_map[item].y, out.color_map[item].z);
            var tmpAnnoInfoItem = new AnnoInfoElement(item, "", tmpColor, null);
            annotationArr.push(tmpAnnoInfoItem);

        } );


        geometry = mo.geometry;

        var bArrColorsDone = [];
        bArrColorsDone.length = geometry.vertices.length;
        bArrColorsDone.fill(false, 0);
        for (var i = 0; i < geometry.faces.length;i++)
        {

            var face = geometry.faces[i];
            face.vertexColors[0].r = out.color_vec[face.a].x;
            face.vertexColors[0].g = out.color_vec[face.a].y;
            face.vertexColors[0].b = out.color_vec[face.a].z;
            face.vertexColors[1].r = out.color_vec[face.b].x;
            face.vertexColors[1].g = out.color_vec[face.b].y;
            face.vertexColors[1].b = out.color_vec[face.b].z;
            face.vertexColors[2].r = out.color_vec[face.c].x;
            face.vertexColors[2].g = out.color_vec[face.c].y;
            face.vertexColors[2].b = out.color_vec[face.c].z;
            if (!bArrColorsDone[face.a]) {
                geometry.colors[face.a].r = out.color_vec[face.a].x;
                geometry.colors[face.a].g = out.color_vec[face.a].y;
                geometry.colors[face.a].b = out.color_vec[face.a].z;
                bArrColorsDone[face.a] = true;
            }
            if (!bArrColorsDone[face.b]) {
                geometry.colors[face.b].r = out.color_vec[face.b].x;
                geometry.colors[face.b].g = out.color_vec[face.b].y;
                geometry.colors[face.b].b = out.color_vec[face.b].z;
                bArrColorsDone[face.b] = true;
            }
            if (!bArrColorsDone[face.c]) {
                geometry.colors[face.c].r = out.color_vec[face.c].x;
                geometry.colors[face.c].g = out.color_vec[face.c].y;
                geometry.colors[face.c].b = out.color_vec[face.c].z;
                bArrColorsDone[face.c] = true;
            }

        }

        geometry.userData = { labels: [] };
        geometry.userData.labels = out.label_vec;

        return [geometry, annotationArr, graphcutOutClone, graphCutAnnoArr];
    }
    else {

        var tmpCheckSet = new Set();

        for (var i = 0; i < out.label_vec.length; i++) {
            if (!tmpCheckSet.has(out.label_vec[i])) {
                tmpCheckSet.add(out.label_vec[i]);
                var tmpColor = new THREE.Color(out.color_vec[i].r, out.color_vec[i].g, out.color_vec[i].b);
                var tmpAnnoInfoItem = new AnnoInfoElement(out.label_vec[i], "", tmpColor, null);
                annotationArr.push(tmpAnnoInfoItem);
            }
        }

        for (var i = 0; i < geometry.vertices.length; i++) {
            geometry.colors[i].r = out.color_vec[i].r;
            geometry.colors[i].g = out.color_vec[i].g;
            geometry.colors[i].b = out.color_vec[i].b;
        }

        for (var i = 0; i < geometry.faces.length;i++)
        {
            var face = geometry.faces[i];
            face.vertexColors[0].r = out.color_vec[face.a].r;
            face.vertexColors[0].g = out.color_vec[face.a].g;
            face.vertexColors[0].b = out.color_vec[face.a].b;
            face.vertexColors[1].r = out.color_vec[face.b].r;
            face.vertexColors[1].g = out.color_vec[face.b].g;
            face.vertexColors[1].b = out.color_vec[face.b].b;
            face.vertexColors[2].r = out.color_vec[face.c].r;
            face.vertexColors[2].g = out.color_vec[face.c].g;
            face.vertexColors[2].b = out.color_vec[face.c].b;
        }

        geometry.userData = { labels: [] };
        geometry.userData.labels = out.label_vec;

        return [geometry, annotationArr, graphcutOutClone, graphCutAnnoArr];

    }

}
