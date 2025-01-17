/**
  * UPYUN js-sdk 3.3.12
  * (c) 2019
  * @license MIT
  */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));
var isPromise = _interopDefault(require('is-promise'));
var url = _interopDefault(require('url'));
var fs = _interopDefault(require('fs'));
var mime = _interopDefault(require('mime-types'));
var FormData = _interopDefault(require('form-data'));
var path = _interopDefault(require('path'));
var hmacsha1 = _interopDefault(require('hmacsha1'));
var base64 = _interopDefault(require('base-64'));
var md5 = _interopDefault(require('md5'));

// NOTE: choose node.js first
// process is defined in client test

var isBrowser = typeof window !== 'undefined' && (typeof process === 'undefined' || process.title === 'browser');

var PARTSIZE = 1024 * 1024;

var adapter = axios.defaults.adapter;

axios.defaults.adapter = function () {
  // NOTE: in electron environment, support http and xhr both, use http adapter first
  if (isBrowser) {
    return adapter;
  }

  var http = require('axios/lib/adapters/http');
  return http;
}();

var createReq = function (endpoint, service, getHeaderSign) {
  var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      proxy = _ref.proxy;

  var req = axios.create({
    baseURL: endpoint + '/' + service.serviceName,
    maxRedirects: 0,
    proxy: proxy
  });

  req.interceptors.request.use(function (config) {
    var method = config.method.toUpperCase();
    var path$$1 = url.resolve('/', config.url || '');

    if (path$$1.indexOf(config.baseURL) === 0) {
      path$$1 = path$$1.substring(config.baseURL.length);
    }
    config.url = encodeURI(config.url);
    var headerSign = getHeaderSign(service, method, path$$1, config.headers['Content-MD5']);
    headerSign = isPromise(headerSign) ? headerSign : Promise.resolve(headerSign);

    return headerSign.then(function (headers) {
      config.headers.common = headers;
      return Promise.resolve(config);
    });
  }, function (error) {
    throw new Error('upyun - request failed: ' + error.message);
  });

  req.interceptors.response.use(function (response) {
    return response;
  }, function (error) {
    var response = error.response;

    if (typeof response === 'undefined') {
      throw error;
    }

    if (response.status !== 404) {
      throw new Error('upyun - response error: ' + error.message);
    } else {
      return response;
    }
  });
  return req;
};

function readBlockAsync(filePath, start, end) {
  var size = end - start;
  var b = makeBuffer(size);
  return new Promise(function (resolve, reject) {
    fs.open(filePath, 'r', function (err, fd) {
      if (err) {
        return reject(err);
      }

      fs.read(fd, b, 0, size, start, function (err, bytesRead, buffer) {
        if (err) {
          return reject(err);
        }

        return resolve(buffer);
      });
    });
  });
}

function makeBuffer(size) {
  if (Buffer.alloc) {
    return Buffer.alloc(size);
  } else {
    var b = new Buffer(size);
    b.fill(0);
    return b;
  }
}

function getFileSizeAsync(filePath) {
  return new Promise(function (resolve, reject) {
    fs.stat(filePath, function (err, stat) {
      if (err) return reject(err);

      return resolve(stat.size);
    });
  });
}

function getContentType(filePath) {
  return mime.lookup(filePath);
}

var utils = {
  readBlockAsync: readBlockAsync,
  getFileSizeAsync: getFileSizeAsync,
  getContentType: getContentType
};

