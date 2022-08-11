// this class has merged of the multiple constructors
class Point3 {
    constructor(argmap){
        if ('nx' in argmap && 'ny' in argmap && 'nz' in argmap)
            this.Point3NXYZ ( argmap.nx, argmap.ny, argmap.nz );
        else if ('p' in argmap)
            this.Point3P (argmap.p );
        else if ('nv' in argmap)
            this.Point3NV(argmap.nv);
    }

    Point3NXYZ ( nx, ny, nz )
    {
        this._v[0] = nx;
        this._v[1] = ny;
        this._v[2] = nz;
    }

    Point3P (p )
    {
        this._v[0]= p._v[0];
        this._v[1]= p._v[1];
        this._v[2]= p._v[2];
    }

    Point3NV (nv)
    {
        this._v[0] = nv[0];
        this._v[1] = nv[1];
        this._v[2] = nv[2];
    }
}

class vector3f{
    constructor(x,y,z){
        this.arr = [x,y,z];
    }
    value() {
        return this.arr;
    }
}

class Label {                      // for MRF
    constructor(){
        this.mean_rgb = new vector3f(0,0,0);
        this.mean_nrm = new vector3f(0,0,0);
        this.cov_rgb = new MatrixXf(3,3);
        this.cov_nrm = new MatrixXf(3,3);
        this.member = new Set();
    }
};

class MatrixXf{
    constructor(rows, cols){
        this.rows = rows;
        this.cols = cols;
        this.arr = new Array(rows);
        for (var i = 0; i < rows; i++) {
            this.arr[i] = new Array(cols);
        }
        for (var i=0; i<this.rows; i++){
            for (var j=0; j<this.cols; j++)
                this.arr[i][j] = 0;
        }
    }
    row(nrow){
        var out = [];
        for (var i=0; i<this.cols;i++)
            out[j] = this.arr[nrow][j];
        return out;
    }
    col(ncol){
        var out = [];
        for (var i=0; i<this.rows;i++)
            out[i] = this.arr[i][ncol];
        return out;
    }
    setrow(row, arrIn){
        for (var i=0; i<this.cols;i++)
            this.arr[row][i] = arrIn[i];
    }
    mean(arrIn){
        var sum = 0;
        for (var i=0;i<arrIn.length; i++)
            sum += arrIn[i];
        return sum/arrIn.length;
    }
    colwiseMean(){
        var meanArr = [];
        for (var i=0; i<this.cols; i++){
            meanArr[i] = this.mean(this.col(i));
        }
        return meanArr;
    }
    normalized(arrIn){
        var normalizeArr = [];
        var sum = 0;
        for (var i=0; i<arrIn.length; i++){
            sum += arrIn[i]*arrIn[i];
        }
        sum = Math.sqrt(sum);
        for (var i=0; i<arrIn.length; i++){
            normalizeArr[i] = arrIn[i]/sum;
        }
        return normalizeArr;
    }
    rowwiseSubtract(arrIn){
        var maOut = new MatrixXf(this.rows, this.cols);
        for (var i=0; i<this.rows; i++){
            for (var j=0; j<this.cols; j++)
                maOut.arr[i][j]  = this.arr[i][j] - arrIn[j];
        }
        return maOut;
    }
    transpose(){
        var maOut = new MatrixXf(this.cols, this.rows);
        var arrOut = new Array(this.cols);
        for (var i = 0; i < this.cols; i++) {
            arrOut[i] = new Array(this.rows);
        }
        for (var i=0; i<this.cols; i++){
            for (var j=0; j<this.rows; j++)
                arrOut[i][j]  = this.arr[j][i];
        }
        maOut.arr = arrOut;
        return maOut;
    }
    multiply(c){
        var maOut = new MatrixXf(this.rows, this.cols);
        var arrOut = this.arr;
        for (var i=0; i<this.rows; i++){
            for (var j=0; j<this.cols; j++)
                arrOut[i][j]  = this.arr[i][j]*c;
        }
        maOut.arr = arrOut;
        return maOut;
    }
    Identity(n){
        this.cols = n;
        this.rows = n;
        this.arr = new Array(n);
        for (var i = 0; i < n; i++) {
            this.arr[i] = new Array(n);
        }
        for (var i=0; i<n; i++){
            for (var j=0; j<n; j++)
                if (i==j)
                    this.arr[i][j] = 1;
            else
                    this.arr[i][j] = 0;
        }
    }



