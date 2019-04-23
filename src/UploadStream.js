import { safePut } from './http'
import FileMeta from './FileMeta'
import { getChecksum } from './FileProcessor'
import debug from './debug'
import SparkMD5 from 'spark-md5'
import retry from 'async-retry'
import {
  FileAlreadyUploadedError,
  UrlNotFoundError,
  UploadFailedError,
  UploadUnableToRecoverError,
  UnknownResponseError,
  MissingOptionsError,
  UploadIncompleteError,
  InvalidChunkSizeError,
  BadRequestError
} from './errors'
import * as errors from './errors'

const MIN_CHUNK_SIZE = 262144

export default class UploadStream {
  static errors = errors

  constructor (args, allowSmallChunks) {
    this.paused = false
    this.unpauseHandlers = []
    this.spark = new SparkMD5.ArrayBuffer()

    var opts = {
      backoffMillis: 1000,
      backoffRetryLimit: 5,
      chunkSize: MIN_CHUNK_SIZE,
      contentType: 'text/plain',
      debug: false,
      id: null,
      onChunkUpload: () => {},
      onProgress: () => {},
      storage: args.storage,
      url: null,
      ...args
    }

    if ((opts.chunkSize % MIN_CHUNK_SIZE !== 0 || opts.chunkSize === 0) && !allowSmallChunks) {
      throw new InvalidChunkSizeError(opts.chunkSize)
    }

    if (!opts.id) {
      throw new MissingOptionsError('The \'id\' option is required')
    }

    if (!opts.url) {
      throw new MissingOptionsError('The \'url\' option is required')
    }

    this.debug = opts.debug
      ? console.log
      : debug;

    this.debug('Creating new upload stream instance:')
    this.debug(` - Url: ${opts.url}`)
    this.debug(` - Id: ${opts.id}`)
    this.debug(' - File size: Unknown / Streaming')
    this.debug(` - Chunk size: ${opts.chunkSize}`)

    this.opts = opts
    this.meta = new FileMeta(opts.id, 0, opts.chunkSize, opts.storage)
  }

  async uploadChunk (index, chunk, isLastChunk = false, backoff = 1) {
    const { opts, meta } = this
    const start = index * opts.chunkSize
    const end = index * opts.chunkSize + chunk.byteLength - 1

    if (this.paused) {
      await this.waitForUnpause()
    }

    console.time('getChecksum')
    const checksum = getChecksum(this.spark, chunk)
    console.timeEnd('getChecksum')

    const contentRange = isLastChunk ? `bytes ${start}-${end}/${end + 1}` : `bytes ${start}-${end}/*`

    const headers = {
      'Content-Type': opts.contentType,
      'Content-Range': contentRange
    }

    this.debug(`Uploading chunk ${index}:`)
    this.debug(` - Chunk length: ${chunk.byteLength}`)
    this.debug(` - Start: ${start}`)
    this.debug(` - End: ${end}`)
    this.debug(` - Headers: ${JSON.stringify(headers)}`)
    this.debug(` - isLastChunk: ${isLastChunk}`)

    // if (backoff >= opts.backoffRetryLimit) {
    //   throw new UploadUnableToRecoverError()
    // }

    try {
      await retry((async) (bail, num) => {
        // if in browser, upload blobs or else the browser can hang/crash on large ArrayBuffer uploads (150mb+)
        if (typeof self.Blob !== 'undefined') {
          chunk = new Blob([chunk])
        }
        console.time('uploadChunk:put')
        const res = await safePut(opts.url, chunk, {
          headers, onUploadProgress: function (progressEvent) {
            console.timeEnd('uploadChunk:put')
            console.log(progressEvent.loaded)
            var chunkSize = (chunk.byteLength || chunk.size)
            opts.onProgress({
              totalBytes: start + chunkSize,
              uploadedBytes: start + progressEvent.loaded,
              chunkIndex: index,
              chunkLength: chunkSize
            })
          }
        })

        checkResponseStatus(res, opts, [200, 201, 308])
      }, {retries: opts.backoffRetryLimit, minTimeout: opts.backoffMillis})
    } catch (err) {
      opts.onChunkUploadFail({chunkIndex: index})
      throw new UploadUnableToRecoverError()
    }

    this.debug(`Chunk upload succeeded, adding checksum ${checksum}`)
    meta.addChecksum(index, checksum)

    opts.onChunkUpload({
      uploadedBytes: end + 1,
      chunkIndex: index,
      chunkLength: chunk.byteLength || chunk.size,
      isLastChunk: isLastChunk
    })
  }

  async getRemoteResumeIndex () {
    const { opts } = this
    const headers = {
      'Content-Range': 'bytes */*',
      'Content-Type': opts.contentType
    }
    this.debug('Retrieving upload status from GCS')
    const res = await safePut(opts.url, null, { headers })

    this.debug(res)

    checkResponseStatus(res, opts, [308])
    const header = res.headers['range']
    this.debug(`Received upload status from GCS: ${header}`)
    const range = header.match(/(\d+?)-(\d+?)$/)
    const bytesReceived = parseInt(range[2]) + 1
    return Math.floor(bytesReceived / opts.chunkSize)
  }

  pause () {
    this.debug('Upload Stream paused')
    this.paused = true
  }

  unpause () {
    this.debug('Upload Stream unpaused')
    this.paused = false
    this.unpauseHandlers.forEach((fn) => fn())
    this.unpauseHandlers = []
  }

  waitForUnpause () {
    return new Promise((resolve) => {
      this.unpauseHandlers.push(resolve)
    })
  }

  cancel () {
    this.meta.reset()
    this.debug('Upload cancelled')
  }
}

function checkResponseStatus (res, opts, allowed = []) {
  const { status } = res
  if (allowed.indexOf(status) > -1) {
    return true
  }

  switch (status) {
    case 308:
      throw new UploadIncompleteError()

    case 201:
    case 200:
      throw new FileAlreadyUploadedError(opts.id, opts.url)

    case 400:
      throw new BadRequestError(res)

    case 404:
      throw new UrlNotFoundError(opts.url)

    case 500:
    case 502:
    case 503:
    case 504:
      throw new UploadFailedError(status)

    default:
      throw new UnknownResponseError(res)
  }
}