function formUpload(remoteUrl, localFile, _ref) {
  var authorization = _ref.authorization,
      policy = _ref.policy;

  var _ref2 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      filename = _ref2.filename;

  return new Promise(function (resolve, reject) {
    var data = new FormData();
    data.append('authorization', authorization);
    data.append('policy', policy);
    // NOTE when type of localFile is buffer/string,
    // force set filename=file, FormData will treat it as a file
    // real filename will be set by save-key in policy
    filename = filename || localFile.name || localFile.path ? path.basename(filename || localFile.name || localFile.path) : 'file';

    data.append('file', localFile, {
      filename: filename
    });
    data.submit(remoteUrl, function (err, res) {
      if (err) {
        return reject(err);
      }

      if (res.statusCode !== 200) {
        return resolve(false);
      }

      var body = [];
      res.on('data', function (chunk) {
        body.push(chunk);
      });
      res.on('end', function () {
        body = Buffer.concat(body).toString('utf8');
        try {
          var _data = JSON.parse(body);
          return resolve(_data);
        } catch (err) {
          return reject(err);
        }
      });

      res.on('error', function (err) {
        reject(err);
      });
    });
  });
}

var name = "upyun";
var version = "3.3.12";
var description = "UPYUN js sdk";
var main = "dist/upyun.common.js";
var module$1 = "dist/upyun.esm.js";
var scripts = { "build": "node build/build.js", "lint": "eslint .", "test": "npm run test:server && npm run test:client", "test:client": "karma start tests/karma.conf.js", "test:server": "mocha --compilers js:babel-register tests/server/*", "preversion": "npm run lint && npm run test", "version": "npm run build && git add -A dist", "postversion": "git push && git push --tags" };
var repository = { "type": "git", "url": "git@github.com:upyun/node-sdk.git" };
var engines = { "node": ">=8.0.0" };
var keywords = ["upyun", "js", "nodejs", "sdk", "cdn", "cloud", "storage"];
var author = "Leigh";
var license = "MIT";
var bugs = { "url": "https://github.com/upyun/node-sdk/issues" };
var homepage = "https://github.com/upyun/node-sdk";
var contributors = [{ "name": "yejingx", "email": "yejingx@gmail.com" }, { "name": "Leigh", "email": "i@zhuli.me" }, { "name": "kaidiren", "email": "kaidiren@gmail.com" }, { "name": "Gaara", "email": "sabakugaara@users.noreply.github.com" }];
var devDependencies = { "babel-cli": "^6.24.1", "babel-loader": "^7.0.0", "babel-plugin-external-helpers": "^6.22.0", "babel-plugin-transform-runtime": "^6.23.0", "babel-preset-env": "^1.4.0", "babel-register": "^6.24.1", "chai": "^3.5.0", "delay": "^4.2.0", "eslint": "^5.16.0", "istanbul": "^0.4.3", "karma": "^1.7.0", "karma-chrome-launcher": "^2.1.1", "karma-mocha": "^1.3.0", "karma-sourcemap-loader": "^0.3.7", "karma-webpack": "^2.0.3", "mocha": "^3.4.1", "rollup": "^0.41.6", "rollup-plugin-alias": "^1.3.1", "rollup-plugin-babel": "^2.7.1", "rollup-plugin-commonjs": "^8.0.2", "rollup-plugin-json": "^2.1.1", "rollup-plugin-node-resolve": "^3.0.0", "should": "^9.0.2", "uglify-js": "^3.0.11", "webpack": "^2.5.1" };
var dependencies = { "axios": "^0.18.0", "base-64": "^0.1.0", "form-data": "^2.1.4", "hmacsha1": "^1.0.0", "is-promise": "^2.1.0", "md5": "^2.2.1", "mime-types": "^2.1.15" };
var browser = { "./upyun/utils.js": "./upyun/browser-utils.js", "./upyun/form-upload.js": "./upyun/browser-form-upload.js" };
var pkg = {
	name: name,
	version: version,
	description: description,
	main: main,
	module: module$1,
	scripts: scripts,
	repository: repository,
	engines: engines,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	contributors: contributors,
	devDependencies: devDependencies,
	dependencies: dependencies,
	browser: browser
};

/**
 * generate head sign
 * @param {object} service
 * @param {string} path - storage path on upyun server, e.g: /your/dir/example.txt
 * @param {string} contentMd5 - md5 of the file that will be uploaded
 */
