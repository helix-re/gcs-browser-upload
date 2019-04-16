import ExtendableError from 'es6-error'

export class DifferentChunkError extends ExtendableError {
  constructor (chunkIndex, originalChecksum, newChecksum) {
    super(`Chunk at index '${chunkIndex}' is different to original`)
    this.chunkIndex = chunkIndex
    this.originalChecksum = originalChecksum
    this.newChecksum = newChecksum
  }
}

export class InvalidContentRangeError extends ExtendableError {
  constructor (localResumeIndex, remoteResumeIndex) {
    super(`Local resume index (${localResumeIndex}) is our of sync with the remote resume index (${remoteResumeIndex})`)
  }
}

export class ResumeIndexesOutOfSyncError extends ExtendableError {
  constructor (localResumeIndex, remoteResumeIndex) {
    super(`Local resume index (${localResumeIndex}) is our of sync with the remote resume inxed (${remoteResumeIndex})`)
  }
}

export class FileAlreadyUploadedError extends ExtendableError {
  constructor (id, url) {
    super(`File '${id}' has already been uploaded to unique url '${url}'`)
  }
}

export class UrlNotFoundError extends ExtendableError {
  constructor (url) {
    super(`Upload URL '${url}' has either expired or is invalid`)
  }
}

export class UploadFailedError extends ExtendableError {
  constructor (status) {
    super(`HTTP status ${status} received from GCS, consider retrying`)
  }
}

export class UploadUnableToRecoverError extends ExtendableError {
  constructor () {
    super('The upload what unable to recover after trying restricted exponention backoff')
  }
}

export class BadRequestError extends ExtendableError {
  constructor (res) {
    super('Bad request')
    this.res = res
  }
}

export class UnknownResponseError extends ExtendableError {
  constructor (res) {
    super('Unknown response received from GCS')
    this.res = res
  }
}

export class MissingOptionsError extends ExtendableError {
  constructor (description) {
    super(`Missing required options for Upload - ${description}`)
  }
}

export class UploadIncompleteError extends ExtendableError {
  constructor () {
    super('Upload is not complete')
  }
}

export class InvalidChunkSizeError extends ExtendableError {
  constructor (chunkSize) {
    super(`Invalid chunk size ${chunkSize}, must be a multiple of 262144`)
  }
}

export class UploadAlreadyFinishedError extends ExtendableError {
  constructor () {
    super('Upload instance has already finished')
  }
}
