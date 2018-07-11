const assert = require('assert')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const { promisify } = require('util')

const clean = () => promisify(rimraf)(path.join(__dirname, '.tmp'))
const mkdirpAsync = promisify(mkdirp)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const MavenLooperPublisher = require('./index.js').default

const publisher = new MavenLooperPublisher()

assert(Array.isArray(publisher.platforms))
assert(publisher.name)

Promise.all([
  mkdirpAsync(path.join(__dirname, '.tmp/lib')),
  mkdirpAsync(path.join(__dirname, '.tmp/gradle/wrapper'))
])
  .then(() => Promise.all([
    writeFile(path.join(__dirname, '.tmp/gradlew'), '#!/bin/sh\necho "$@"'),
    writeFile(path.join(__dirname, '.tmp/lib/build.gradle'), ''),
    writeFile(path.join(__dirname, '.tmp/gradle.properties'), ''),
    writeFile(path.join(__dirname, '.tmp/gradle/wrapper/gradle-wrapper.properties'), '')
  ]))
  .then(() => promisify(fs.chmod)(path.join(__dirname, '.tmp/gradlew'), '0755'))
  .then(() => {
    // TODO: exec with custom env vars instead of mutating process.env
    process.env.LOOPER_MAVEN_POM_ARTIFACTID = 'my-lovely-container'
    process.env.LOOPER_MAVEN_POM_GROUPID = 'com.walmartlabs.looper'

    return publisher.publish({
      containerPath: path.join(__dirname, '.tmp'),
      containerVersion: '1.2.3',
      url: 'http://localhost:8081/repository/contents/hosted'
    })
  })
  .then(() => Promise.all([
    readFile(path.join(__dirname, '.tmp/lib/build.gradle'), 'utf-8'),
    readFile(path.join(__dirname, '.tmp/gradle.properties'), 'utf-8'),
    readFile(path.join(__dirname, '.tmp/gradle/wrapper/gradle-wrapper.properties'), 'utf-8')
  ]))
  .then(([
    gradleContents,
    propertiesContents,
    wrapperPropertiesContents
  ]) => {
    const proxyPattern = /systemProp\.http\.proxyHost=sysproxy\.wal-mart\.com/
    assert(/pom\.version = '1.2.3'/.test(gradleContents))
    assert(/pom\.artifactId = 'my-lovely-container'/.test(gradleContents))
    assert(/pom\.groupId = 'com.walmartlabs.looper'/.test(gradleContents))
    assert(/repository\(url: 'http:\/\/localhost:8081\/repository\/contents\/hosted'\)/.test(gradleContents))
    assert(proxyPattern.test(propertiesContents))
    assert(proxyPattern.test(wrapperPropertiesContents))
  })
  .then(clean)
  .catch(error => clean().then(() => {
    console.error(error)
    process.exit(1)
  }))