function getHeaderSign(service, method, path$$1) {
  var contentMd5 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  var date = new Date().toGMTString();
  path$$1 = '/' + service.serviceName + path$$1;
  var sign = genSign(service, {
    method: method,
    path: path$$1,
    date: date,
    contentMd5: contentMd5
  });
  return {
    'Authorization': sign,
    'X-Date': date
  };
}

/**
 * generate signature string which can be used in head sign or body sign
 * @param {object} service
 * @param {object} options - must include key is method, path
 */
function genSign(service, options) {
  var method = options.method,
      path$$1 = options.path;


  var data = [method, encodeURI(path$$1)];

  // optional params
  ['date', 'policy', 'contentMd5'].forEach(function (item) {
    if (options[item]) {
      data.push(options[item]);
    }
  });

  // hmacsha1 return base64 encoded string
  var sign = hmacsha1(service.password, data.join('&'));
  return 'UPYUN ' + service.operatorName + ':' + sign;
}

/**
 * get policy and authorization for form api
 * @param {object} service
 * @param {object} - other optional params @see http://docs.upyun.com/api/form_api/#_2
 */
function getPolicyAndAuthorization(service, params) {
  params['service'] = service.serviceName;
  if (typeof params['save-key'] === 'undefined') {
    throw new Error('upyun - calclate body sign need save-key');
  }

  if (typeof params['expiration'] === 'undefined') {
    // default 30 minutes
    params['expiration'] = parseInt(new Date() / 1000 + 30 * 60, 10);
  }

  var policy = base64.encode(JSON.stringify(params));
  var authorization = genSign(service, {
    method: 'POST',
    path: '/' + service.serviceName,
    policy: policy,
    contentMd5: params['content-md5']
  });
  return {
    policy: policy,
    authorization: authorization
  };
}

function getPurgeHeaderSign(service, urls) {
  var date = new Date().toGMTString();
  var str = urls.join('\n');
  var sign = md5(str + '&' + service.serviceName + '&' + date + '&' + service.password);

  return {
    'Authorization': 'UpYun ' + service.serviceName + ':' + service.operatorName + ':' + sign,
    'Date': date,
    'User-Agent': 'Js-Sdk/' + pkg.version
  };
}

