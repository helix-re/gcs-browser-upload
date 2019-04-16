'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UploadAlreadyFinishedError = exports.InvalidChunkSizeError = exports.UploadIncompleteError = exports.MissingOptionsError = exports.UnknownResponseError = exports.BadRequestError = exports.UploadUnableToRecoverError = exports.UploadFailedError = exports.UrlNotFoundError = exports.FileAlreadyUploadedError = exports.ResumeIndexesOutOfSyncError = exports.InvalidContentRangeError = exports.DifferentChunkError = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DifferentChunkError = exports.DifferentChunkError = function (_ExtendableError) {
  (0, _inherits3.default)(DifferentChunkError, _ExtendableError);

  function DifferentChunkError(chunkIndex, originalChecksum, newChecksum) {
    (0, _classCallCheck3.default)(this, DifferentChunkError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (DifferentChunkError.__proto__ || Object.getPrototypeOf(DifferentChunkError)).call(this, 'Chunk at index \'' + chunkIndex + '\' is different to original'));

    _this.chunkIndex = chunkIndex;
    _this.originalChecksum = originalChecksum;
    _this.newChecksum = newChecksum;
    return _this;
  }

  return DifferentChunkError;
}(_es6Error2.default);

var InvalidContentRangeError = exports.InvalidContentRangeError = function (_ExtendableError2) {
  (0, _inherits3.default)(InvalidContentRangeError, _ExtendableError2);

  function InvalidContentRangeError(localResumeIndex, remoteResumeIndex) {
    (0, _classCallCheck3.default)(this, InvalidContentRangeError);
    return (0, _possibleConstructorReturn3.default)(this, (InvalidContentRangeError.__proto__ || Object.getPrototypeOf(InvalidContentRangeError)).call(this, 'Local resume index (' + localResumeIndex + ') is our of sync with the remote resume index (' + remoteResumeIndex + ')'));
  }

  return InvalidContentRangeError;
}(_es6Error2.default);

var ResumeIndexesOutOfSyncError = exports.ResumeIndexesOutOfSyncError = function (_ExtendableError3) {
  (0, _inherits3.default)(ResumeIndexesOutOfSyncError, _ExtendableError3);

  function ResumeIndexesOutOfSyncError(localResumeIndex, remoteResumeIndex) {
    (0, _classCallCheck3.default)(this, ResumeIndexesOutOfSyncError);
    return (0, _possibleConstructorReturn3.default)(this, (ResumeIndexesOutOfSyncError.__proto__ || Object.getPrototypeOf(ResumeIndexesOutOfSyncError)).call(this, 'Local resume index (' + localResumeIndex + ') is our of sync with the remote resume inxed (' + remoteResumeIndex + ')'));
  }

  return ResumeIndexesOutOfSyncError;
}(_es6Error2.default);

var FileAlreadyUploadedError = exports.FileAlreadyUploadedError = function (_ExtendableError4) {
  (0, _inherits3.default)(FileAlreadyUploadedError, _ExtendableError4);

  function FileAlreadyUploadedError(id, url) {
    (0, _classCallCheck3.default)(this, FileAlreadyUploadedError);
    return (0, _possibleConstructorReturn3.default)(this, (FileAlreadyUploadedError.__proto__ || Object.getPrototypeOf(FileAlreadyUploadedError)).call(this, 'File \'' + id + '\' has already been uploaded to unique url \'' + url + '\''));
  }

  return FileAlreadyUploadedError;
}(_es6Error2.default);

var UrlNotFoundError = exports.UrlNotFoundError = function (_ExtendableError5) {
  (0, _inherits3.default)(UrlNotFoundError, _ExtendableError5);

  function UrlNotFoundError(url) {
    (0, _classCallCheck3.default)(this, UrlNotFoundError);
    return (0, _possibleConstructorReturn3.default)(this, (UrlNotFoundError.__proto__ || Object.getPrototypeOf(UrlNotFoundError)).call(this, 'Upload URL \'' + url + '\' has either expired or is invalid'));
  }

  return UrlNotFoundError;
}(_es6Error2.default);

var UploadFailedError = exports.UploadFailedError = function (_ExtendableError6) {
  (0, _inherits3.default)(UploadFailedError, _ExtendableError6);

  function UploadFailedError(status) {
    (0, _classCallCheck3.default)(this, UploadFailedError);
    return (0, _possibleConstructorReturn3.default)(this, (UploadFailedError.__proto__ || Object.getPrototypeOf(UploadFailedError)).call(this, 'HTTP status ' + status + ' received from GCS, consider retrying'));
  }

  return UploadFailedError;
}(_es6Error2.default);

