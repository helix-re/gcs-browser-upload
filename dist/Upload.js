'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _http = require('./http');

var _FileMeta = require('./FileMeta');

var _FileMeta2 = _interopRequireDefault(_FileMeta);

var _FileProcessor = require('./FileProcessor');

var _FileProcessor2 = _interopRequireDefault(_FileProcessor);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var _errors = require('./errors');

var errors = _interopRequireWildcard(_errors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MIN_CHUNK_SIZE = 262144;

var Upload = function () {
  function Upload(args, allowSmallChunks) {
    (0, _classCallCheck3.default)(this, Upload);

    var opts = (0, _extends3.default)({
      chunkSize: MIN_CHUNK_SIZE,
      storage: args.storage,
      contentType: 'text/plain',
      onChunkUpload: function onChunkUpload() {},
      onProgress: function onProgress() {},
      id: null,
      url: null,
      file: null
    }, args);

    if ((opts.chunkSize % MIN_CHUNK_SIZE !== 0 || opts.chunkSize === 0) && !allowSmallChunks) {
      throw new _errors.InvalidChunkSizeError(opts.chunkSize);
    }

    if (!opts.id || !opts.url || !opts.file) {
      throw new _errors.MissingOptionsError();
    }

    (0, _debug2.default)('Creating new upload instance:');
    (0, _debug2.default)(' - Url: ' + opts.url);
    (0, _debug2.default)(' - Id: ' + opts.id);
    (0, _debug2.default)(' - File size: ' + opts.file.size);
    (0, _debug2.default)(' - Chunk size: ' + opts.chunkSize);

    this.opts = opts;
    this.meta = new _FileMeta2.default(opts.id, opts.file.size, opts.chunkSize, opts.storage);
    this.processor = new _FileProcessor2.default(opts.file, opts.chunkSize);
  }

  (0, _createClass3.default)(Upload, [{
    key: 'start',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
        var _this = this;

        var meta, processor, opts, finished, resumeUpload, uploadChunk, validateChunk, getRemoteResumeIndex;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                meta = this.meta, processor = this.processor, opts = this.opts, finished = this.finished;

                resumeUpload = function () {
                  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                    var localResumeIndex, remoteResumeIndex, resumeIndex;
                    return _regenerator2.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            localResumeIndex = meta.getResumeIndex();
                            _context.next = 3;
                            return getRemoteResumeIndex();

                          case 3:
                            remoteResumeIndex = _context.sent;
                            resumeIndex = Math.min(localResumeIndex, remoteResumeIndex);

                            (0, _debug2.default)('Validating chunks up to index ' + resumeIndex);
                            (0, _debug2.default)(' - Remote index: ' + remoteResumeIndex);
                            (0, _debug2.default)(' - Local index: ' + localResumeIndex);

                            _context.prev = 8;
                            _context.next = 11;
                            return processor.run(validateChunk, 0, resumeIndex);

                          case 11:
                            _context.next = 22;
                            break;

                          case 13:
                            _context.prev = 13;
                            _context.t0 = _context['catch'](8);

                            (0, _debug2.default)('Validation failed, starting from scratch');
                            (0, _debug2.default)(' - Failed chunk index: ' + _context.t0.chunkIndex);
                            (0, _debug2.default)(' - Old checksum: ' + _context.t0.originalChecksum);
                            (0, _debug2.default)(' - New checksum: ' + _context.t0.newChecksum);

                            _context.next = 21;
                            return processor.run(uploadChunk);

                          case 21:
                            return _context.abrupt('return');

                          case 22:

                            (0, _debug2.default)('Validation passed, resuming upload');
                            _context.next = 25;
                            return processor.run(uploadChunk, resumeIndex);

                          case 25:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this, [[8, 13]]);
                  }));

                  return function resumeUpload() {
                    return _ref2.apply(this, arguments);
                  };
                }();

                uploadChunk = function () {
                  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(checksum, index, chunk) {
                    var total, start, end, headers, res;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            total = opts.file.size;
                            start = index * opts.chunkSize;
                            end = index * opts.chunkSize + chunk.byteLength - 1;
                            headers = {
                              'Content-Type': opts.contentType,
                              'Content-Range': 'bytes ' + start + '-' + end + '/' + total
                            };


                            (0, _debug2.default)('Uploading chunk ' + index + ':');
                            (0, _debug2.default)(' - Chunk length: ' + chunk.byteLength);
                            (0, _debug2.default)(' - Start: ' + start);
                            (0, _debug2.default)(' - End: ' + end);

                            // if in browser, upload blobs or else the browser can hang/crash on large ArrayBuffer uploads (150mb+)
                            if (typeof self.Blob !== 'undefined') {
                              chunk = new Blob([chunk]);
                            }
                            _context2.next = 11;
                            return (0, _http.safePut)(opts.url, chunk, {
                              headers: headers, onUploadProgress: function onUploadProgress(progressEvent) {
                                opts.onProgress({
                                  totalBytes: total,
                                  uploadedBytes: start + progressEvent.loaded,
                                  chunkIndex: index,
                                  chunkLength: chunk.byteLength || chunk.size
                                });
                              }
                            });

                          case 11:
                            res = _context2.sent;


                            checkResponseStatus(res, opts, [200, 201, 308]);
                            (0, _debug2.default)('Chunk upload succeeded, adding checksum ' + checksum);
                            meta.addChecksum(index, checksum);

                            opts.onChunkUpload({
                              totalBytes: total,
                              uploadedBytes: end + 1,
                              chunkIndex: index,
                              chunkLength: chunk.byteLength || chunk.size,
                              isLastChunk: total === end + 1
                            });

                          case 16:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this);
                  }));

                  return function uploadChunk(_x, _x2, _x3) {
                    return _ref3.apply(this, arguments);
                  };
                }();

                validateChunk = function () {
                  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(newChecksum, index) {
                    var originalChecksum, isChunkValid;
                    return _regenerator2.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            originalChecksum = meta.getChecksum(index);
                            isChunkValid = originalChecksum === newChecksum;

                            if (isChunkValid) {
                              _context3.next = 5;
                              break;
                            }

                            meta.reset();
                            throw new _errors.DifferentChunkError(index, originalChecksum, newChecksum);

                          case 5:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this);
                  }));

                  return function validateChunk(_x4, _x5) {
                    return _ref4.apply(this, arguments);
                  };
                }();

                getRemoteResumeIndex = function () {
                  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
                    var bytesReceived, headers, res, rangeHeader, range;
                    return _regenerator2.default.wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            bytesReceived = 0;
                            headers = {
                              'Content-Range': 'bytes */' + opts.file.size,
                              'Content-Type': opts.contentType
                            };

                            (0, _debug2.default)('Retrieving upload status from GCS');
                            _context4.next = 5;
                            return (0, _http.safePut)(opts.url, null, { headers: headers });

                          case 5:
                            res = _context4.sent;


                            checkResponseStatus(res, opts, [308]);
                            rangeHeader = res.headers['range'];

                            if (rangeHeader) {
                              (0, _debug2.default)('Received upload status from GCS: ' + rangeHeader);
                              range = rangeHeader.match(/(\d+?)-(\d+?)$/);

                              bytesReceived = parseInt(range[2]) + 1;
                            }

                            return _context4.abrupt('return', Math.floor(bytesReceived / opts.chunkSize));

                          case 10:
                          case 'end':
                            return _context4.stop();
                        }
                      }
                    }, _callee4, _this);
                  }));

                  return function getRemoteResumeIndex() {
                    return _ref5.apply(this, arguments);
                  };
                }();

                if (!finished) {
                  _context5.next = 7;
                  break;
                }

                throw new _errors.UploadAlreadyFinishedError();

              case 7:
                if (!meta.isResumable()) {
                  _context5.next = 13;
                  break;
                }

                (0, _debug2.default)('Upload might be resumable');
                _context5.next = 11;
                return resumeUpload();

              case 11:
                _context5.next = 16;
                break;

              case 13:
                (0, _debug2.default)('Upload not resumable, starting from scratch');
                _context5.next = 16;
                return processor.run(uploadChunk);

              case 16:
                (0, _debug2.default)('Upload complete, resetting meta');
                meta.reset();
                this.finished = true;

              case 19:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function start() {
        return _ref.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'pause',
    value: function pause() {
      this.processor.pause();
      (0, _debug2.default)('Upload paused');
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      this.processor.unpause();
      (0, _debug2.default)('Upload unpaused');
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.processor.pause();
      this.meta.reset();
      (0, _debug2.default)('Upload cancelled');
    }
  }]);
  return Upload;
}();

Upload.errors = errors;
Upload.safePut = _http.safePut;
exports.default = Upload;


function checkResponseStatus(res, opts) {
  var allowed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var status = res.status;

  if (allowed.indexOf(status) > -1) {
    return true;
  }

  switch (status) {
    case 308:
      throw new _errors.UploadIncompleteError();

    case 201:
    case 200:
      throw new _errors.FileAlreadyUploadedError(opts.id, opts.url);

    case 400:
      throw new _errors.BadRequestError(status);

    case 404:
      throw new _errors.UrlNotFoundError(opts.url);

    case 500:
    case 502:
    case 503:
    case 504:
      throw new _errors.UploadFailedError(status);

    default:
      throw new _errors.UnknownResponseError(res);
  }
}