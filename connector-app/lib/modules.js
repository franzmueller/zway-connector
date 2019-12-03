const ROOT = "userModules/SenergyConnector";
const ZWAY_MODULE_NAME = "zway"; //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))

var Modules = {
    _modules: {},

};

Modules.include = function(dir /*string*/) {
    if(!Modules._modules[dir]) {
        try {
            executeFile(ROOT + "/lib/" + dir + "/module.js");
        } catch (e) {
            console.log("ERROR: unable to include module:", dir, e)
        }
    }
    return Modules.get(dir)
};

Modules.loadJson = function(fileName) {
    try {
        return fs.loadJSON(ROOT+"/"+fileName);
    }catch (e) {
        console.log("ERROR: unable to load json:", fileName, e);
        return {}
    }
};

Modules.registerModule = function(dir /*string*/, initFunc /*function(module)*/){
    Modules._modules[dir] = initFunc({
        add: function (filename /*string (without .js)*/) {
            try {
                executeFile(ROOT+"/lib/"+dir+"/"+filename+".js");
            }catch (e) {
                console.log("ERROR: unable to add file to module:", dir, filename, JSON.stringify(e))
            }
        },
        include: function(subdir /*string*/) {
            return Modules.include(dir+"/"+subdir);
        }
    });
    if(!Modules._modules[dir]){
        console.log("WARNING: null module "+dir);
        Modules._modules[dir] = {};
    }
};

Modules.get = function (dir /*string*/) {
    return Modules._modules[dir];
};

Modules.helper = {
    map: function (arr, f) {
        if(!arr.map){
            arr.map = Array.prototype.map;
        }
        return arr.map(f)
    }
};

//Array.prototype.map() polyfill from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }
        return A;
    };
}