var UploadUnableToRecoverError = exports.UploadUnableToRecoverError = function (_ExtendableError7) {
  (0, _inherits3.default)(UploadUnableToRecoverError, _ExtendableError7);

  function UploadUnableToRecoverError() {
    (0, _classCallCheck3.default)(this, UploadUnableToRecoverError);
    return (0, _possibleConstructorReturn3.default)(this, (UploadUnableToRecoverError.__proto__ || Object.getPrototypeOf(UploadUnableToRecoverError)).call(this, 'The upload what unable to recover after trying restricted exponention backoff'));
  }

  return UploadUnableToRecoverError;
}(_es6Error2.default);

var BadRequestError = exports.BadRequestError = function (_ExtendableError8) {
  (0, _inherits3.default)(BadRequestError, _ExtendableError8);

  function BadRequestError(res) {
    (0, _classCallCheck3.default)(this, BadRequestError);

    var _this8 = (0, _possibleConstructorReturn3.default)(this, (BadRequestError.__proto__ || Object.getPrototypeOf(BadRequestError)).call(this, 'Bad request'));

    _this8.res = res;
    return _this8;
  }

  return BadRequestError;
}(_es6Error2.default);

var UnknownResponseError = exports.UnknownResponseError = function (_ExtendableError9) {
  (0, _inherits3.default)(UnknownResponseError, _ExtendableError9);

  function UnknownResponseError(res) {
    (0, _classCallCheck3.default)(this, UnknownResponseError);

    var _this9 = (0, _possibleConstructorReturn3.default)(this, (UnknownResponseError.__proto__ || Object.getPrototypeOf(UnknownResponseError)).call(this, 'Unknown response received from GCS'));

    _this9.res = res;
    return _this9;
  }

  return UnknownResponseError;
}(_es6Error2.default);

var MissingOptionsError = exports.MissingOptionsError = function (_ExtendableError10) {
  (0, _inherits3.default)(MissingOptionsError, _ExtendableError10);

  function MissingOptionsError(description) {
    (0, _classCallCheck3.default)(this, MissingOptionsError);
    return (0, _possibleConstructorReturn3.default)(this, (MissingOptionsError.__proto__ || Object.getPrototypeOf(MissingOptionsError)).call(this, 'Missing required options for Upload - ' + description));
  }

  return MissingOptionsError;
}(_es6Error2.default);

var UploadIncompleteError = exports.UploadIncompleteError = function (_ExtendableError11) {
  (0, _inherits3.default)(UploadIncompleteError, _ExtendableError11);

  function UploadIncompleteError() {
    (0, _classCallCheck3.default)(this, UploadIncompleteError);
    return (0, _possibleConstructorReturn3.default)(this, (UploadIncompleteError.__proto__ || Object.getPrototypeOf(UploadIncompleteError)).call(this, 'Upload is not complete'));
  }

  return UploadIncompleteError;
}(_es6Error2.default);

var InvalidChunkSizeError = exports.InvalidChunkSizeError = function (_ExtendableError12) {
  (0, _inherits3.default)(InvalidChunkSizeError, _ExtendableError12);

  function InvalidChunkSizeError(chunkSize) {
    (0, _classCallCheck3.default)(this, InvalidChunkSizeError);
    return (0, _possibleConstructorReturn3.default)(this, (InvalidChunkSizeError.__proto__ || Object.getPrototypeOf(InvalidChunkSizeError)).call(this, 'Invalid chunk size ' + chunkSize + ', must be a multiple of 262144'));
  }

  return InvalidChunkSizeError;
}(_es6Error2.default);

var UploadAlreadyFinishedError = exports.UploadAlreadyFinishedError = function (_ExtendableError13) {
  (0, _inherits3.default)(UploadAlreadyFinishedError, _ExtendableError13);

  function UploadAlreadyFinishedError() {
    (0, _classCallCheck3.default)(this, UploadAlreadyFinishedError);
    return (0, _possibleConstructorReturn3.default)(this, (UploadAlreadyFinishedError.__proto__ || Object.getPrototypeOf(UploadAlreadyFinishedError)).call(this, 'Upload instance has already finished'));
  }

  return UploadAlreadyFinishedError;
}(_es6Error2.default);