var sign = {
  genSign: genSign,
  getHeaderSign: getHeaderSign,
  getPolicyAndAuthorization: getPolicyAndAuthorization,
  getPurgeHeaderSign: getPurgeHeaderSign
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

/**
 * @class
 */

var Upyun = function () {
  /**
   * @param {object} service - a instance of Service class
   * @param {object} params - optional params
   * @param {callback} getHeaderSign - callback function to get header sign
   */
  function Upyun(service) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var getHeaderSign$$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    classCallCheck(this, Upyun);

    if (typeof service.serviceName === 'undefined') {
      throw new Error('upyun - must config serviceName');
    }

    if (typeof params === 'function') {
      getHeaderSign$$1 = params;
      params = {};
    }

    if (typeof getHeaderSign$$1 !== 'function' && isBrowser) {
      throw new Error('upyun - must config a callback function getHeaderSign in client side');
    }

    if (!isBrowser && (typeof service.operatorName === 'undefined' || typeof service.password === 'undefined')) {
      throw new Error('upyun - must config operateName and password in server side');
    }

    var config = Object.assign({
      domain: 'v0.api.upyun.com',
      protocol: 'https'
      // proxy: false // 禁用代理 // 参考 axios 配置. 如: {host: '127.0.0.1', post: 1081}
    }, params);

    this.endpoint = config.protocol + '://' + config.domain;
    var proxy = config.proxy;

    this.proxy = proxy;
    this.req = createReq(this.endpoint, service, getHeaderSign$$1 || defaultGetHeaderSign, { proxy: proxy });
    // NOTE this will be removed
    this.bucket = service;
    this.service = service;
    if (!isBrowser) {
      this.setBodySignCallback(sign.getPolicyAndAuthorization);
    }
  }

  createClass(Upyun, [{
    key: 'setService',
    value: function setService(service) {
      this.service = service;
      this.req.defaults.baseURL = this.endpoint + '/' + service.serviceName;
    }

    // NOTE this will be removed

  }, {
    key: 'setBucket',
    value: function setBucket(bucket) {
      return this.setService(bucket);
    }
  }, {
    key: 'setBodySignCallback',
    value: function setBodySignCallback(getBodySign) {
      if (typeof getBodySign !== 'function') {
        throw new Error('upyun - getBodySign should be a function');
      }
      this.bodySignCallback = getBodySign;
    }
  }, {
    key: 'usage',
    value: function usage() {
      var path$$1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';

      return this.req.get(path$$1 + '?usage').then(function (_ref) {
        var data = _ref.data;

        return Promise.resolve(data);
      });
    }
  }, {
    key: 'listDir',
    value: function listDir() {
      var path$$1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';

      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$limit = _ref2.limit,
          limit = _ref2$limit === undefined ? 100 : _ref2$limit,
          _ref2$order = _ref2.order,
          order = _ref2$order === undefined ? 'asc' : _ref2$order,
          _ref2$iter = _ref2.iter,
          iter = _ref2$iter === undefined ? '' : _ref2$iter;

      var requestHeaders = {};

      // NOTE: 默认值可以省去请求头设置，避免跨域影响
      if (limit !== 100) {
        requestHeaders['x-list-limit'] = limit;
      }

      if (order !== 'asc') {
        requestHeaders['x-list-order'] = order;
      }

      if (iter) {
        requestHeaders['x-list-iter'] = iter;
      }

      return this.req.get(path$$1, {
        headers: requestHeaders
      }).then(function (_ref3) {
        var data = _ref3.data,
            headers = _ref3.headers,
            status = _ref3.status;

        if (status === 404) {
          return false;
        }

        var next = headers['x-upyun-list-iter'];
        if (!data) {
          return Promise.resolve({
            files: [],
            next: next
          });
        }

        var items = data.split('\n');
        var files = items.map(function (item) {
          var _item$split = item.split('\t'),
              _item$split2 = slicedToArray(_item$split, 4),
              name = _item$split2[0],
              type = _item$split2[1],
              size = _item$split2[2],
              time = _item$split2[3];

          return {
            name: name,
            type: type,
            size: parseInt(size),
            time: parseInt(time)
          };
        });

        return Promise.resolve({
          files: files,
          next: next
        });
      });
    }

    /**
     * @param localFile: file content, available type is Stream | String | Buffer for server; File | String for client
     * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send
     * @see https://github.com/mzabriskie/axios/blob/master/lib/adapters/http.js#L32
     */

  }, {
    key: 'putFile',
    value: function putFile(remotePath, localFile) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      // optional params
      var keys = ['Content-MD5', 'Content-Length', 'Content-Type', 'Content-Secret', 'x-gmkerl-thumb'];
      var headers = {};
      var optionsLower = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(options)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          optionsLower[key.toLowerCase()] = options[key];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(optionsLower)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _key = _step2.value;

          if (isMeta(_key) && optionsLower[_key]) {
            headers[_key] = optionsLower[_key];
          } else {
            keys.forEach(function (key) {
              var lower = key.toLowerCase();
              var finded = optionsLower[lower];
              if (finded) {
                headers[key] = finded;
              }
            });
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return this.req.put(remotePath, localFile, {
        headers: headers
      }).then(function (_ref4) {
        var responseHeaders = _ref4.headers,
            status = _ref4.status;

        if (status !== 200) {
          return Promise.resolve(false);
        }

        var params = ['x-upyun-width', 'x-upyun-height', 'x-upyun-file-type', 'x-upyun-frames'];
        var result = {};
        params.forEach(function (item) {
          var key = item.split('x-upyun-')[1];
          if (responseHeaders[item]) {
            result[key] = responseHeaders[item];
            if (key !== 'file-type') {
              result[key] = parseInt(result[key], 10);
            }
          }
        });
        return Promise.resolve(Object.keys(result).length > 0 ? result : true);
      });
    }
  }, {
    key: 'initMultipartUpload',
    value: function initMultipartUpload(remotePath, fileOrPath) {
      var _this = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var fileSizePromise = void 0;
      var lowerOptions = key2LowerCase(options);
      var contentType = lowerOptions['x-upyun-multi-type'];

      if (isBrowser) {
        fileSizePromise = Promise.resolve(fileOrPath.size);
        contentType = contentType || fileOrPath.type;
      } else {
        fileSizePromise = utils.getFileSizeAsync(fileOrPath);
        contentType = contentType || utils.getContentType(fileOrPath);
      }

      return fileSizePromise.then(function (fileSize) {
        Object.assign(lowerOptions, {
          'x-upyun-multi-disorder': true,
          'x-upyun-multi-stage': 'initiate',
          'x-upyun-multi-length': fileSize,
          'x-upyun-multi-type': contentType
        });

        return _this.req.put(remotePath, null, {
          headers: lowerOptions
        }).then(function (_ref5) {
          var headers = _ref5.headers,
              status = _ref5.status;

          if (status !== 204) {
            return Promise.resolve(false);
          }

          var uuid = headers['x-upyun-multi-uuid'];

          return Promise.resolve({
            fileSize: fileSize,
            partCount: Math.ceil(fileSize / PARTSIZE),
            uuid: uuid
          });
        });
      });
    }
  }, {
    key: 'multipartUpload',
    value: function multipartUpload(remotePath, fileOrPath, multiUuid, partId) {
      var _this2 = this;

      var start = partId * PARTSIZE;
      var fileSizePromise = void 0;
      // let contentType

      if (isBrowser) {
        fileSizePromise = Promise.resolve(fileOrPath.size);
        // contentType = fileOrPath.type
      } else {
        fileSizePromise = utils.getFileSizeAsync(fileOrPath);
        // contentType = utils.getContentType(fileOrPath)
      }

      var blockPromise = fileSizePromise.then(function (fileSize) {
        var end = Math.min(start + PARTSIZE, fileSize);
        return utils.readBlockAsync(fileOrPath, start, end);
      });

      return blockPromise.then(function (block) {
        return _this2.req.put(remotePath, block, {
          headers: {
            'x-upyun-multi-stage': 'upload',
            'x-upyun-multi-uuid': multiUuid,
            'x-upyun-part-id': partId
          }
        }).then(function (_ref6) {
          var status = _ref6.status;

          return Promise.resolve(status === 204);
        });
      });
    }
  }, {
    key: 'completeMultipartUpload',
    value: function completeMultipartUpload(remotePath, multiUuid) {
      return this.req.put(remotePath, null, {
        headers: {
          'x-upyun-multi-stage': 'complete',
          'x-upyun-multi-uuid': multiUuid
        }
      }).then(function (_ref7) {
        var status = _ref7.status;

        return Promise.resolve(status === 204 || status === 201);
      });
    }
  }, {
    key: 'makeDir',
    value: function makeDir(remotePath) {
      return this.req.post(remotePath, null, {
        headers: { folder: 'true' }
      }).then(function (_ref8) {
        var status = _ref8.status;

        return Promise.resolve(status === 200);
      });
    }
  }, {
    key: 'headFile',
    value: function headFile(remotePath) {
      return this.req.head(remotePath).then(function (_ref9) {
        var headers = _ref9.headers,
            status = _ref9.status;

        if (status === 404) {
          return Promise.resolve(false);
        }

        var params = ['x-upyun-file-type', 'x-upyun-file-size', 'x-upyun-file-date'];
        var result = {
          'Content-Md5': headers['content-md5'] || ''
        };

        params.forEach(function (item) {
          var key = item.split('x-upyun-file-')[1];
          if (headers[item]) {
            result[key] = headers[item];
            if (key === 'size' || key === 'date') {
              result[key] = parseInt(result[key], 10);
            }
          }
        });
        return Promise.resolve(result);
      });
    }
  }, {
    key: 'deleteFile',
    value: function deleteFile(remotePath) {
      var isAsync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var headers = {};
      if (isAsync) {
        headers['x-upyun-async'] = true;
      }
      return this.req.delete(remotePath, {
        headers: headers
      }).then(function (_ref10) {
        var status = _ref10.status;

        return Promise.resolve(status === 200);
      });
    }
  }, {
    key: 'deleteDir',
    value: function deleteDir() {
      for (var _len = arguments.length, args = Array(_len), _key2 = 0; _key2 < _len; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return this.deleteFile.apply(this, args);
    }
  }, {
    key: 'getFile',
    value: function getFile(remotePath) {
      var saveStream = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (saveStream && isBrowser) {
        throw new Error('upyun - save as stream are only available on the server side.');
      }

      return this.req({
        method: 'GET',
        url: remotePath,
        responseType: saveStream ? 'stream' : null
      }).then(function (response) {
        if (response.status === 404) {
          return Promise.resolve(false);
        }

        if (!saveStream) {
          return Promise.resolve(response.data);
        }

        var stream = response.data.pipe(saveStream);

        return new Promise(function (resolve, reject) {
          stream.on('finish', function () {
            return resolve(stream);
          });

          stream.on('error', reject);
        });
      });
    }
  }, {
    key: 'updateMetadata',
    value: function updateMetadata(remotePath, metas) {
      var operate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'merge';

      var metaHeaders = {};
      for (var key in metas) {
        if (!isMeta(key)) {
          metaHeaders['x-upyun-meta-' + key] = metas[key];
        } else {
          metaHeaders[key] = metas;
        }
      }

      return this.req.patch(remotePath + '?metadata=' + operate, null, { headers: metaHeaders }).then(function (_ref11) {
        var status = _ref11.status;

        return Promise.resolve(status === 200);
      });
    }

    // be careful: this will download the entire file

  }, {
    key: 'getMetadata',
    value: function getMetadata(remotePath) {
      return this.req.get(remotePath).then(function (_ref12) {
        var headers = _ref12.headers,
            status = _ref12.status;

        if (status !== 200) {
          return Promise.resolve(false);
        }

        var result = {};
        for (var key in headers) {
          if (isMeta(key)) {
            result[key] = headers[key];
          }
        }

        return Promise.resolve(result);
      });
    }

    /**
     * in browser: type of fileOrPath is File
     * in server: type of fileOrPath is string: local file path
     */

  }, {
    key: 'blockUpload',
    value: function blockUpload(remotePath, fileOrPath) {
      var _this3 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var fileSizePromise = void 0;
      var contentType = void 0;
      if (isBrowser) {
        fileSizePromise = Promise.resolve(fileOrPath.size);
        contentType = fileOrPath.type;
      } else {
        fileSizePromise = utils.getFileSizeAsync(fileOrPath);
        contentType = utils.getContentType(fileOrPath);
      }

      return fileSizePromise.then(function (fileSize) {
        Object.assign(options, {
          'x-upyun-multi-stage': 'initiate',
          'x-upyun-multi-length': fileSize,
          'x-upyun-multi-type': contentType
        });

        var blockSize = 1024 * 1024;
        var blocks = Math.ceil(fileSize / blockSize);

        return _this3.req.put(remotePath, null, {
          headers: options
        }).then(function (_ref13) {
          var headers = _ref13.headers;

          var uuid = headers['x-upyun-multi-uuid'];
          var nextId = headers['x-upyun-next-part-id'];

          var p = Promise.resolve(nextId);
          for (var index = 0; index < blocks; index++) {
            p = p.then(function (nextId) {
              var start = nextId * blockSize;
              var end = Math.min(start + blockSize, fileSize);
              var blockPromise = utils.readBlockAsync(fileOrPath, start, end);
              return blockPromise.then(function (block) {
                return _this3.req.put(remotePath, block, {
                  headers: {
                    'x-upyun-multi-stage': 'upload',
                    'x-upyun-multi-uuid': uuid,
                    'x-upyun-part-id': nextId
                  }
                }).then(function (_ref14) {
                  var headers = _ref14.headers;

                  nextId = headers['x-upyun-next-part-id'];
                  return Promise.resolve(nextId);
                });
              });
            });
          }

          return p.then(function () {
            return _this3.req.put(remotePath, null, {
              headers: {
                'x-upyun-multi-stage': 'complete',
                'x-upyun-multi-uuid': uuid
              }
            }).then(function (_ref15) {
              var status = _ref15.status;

              return Promise.resolve(status === 204 || status === 201);
            });
          });
        });
      });
    }
  }, {
    key: 'formPutFile',
    value: function formPutFile(remotePath, localFile) {
      var _this4 = this;

      var orignParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var params = {};
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Object.keys(orignParams)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var key = _step3.value;

          params[key.toLowerCase()] = orignParams[key];
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      if (typeof this.bodySignCallback !== 'function') {
        throw new Error('upyun - must setBodySignCallback first!');
      }

      params['service'] = this.service.serviceName;
      params['save-key'] = remotePath;
      var result = this.bodySignCallback(this.service, params);
      result = isPromise(result) ? result : Promise.resolve(result);

      return result.then(function (bodySign) {
        return formUpload(_this4.endpoint + '/' + params['service'], localFile, bodySign, opts);
      });
    }
  }, {
    key: 'purge',
    value: function purge(urls) {
      if (typeof urls === 'string') {
        urls = [urls];
      }
      var headers = sign.getPurgeHeaderSign(this.service, urls);
      return axios.post('http://purge.upyun.com/purge/', 'purge=' + urls.join('\n'), {
        headers: headers,
        proxy: this.proxy
      }).then(function (_ref16) {
        var data = _ref16.data;

        if (Object.keys(data.invalid_domain_of_url).length === 0) {
          return true;
        } else {
          throw new Error('some url purge failed ' + data.invalid_domain_of_url.join(' '));
        }
      }, function (err) {
        throw new Error('upyun - request failed: ' + err.message);
      });
    }
  }, {
    key: 'commitProcessingTask',
    value: function commitProcessingTask(filePath, notifyUrl) {
      var tasks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var params = {
        source: filePath,
        service: this.bucket,
        tasks: Buffer.from(JSON.stringify(tasks)).toString('base64'),
        notify_url: notifyUrl,
        accept: opts.accept || 'json'
      };

      return this.req.post('/pretreatment/', params);
    }
  }, {
    key: 'getProcessingTaskStatus',
    value: function getProcessingTaskStatus() {
      var taskIds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      return this.req.get('/status', {
        params: {
          service: this.bucket,
          task_ids: taskIds.join(',')
        }
      });
    }
  }, {
    key: 'getProcessingTaskResult',
    value: function getProcessingTaskResult() {
      var taskIds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      return this.req.get('/result', {
        params: {
          service: this.bucket,
          task_ids: taskIds.join(',')
        }
      });
    }
  }]);
  return Upyun;
}();

function isMeta(key) {
  return key.indexOf('x-upyun-meta-') === 0;
}

function defaultGetHeaderSign() {
  return sign.getHeaderSign.apply(sign, arguments);
}

function key2LowerCase(obj) {
  var objLower = {};
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = Object.keys(obj)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var key = _step4.value;

      objLower[key.toLowerCase()] = obj[key];
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return objLower;
}

/**
 * @class
 */

var Service = function Service(serviceName) {
  var operatorName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var password = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  classCallCheck(this, Service);

  // NOTE bucketName will be removed
  this.bucketName = serviceName;
  this.serviceName = this.bucketName;
  this.operatorName = operatorName;
  this.password = md5(password);
};

var index = {
  Client: Upyun,
  sign: sign,
  Bucket: Service,
  Service: Service
};

module.exports = index;