    inverse(){
        // this code merely applies for 3*3 matrix and the different dimensional matrix does not applies
        // no need extend code in overall
        var arrOut = new Array(this.rows);
        for (var i = 0; i < this.rows; i++) {
            arrOut[i] = new Array(this.cols);
        }
        var a = this.arr[0][0];var b = this.arr[0][1];var c = this.arr[0][2];
        var d = this.arr[1][0];var e = this.arr[1][1];var f = this.arr[1][2];
        var g = this.arr[2][0];var h = this.arr[2][1];var i = this.arr[2][2];
        //maxtrix of minor
        arrOut[0][0] = e*i-f*h;
        arrOut[0][1] = d*i-f*g;
        arrOut[0][2] = d*h-g*e;
        arrOut[1][0] = b*i-h*c;
        arrOut[1][1] = a*i-c*g;
        arrOut[1][2] = a*h-b*g;
        arrOut[2][0] = b*f-c*e;
        arrOut[2][1] = a*f-c*d;
        arrOut[2][2] = a*e-b*d;

        //Matrix of Cofactors
        arrOut[0][1] = -arrOut[0][1];
        arrOut[1][0] = -arrOut[1][0];
        arrOut[1][2] = -arrOut[1][2];
        arrOut[2][1] = -arrOut[2][1];

        //Adjugate
        var temp;
        temp = arrOut[0][1];arrOut[0][1] = arrOut[1][0];arrOut[1][0] = temp;
        temp = arrOut[0][2];arrOut[0][2] = arrOut[2][0];arrOut[2][0] = temp;
        temp = arrOut[1][2];arrOut[1][2] = arrOut[2][1];arrOut[2][1] = temp;

        // Multiply by 1/Determinant
        var determinant = a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-g*e);
        arrOut[0][0] = arrOut[0][0]/determinant;
        arrOut[0][1] = arrOut[0][1]/determinant;
        arrOut[0][2] = arrOut[0][2]/determinant;
        arrOut[1][0] = arrOut[1][0]/determinant;
        arrOut[1][1] = arrOut[1][1]/determinant;
        arrOut[1][2] = arrOut[1][2]/determinant;
        arrOut[2][0] = arrOut[2][0]/determinant;
        arrOut[2][1] = arrOut[2][1]/determinant;
        arrOut[2][2] = arrOut[2][2]/determinant;
        var maOut = new MatrixXf(3,3);
        maOut.arr = arrOut;
        return maOut;
    }

    determinant(){
        var out;
        if ((this.rows!=3)||(this.cols!=3))
        return out;
        var a = this.arr[0][0];var b = this.arr[0][1];var c = this.arr[0][2];
        var d = this.arr[1][0];var e = this.arr[1][1];var f = this.arr[1][2];
        var g = this.arr[2][0];var h = this.arr[2][1];var i = this.arr[2][2];
        out = (a*(e*i - f*h)) - b*(d*i - f*g) + c*(d*h - e*g);
        return out;
    }

    multiplyMat(maIn){
        var maOut = new MatrixXf(this.rows,maIn.cols);
        for (var i=0; i<this.rows; i++)
            for (var j=0; j<maIn.cols;j++){
                var sum =0;
                for (var k=0; k<this.cols;k++)
                    sum += this.arr[i][k]*maIn.arr[k][j];
                maOut.arr[i][j] = sum;
            }
        return maOut;
    }

    addNum(num){
        var maOut = new MatrixXf(this.rows,this.cols);
        for (var i=0; i<this.rows; i++)
            for (var j=0; j<this.cols;j++){
                maOut.arr[i][j] = this.arr[i][j]+num;
            }
        return maOut;
    }
}

function arraySubtraction(arr1, arr2){
    var arrOut = [];
    for (var i=0; i<arr1.length; i++){
        arrOut[i] = arr1[i]-arr2[i];
    }
    return arrOut;
}

function convertArr2Mat(arrIn){
    var maOut = new MatrixXf(1, arrIn.length);
    for (var i=0; i<arrIn.length;i++)
        maOut.arr[0][i] = arrIn[i];
    return maOut;
}

function normalized(maIn){
    var sum;
    for (var i=0; i<maIn.arr.rows;i++){
        sum = Math.sqrt(maIn.arr[i][0]*maIn.arr[i][0]+maIn.arr[i][1]*maIn.arr[i][1]+maIn.arr[i][2]*maIn.arr[i][2]);
        maIn.arr[i][0] = maIn.arr[i][0]/sum;
        maIn.arr[i][1] = maIn.arr[i][1]/sum;
        maIn.arr[i][2] = maIn.arr[i][2]/sum;
    }
    return maIn;
}

function ascendingOrderSet(set){
    let arr = Array.from(set);
    arr.sort(function(a,b){return a-b;});
    var setOut = new Set(arr);
    return setOut;
}

function ascendingOrderMap(map){
    let arr = Array.from(map);
    arr.sort(function(a,b){return a[0]-b[0];});
    var mapOut = new Map();
    for (var i=0; i<arr.length; i++){
        var temp = arr[i][1].second;
        temp = ascendingOrderSet(temp);
        arr[i][1].second = temp;
        mapOut.set(arr[i][0], arr[i][1]);
    }
    return mapOut;
}