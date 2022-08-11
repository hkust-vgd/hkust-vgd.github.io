class MeshObject {
    constructor(geometry) {
        this.LABEL_BASE = 255;
        this.eset = new Set();
        if (geometry instanceof THREE.BufferGeometry) {
            this.geometry = new THREE.Geometry().fromBufferGeometry(geometry);
            this.geometry.mergeVertices();
        } else {
            this.geometry = geometry;
        }
        this.gl_indices = [];
        this.vertex_vec = [];
        this.ngb_vec = [];
        this.normal_vec = [];
        this.rgb_vec = [];
        this.vertex_num = this.geometry.vertices.length;
        this.vertex_faces_map = new Map();
        for (let i = 0; i < this.geometry.vertices.length; ++i) {

            this.gl_indices[3 * i + 0] = this.geometry.faces[i].a;
            this.gl_indices[3 * i + 1] = this.geometry.faces[i].b;
            this.gl_indices[3 * i + 2] = this.geometry.faces[i].c;
            var vtx = this.geometry.vertices[i];
            var vtn = {'x':geometry.attributes.normal.array[3*i],'y':geometry.attributes.normal.array[3*i+1],'z':geometry.attributes.normal.array[3*i+2]};
            this.vertex_vec[i] = [vtx.x, vtx.y, vtx.z, 0];
            this.normal_vec[i] = [vtn.x, vtn.y, vtn.z, 0];
            this.rgb_vec[i] = [0, 0, 0, 0];
            this.ngb_vec[i] = [i];

        }

        var idx = 0;
        var tempEset = new Set();

        var face_vec = this.geometry.faces.slice();

        for (var i = 0; i < face_vec.length; ++i) {
            var vid0 = face_vec[i].a;
            var vid1 = face_vec[i].b;
            var vid2 = face_vec[i].c;
            face_vec[idx] = this.make_uint4(vid0, vid1, vid2);
            this.AddNeighbors(vid0, vid1, vid2);

            var val, pair;

            val = this.AscendingOrder(vid0, vid1);
            pair = val.a.toString() + " " + val.b.toString();
            tempEset.add(pair);
            val = this.AscendingOrder(vid0, vid2);
            pair = val.a.toString() + " " + val.b.toString();
            tempEset.add(pair);
            val = this.AscendingOrder(vid1, vid2);
            pair = val.a.toString() + " " + val.b.toString();
            tempEset.add(pair);

            var temp = this.vertex_faces_map.get(vid0);
            if (typeof temp === 'undefined') temp = [];
            temp.push(idx);
            this.vertex_faces_map.set(vid0, temp);
            temp = this.vertex_faces_map.get(vid1);
            if (typeof temp === 'undefined') temp = [];
            temp.push(idx);
            this.vertex_faces_map.set(vid1, temp);
            temp = this.vertex_faces_map.get(vid2);
            if (typeof temp === 'undefined') temp = [];
            temp.push(idx);
            this.vertex_faces_map.set(vid2, temp);
            idx++;
        }

        var arr = [];
        for (let item of tempEset.values())
            arr.push(item);
        arr.sort(function (a, b) {
            var as = a.split(' ');
            var bs = b.split(' ');
            if (as[0] != bs[0])
                return (parseInt(as[0]) - parseInt(bs[0]));
            else (parseInt(as[1]) - parseInt(bs[1]));
            return (parseInt(as[1]) - parseInt(bs[1]));
        });

        for (let item of arr) {
            var strs = item.split(' ');
            this.eset.add(new make_pair(parseInt(strs[0]), parseInt(strs[1])));
        }
    }

    make_uint4(x, y, z) {
        return {
            'x' : x, 'y' : y, 'z' : z, 'w' : 0
        }
    }

    AscendingOrder(v0, v1) {
        var a, b;
        if (v0 < v1) {
            a = v0;
            b = v1;
        }
        else {
            a = v1;
            b = v0;
        }
        return {
            a: a,
            b: b
        };
    }

    norm(vec1, vec2) {
        var vec = [vec1[0] - vec2[0], vec1[1] - vec2[1], vec1[2] - vec2[2], vec1[3] - vec2[3]];
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2] + vec[3] * vec[3]);
    }

    Diff(p0, p1, n0, n1) {
        const weight = 10;
        return this.norm(p1, p0) + weight * this.norm(n1, n0);
    }

    make_uchar4(x, y, z) {
        return {x: x, y: y, z: z, w: 0};
    }

    RandomColor() {
        var offset = 0;
        return this.make_uchar4(Math.min(Math.random() % 255 + offset, 250), Math.min(Math.random() % 255 + offset, 250), Math.min(Math.random() % 255 + offset, 250));
    }

    AddNeighbors(v0, v1, v2) {
        var vec = this.ngb_vec[v0];
        if (typeof vec === 'undefined')
            vec = [];
        vec.push(v1);
        vec.push(v2);
        this.ngb_vec[v0] = vec;
        vec = this.ngb_vec[v1];
        if (typeof vec === 'undefined')
            vec = [];
        vec.push(v0);
        vec.push(v2);
        this.ngb_vec[v1] = vec;
        vec = this.ngb_vec[v2];
        if (typeof vec === 'undefined')
            vec = [];
        vec.push(v0);
        vec.push(v1);
        this.ngb_vec[v2] = vec;
    }

    ComputeRGB(eset, mesh_c_threshold, min_size, vertex, normal, color, label, verbose) {
        var edges = [];
        for (var it = eset.values(); it != eset.end(); ++it) {
            var a = it.first;
            var b = it.second;
            edges.push(new edge(a, b, this.Diff(vertex[a], vertex[b], normal[a], normal[b], color[a], color[b])));
        }

        // segment
        var u = SegmentGraph(label.length, num, edges, mesh_c_threshold);

        // post process small components
        for (var i = 0; i < num; i++) {
            var a = u.find(edges[i].a);
            var b = u.find(edges[i].b);
            if ((a != b) && ((u.size(a) < min_size) ||
                    (u.size(b) < min_size)))
                u.join(a, b);
        }

        for (var i = 0; i < label.length; ++i)
            label[i] = u.find(i) + this.LABEL_BASE;

        return {
            eset: eset,
            vertex_vec: vertex,
            normal_vec: normal,
            rgb_vec: color,
            label_vec: label
        };
    }

    ComputeNonRGB(eset, mesh_c_threshold, min_size, vertex, normal, label, verbose) {
        var edges = [];
        var num = 0;
        for (let it of eset.keys()) {
            var a = it.first;
            var b = it.second;
            var item = new edge(a, b, this.Diff(vertex[a], vertex[b], normal[a], normal[b]));
            edges[num] = item;
            num++;
        }

        // segment
        var u = SegmentMesh.SegmentGraph(label.length, num, edges, mesh_c_threshold);

        // post process small components
        for (var i = 0; i < num; i++) {
            var a = u.find(edges[i].a);
            var b = u.find(edges[i].b);
            if ((a != b) && ((u.size(a) < min_size) || (u.size(b) < min_size)))
                u.join(a, b);
        }

        for (var i = 0; i < label.length; ++i)
            label[i] = u.find(i) + this.LABEL_BASE;

        return {
            eset: eset,
            vertex_vec: vertex,
            normal_vec: normal,
            label_vec: label,
            rgb_vec: []
        };
    }

    GraphSegmentation(graphcut_param) {
        var threshold = graphcut_param.mesh_vertex_threshold;
        var min_size = graphcut_param.seg_min_size;
        var normal = graphcut_param.normal;
        var color = graphcut_param.color;
        var color_map = graphcut_param.graphcut_color_map;
        var color_vec = graphcut_param.graphcut_color_vec;
        var label_vec = graphcut_param.graphcut_label_vec;
        var vertex_num = this.vertex_num;
        var out;

        if (color)
            out = this.ComputeRGB(this.eset, threshold, min_size, this.vertex_vec, this.normal_vec, this.rgb_vec, label_vec);
        else if (normal)
            out = this.ComputeNonRGB(this.eset, threshold, min_size, this.vertex_vec, this.normal_vec, label_vec);
        else
            out = this.ComputeNonRGB(this.eset, threshold, min_size, this.vertex_vec, this.normal_vec, label_vec);

        this.eset = out.eset;
        //console.log("Edge set", this.eset.length);

        this.vertex_vec = out.vertex_vec;
        this.normal_vec = out.normal_vec;
        this.label_vec = out.label_vec;

        var label_set = new Set();
        for (var i = 0; i < vertex_num; ++i)
            label_set.add(this.label_vec[i]);

        label_set = ascendingOrderSet(label_set);
        for (let it of label_set.keys()) {
            color_map[it] = this.RandomColor();
        }

        for (var i = 0; i < vertex_num; ++i)
            color_vec[i] = color_map[this.label_vec[i]];

        return {
            color_map: color_map,
            color_vec: color_vec,
            label_vec: this.label_vec
        }
    }

    _MRF(mrf_rgb_weight, mrf_potential, mrf_iteration, normal_vec, rgb_vec, ngb_vec, graphcut_label_vec, graphcut_color_map, label_vec, color_vec)
    {

        var FLOAT_MAX = Number.MAX_VALUE;
        var COV_EPSILON = 0.001;
        var vertex_num = graphcut_label_vec.length;

        //----------------------------------------------------------------------------
        // Initialization

                // make label
                var rset = new Set();
                for (var i = 0;i < vertex_num;++i)
                    rset.add(label_vec[i]);
                rset = ascendingOrderSet(rset);

                // make region for each label
                //map < uint, Region > rmap;
                var rmap = new Map()
                for (let item of rset.values())
                {
                    var r = new Region();
                    r.lid = item;
                    rmap.set(item, new make_pair(item, r));
                }


                // build region neighbor
                var rngb = new Map();
                for (var i = 0; i < vertex_num; ++i)
                {
                    var label_curr = label_vec[i];
                    if (typeof rmap.get(label_curr).second.vertices === 'undefined')
                        rmap.get(label_curr).second.vertices = [];
                    rmap.get(label_curr).second.vertices.push(i);
                    for (let item of ngb_vec[i])
                    {
                        var label_ngb = label_vec[item];
                        if (label_curr == label_ngb)
                            continue;

                        var uit = rngb.get(label_curr);
                        if (uit == rngb.values()[rngb.size-1]) {
                            var s = new Set();
                            s.add(label_ngb);
                            rngb.set(label_curr, new make_pair(label_curr, s));
                        } else {
                            uit.second.add(label_ngb);
                        }
                    }
                }
                // average color
                for (let item of rmap.values())
                {
                    var region = item.second;
                    var si = region.vertices.length;
                    var rgb = new MatrixXf(si, 3);
                    var nrm = new MatrixXf(si, 3);
                    var idx = 0;
                    for (let vit of region.vertices)
                    {
                        var c = rgb_vec[vit];
                        var n = normal_vec[vit];
                        //var v = [c[0]/ 255, c[1]/ 255, c[2]/ 255] ;
                        var v = [c[0], c[1], c[2]] ;
                        rgb.setrow(idx, v);
                        v = [n[0],n[1],n[2]];
                        nrm.setrow(idx, v);
                        idx++;
                    }

                    region.mean_rgb = rgb.colwiseMean();
                    region.mean_nrm = nrm.normalized(nrm.colwiseMean(normalized(nrm)));
                }

                //----------------------------------------------------------------------------
                // MRF

                for (var itr = 0; itr < mrf_iteration; ++itr)
                {
                    // Label map

                    var lmap = new Map();
                    var lmapEnd;
                    for (var id of rmap.keys())
                    {
                        var it = rmap.get(id);
                        var lit = lmap.get(it.second.lid);
                        if ((typeof lit==='undefined')||(typeof lit!=='undefined' && typeof lmapEnd!=='undefined' &&lit.first == lmapEnd.first && lit.second== lmapEnd.second)) {
                            var l = new Label();
                            l.member.add(it.first);
                            lmap.set(it.second.lid, l);
                            lmapEnd = new make_pair(it.second.lid, l);
                        } else {
                            lit.member.add(it.first);
                        }
                    }

                    for (let it of lmap)
                    {
                        var label = it[1];
                        var vset = new Set();
                        for (let uit of label.member.values())
                            for (var j=0; j<rmap.get(uit).second.vertices.length;j++)
                            vset.add(rmap.get(uit).second.vertices[j]);

                        var size = vset.size;
                        var rgb = new MatrixXf(size, 3);
                        var nrm = new MatrixXf(size, 3);
                        var idx = 0;
                        for (let vit of vset)
                        {
                            var c = rgb_vec[vit];
                            var n = normal_vec[vit];
                            var v = new vector3f(c[0]/ 255, c[1]/ 255, c[2]/ 255) ;
                            rgb.setrow(idx, v.value());
                            v = new vector3f(n[0], n[1], n[2]);
                            nrm.setrow(idx, v.value());
                            idx++;
                        }

                        //MatrixXf
                        var rgb_diff = rgb.rowwiseSubtract(rgb.colwiseMean());
                        //MatrixXf
                        var nrm_diff = nrm.rowwiseSubtract(nrm.colwiseMean());
                        label.mean_rgb = rgb.colwiseMean();
                        var c1 = nrm.colwiseMean(normalized(nrm));
                        var c2 =normalized(nrm);
                        label.mean_nrm = nrm.normalized(nrm.colwiseMean(normalized(nrm)));
                        label.cov_rgb = rgb_diff.transpose().multiplyMat(rgb_diff).multiply(1/(size - 1));
                        label.cov_nrm = nrm_diff.transpose().multiplyMat(nrm_diff).multiply(1/(size - 1));

                        var a =label.cov_rgb.determinant();
                        var b = Math.pow(COV_EPSILON, 3)
                        if (typeof label.cov_rgb.determinant()!=='undefined' && label.cov_rgb.determinant() < Math.pow(COV_EPSILON, 3)){
                            var identity3 = new MatrixXf(3,3);
                            identity3.Identity(3);
                            identity3.multiply(COV_EPSILON);
                            for (var i=0;i<3; i++)
                                for (var j=0;j<3; j++)
                                    label.cov_rgb.arr[i][j] = label.cov_rgb.arr[i][j] + identity3.arr[i][j];
                        }
                    }

                    // MRF traverse ICM?

                    var result = new Map();
                    rngb = ascendingOrderMap(rngb);
                    for (let it of rngb)
                    {
                        var rid = it[1].first;
                        var nset = it[1].second;
                        var lvec = [];
                        var rvec = [];
                        var e_feature = [];
                        var energy = [];
                        for (let nit of nset)
                        {
                            var nid = rmap.get(nit).second.lid;
                            var diff = arraySubtraction(rmap.get(rid).second.mean_rgb, lmap.get(nid).mean_rgb);
                            diff = convertArr2Mat(diff);
                            var matrix1 = lmap.get(nid).cov_rgb.inverse();
                            var matrix = diff.multiplyMat(matrix1);
                            var matrix2 = matrix.multiplyMat(diff.transpose());
                            var e_rgb = matrix2.addNum(Math.log(lmap.get(nid).cov_rgb.determinant()));
                            var diff_nrm = arraySubtraction(rmap.get(rid).second.mean_nrm, lmap.get(nid).mean_nrm);
                            diff_nrm = convertArr2Mat(diff_nrm);
                            var matrix1_nrm = lmap.get(nid).cov_nrm.inverse();
                            var matrix_nrm = diff_nrm.multiplyMat(matrix1_nrm);
                            var matrix2_nrm = matrix_nrm.multiplyMat(diff_nrm.transpose());
                            var e_nrm = matrix2_nrm.addNum(Math.log(lmap.get(nid).cov_nrm.determinant()));
                            e_feature.push(e_rgb.arr[0][0]*mrf_rgb_weight + e_nrm.arr[0][0]*(1 - mrf_rgb_weight));
                            lvec.push(nid);
                            rvec.push(nit);
                        }

                        for (var i = 0; i < lvec.length; ++i)
                        {
                            var count = 0;
                            for (var j = 0; j < lvec.length; ++j)
                            {
                                if (lvec[i] != lvec[j])
                                    count += 1;
                            }
                            energy.push(e_feature[i] + count * mrf_potential);
                        }

                        var score = FLOAT_MAX;
                        var best = 0;
                        for (var i = 0; i < lvec.length; ++i)
                        {
                            if (energy[i] < score) {
                                score = energy[i];
                                best = i;
                            }
                        }

                        if (score < FLOAT_MAX) {
                            result.set(rid, new make_pair(rid, rvec[best]));
                        } else {
                            result.set(rid, new make_pair(rid, rid));
                        }

                    }



                    var checked = new Set();
                    for (let it of rngb)
                    {
                        if (rmap.get(it[1].first).second.lid == rmap.get(result.get(it[0]).second).second.lid)
                            continue;

                        var cit = checked.has(it[1].first);
                        if (cit === false) {
                            rmap.get(it[1].first).second.lid = rmap.get(result.get(it[0]).second).second.lid;
                        } else {
                            var tmp = rmap.get(it[1].first).second.lid;
                            rmap.get(it[1].first).second.lid = rmap.get(result.get(it[0]).second).second.lid;

                            for (let rit of rset)
                                if (rmap.get(rit).second.lid == tmp)
                                    rmap.get(rit).second.lid = rmap.get(result.get(it[0]).second).second.lid;
                        }

                        checked.add(it[1].first);
                        checked.add(result.get(it[1].first).second);
                        checked = ascendingOrderSet(checked);
                    }
                }

                //----------------------------------------------------------------------------
                // Wrap up

                var lset = new Set();
                for (let it of rmap)
                    lset.add(it[1].second.lid);

                for (var i = 0; i < vertex_num; ++i)
                {
                    var new_id = rmap.get(label_vec[i]).second.lid;
                    label_vec[i] = new_id;
                    color_vec[i] = graphcut_color_map[new_id];
                }
                return {
                    color_map: graphcut_color_map,
                    color_vec: color_vec,
                    label_vec: label_vec
                }
    }

    GraphcutAndMRF(graphcut_param, mrf_param)
    {
        var graphcutOut = this.GraphSegmentation(graphcut_param);
        var color_vec = graphcutOut.color_vec;
        var label_vec = graphcutOut.label_vec;

        var graphcutOutClone = {color_vec:[], label_vec:[], color_map:[] };
        graphcutOutClone.color_vec = graphcutOut.color_vec.map( (item) => new THREE.Color(item.x, item.y, item.z));
        graphcutOutClone.label_vec = graphcutOut.label_vec.slice(0);
        graphcutOutClone.color_map = graphcutOut.color_map.map( (item) => { if (item) return new THREE.Color(item.x, item.y, item.z); });

        var mrf_rgb_weight = mrf_param.mrf_rgb_weight;
        var mrf_potential = mrf_param.mrf_potential;
        var mrf_iteration = mrf_param.mrf_iteration;

        var mrfOut = this._MRF(mrf_rgb_weight, mrf_potential, mrf_iteration, this.normal_vec, this.rgb_vec, this.ngb_vec, graphcutOut.label_vec,
            graphcutOut.color_map, label_vec, color_vec);

        return {
            color_map: mrfOut.color_map,
            color_vec: mrfOut.color_vec,
            label_vec: mrfOut.label_vec,
            graphcutOut: graphcutOutClone
        }
    }


    /**
     * MRF Segmentation base on GraphCut
     * @param GraphCutData: {label_vec, color_vec, color_map}
     * @param MRF_params: {mrf_rgb_weight, mrf_rgb_potential, mrf_iteration}
     * @returns {{label_vec: *, color_vec: *, color_map: *}}
     * @method
     */
    MRF(GraphCutData, MRF_params) {

        // Clone data
        var color_vec = GraphCutData.color_vec.slice(0);
        var label_vec = GraphCutData.label_vec.slice(0);
        var color_map = GraphCutData.color_map.slice(0);

        var mrfOut = this._MRF(MRF_params.mrf_rgb_weight, MRF_params.mrf_potential, MRF_params.mrf_iteration,
                                this.normal_vec, this.rgb_vec, this.ngb_vec,
                                GraphCutData.label_vec, color_map, label_vec, color_vec);

        return mrfOut;

    }
}