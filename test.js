const assert = require('assert')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const { promisify } = require('util')

const clean = () => {
  process.chdir(__dirname)
  return promisify(rimraf)(path.join(__dirname, '.tmp'))
}
const writeFile = promisify(fs.writeFile)
const MavenLooperPublisher = require('./index.js').default

const publisher = new MavenLooperPublisher()

assert(Array.isArray(publisher.platforms))
assert(publisher.name)

promisify(mkdirp)(path.join(__dirname, '.tmp/lib'))
  .then(() => Promise.all([
    writeFile(path.join(__dirname, '.tmp/gradlew'), '#!/bin/sh\necho "$@"'),
    writeFile(path.join(__dirname, '.tmp/lib/build.gradle'), '')
  ]))
  .then(() => promisify(fs.chmod)(path.join(__dirname, '.tmp/gradlew'), '0755'))
  .then(() => {
    // TODO: exec with custom env vars instead of mutating process.env
    process.env.MAVEN_ARTIFACT_ID = 'my-lovely-container'
    process.env.MAVEN_GROUP_ID = 'com.walmartlabs.looper'
    process.chdir(path.join(__dirname, '.tmp'))

    return publisher.publish({
      containerPath: path.join(__dirname, '.tmp'),
      containerVersion: '1.2.3',
      url: 'http://localhost:8081/repository/contents/hosted'
    })
  })
  .then(() => promisify(fs.readFile)(path.join(__dirname, '.tmp/lib/build.gradle'), 'utf-8'))
  .then((gradleContents) => {
    assert(/pom\.version = '1.2.3'/.test(gradleContents))
    assert(/pom\.artifactId = 'my-lovely-container'/.test(gradleContents))
    assert(/pom\.groupId = 'com.walmartlabs.looper'/.test(gradleContents))
    assert(/repository\(url: 'http:\/\/localhost:8081\/repository\/contents\/hosted'\)/.test(gradleContents))
  })
  .then(clean)
  .catch(error => clean().then(() => {
    throw error
  }))
