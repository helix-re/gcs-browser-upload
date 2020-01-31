import { safePut } from './http'
import FileMeta from './FileMeta'
import FileProcessor from './FileProcessor'
import debug from './debug'
import {
  DifferentChunkError,
  FileAlreadyUploadedError,
  UrlNotFoundError,
  UploadFailedError,
  UnknownResponseError,
  MissingOptionsError,
  UploadIncompleteError,
  InvalidChunkSizeError,
  UploadAlreadyFinishedError,
  BadRequestError
} from './errors'
import * as errors from './errors'

const MIN_CHUNK_SIZE = 262144

export default class Upload {
  static errors = errors;

  constructor (args, allowSmallChunks) {
    var opts = {
      chunkSize: MIN_CHUNK_SIZE,
      contentType: 'text/plain',
      debug: false,
      file: null,
      id: null,
      onChunkUpload: () => {},
      onProgress: () => {},
      resumable: true,
      validateChecksum: true,
      storage: args.storage,
      url: null,
      ...args
    }

    if ((opts.chunkSize % MIN_CHUNK_SIZE !== 0 || opts.chunkSize === 0) && !allowSmallChunks) {
      throw new InvalidChunkSizeError(opts.chunkSize)
    }

    if (!opts.id || !opts.url || !opts.file) {
      throw new MissingOptionsError()
    }

    this.debug = opts.debug
      ? console.log
      : debug;

    this.debug('Creating new upload instance:')
    this.debug(` - Url: ${opts.url}`)
    this.debug(` - Id: ${opts.id}`)
    this.debug(` - File size: ${opts.file.size}`)
    this.debug(` - Chunk size: ${opts.chunkSize}`)
    this.debug(` - Resumable: ${opts.resumable}`)
    this.debug(` - Validate Checksum: ${opts.validateChecksum}`)

    this.opts = opts
    this.meta = new FileMeta(opts.id, opts.file.size, opts.chunkSize, opts.storage, opts.resumable)
    this.processor = new FileProcessor(opts.file, opts.chunkSize, opts.resumable && opts.validateChecksum)
    this.processor.debug = this.debug;
  }

  static safePut = safePut

  async start () {
    const { meta, processor, opts, finished } = this

    const resumeUpload = async () => {
      const localResumeIndex = meta.getResumeIndex()
      const remoteResumeIndex = await getRemoteResumeIndex()

      let resumeIndex = remoteResumeIndex;
      if(opts.validateChecksum) {
        resumeIndex = Math.min(localResumeIndex, remoteResumeIndex)
        this.debug(`Validating chunks up to index ${resumeIndex}`)
        this.debug(` - Local index: ${localResumeIndex}`)
      }

      this.debug(` - Remote index: ${remoteResumeIndex}`)

      if (opts.validateChecksum) {
        try {
          await processor.run(validateChunk, 0, resumeIndex)
        } catch (e) {
          this.debug('Validation failed, starting from scratch')
          this.debug(` - Failed chunk index: ${e.chunkIndex}`)
          this.debug(` - Old checksum: ${e.originalChecksum}`)
          this.debug(` - New checksum: ${e.newChecksum}`)

          await processor.run(uploadChunk)
          return
        }

        this.debug('Validation passed, resuming upload')
        await processor.run(uploadChunk, resumeIndex)
      } else {
        this.debug(`Uploading chunk starting at index ${resumeIndex}`)
        await processor.run(uploadChunk, resumeIndex)
      }
    }

    const uploadChunk = async (checksum, index, chunk) => {
      const chunkSize = chunk.byteLength || chunk.size;
      const total = opts.file.size
      const start = index * opts.chunkSize
      const end = index * opts.chunkSize + chunkSize - 1

      const headers = {
        'Content-Type': opts.contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`,
      }

      this.debug(`Uploading chunk ${index}:`)
      this.debug(` - Chunk length: ${chunkSize}`)
      this.debug(` - Start: ${start}`)
      this.debug(` - End: ${end}`)

      // if in browser, upload blobs or else the browser can hang/crash on large ArrayBuffer uploads (150mb+)
      if (typeof self.Blob !== 'undefined') {
        chunk = new Blob([chunk])
      }
      const res = await safePut(opts.url, chunk, {
        headers, onUploadProgress: function (progressEvent) {
          opts.onProgress({
            totalBytes: total,
            uploadedBytes: start + progressEvent.loaded,
            chunkIndex: index,
            chunkLength: chunkSize,
          })
        }
      })

      checkResponseStatus(res, opts, [200, 201, 308])
      this.debug(`Chunk upload succeeded, adding checksum ${checksum}`)
      if (opts.validateChecksum) {
        meta.addChecksum(index, checksum)
      }

      opts.onChunkUpload({
        totalBytes: total,
        uploadedBytes: end + 1,
        chunkIndex: index,
        chunkLength: chunkSize,
        isLastChunk: total === end + 1
      })
    }

    const validateChunk = async (newChecksum, index) => {
      const originalChecksum = meta.getChecksum(index)
      const isChunkValid = originalChecksum === newChecksum
      if (!isChunkValid) {
        meta.reset()
        throw new DifferentChunkError(index, originalChecksum, newChecksum)
      }
    }

    const getRemoteResumeIndex = async () => {
      let bytesReceived = 0
      const headers = {
        'Content-Range': `bytes */${opts.file.size}`,
        'Content-Type': opts.contentType
      }
      this.debug('Retrieving upload status from GCS')
      const res = await safePut(opts.url, null, { headers })

      checkResponseStatus(res, opts, [308])
      const rangeHeader = res.headers['range']
      if (rangeHeader) {
        this.debug(`Received upload status from GCS: ${rangeHeader}`)
        const range = rangeHeader.match(/(\d+?)-(\d+?)$/)
        bytesReceived = parseInt(range[2]) + 1
      }

      return Math.floor(bytesReceived / opts.chunkSize)
    }

    if (finished) {
      throw new UploadAlreadyFinishedError()
    }

    if (meta.isResumable()) {
      this.debug('Upload might be resumable')
      await resumeUpload()
    } else {
      this.debug('Upload not resumable, starting from scratch')
      await processor.run(uploadChunk)
    }
    this.debug('Upload complete, resetting meta')
    meta.reset()
    this.finished = true
  }

  pause () {
    this.processor.pause()
    this.debug('Upload paused', this.opts);
  }

  unpause () {
    this.processor.unpause()
    this.debug('Upload unpaused', this.opts);
  }

  cancel () {
    this.processor.pause()
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
      throw new BadRequestError(status)

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
