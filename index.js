const assert = require('assert')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

class MavenLooperPublisher {
  constructor () {
    this.name = 'maven-looper'
    this.platforms = ['android']
  }

  publish ({
    containerPath,
    containerVersion,
    url
  }) {
    const oldWD = process.cwd()
    const artifactId = process.env.MAVEN_ARTIFACT_ID
    const groupId = process.env.MAVEN_GROUP_ID
    assert(artifactId)
    assert(groupId)
    console.log('maven-looper publishing:', url, artifactId, groupId, containerVersion)
    const gradlePath = path.join(containerPath, 'lib/build.gradle')
    console.log(`Writing configuration to ${gradlePath}`)

    return promisify(fs.appendFile)(gradlePath, `
  apply plugin: 'maven'
  
  task androidSourcesJar(type: Jar) {
      classifier = 'sources'
      from android.sourceSets.main.java.srcDirs
      include '**/*.java'
  }
  
  artifacts {
      archives androidSourcesJar
  }
  
  uploadArchives {
      repositories {
          mavenDeployer {
              pom.version = '${containerVersion}'
              pom.artifactId = '${artifactId}'
              pom.groupId = '${groupId}'
              repository(url: '${url}')
          }
      }
  }`
    )
      .then(() => {
        console.log(`Wrote configuration to ${gradlePath}`)
        console.log(`Executing ./gradlew lib:uploadArchives in ${containerPath}`)

        process.chdir(containerPath)

        return new Promise((resolve, reject) => {
          cp.exec('./gradlew lib:uploadArchives --debug', (error, stdout, stderr) => {
            console.error(stderr)
            console.log(stdout)

            process.chdir(oldWD)

            if (error) {
              reject(error)
            } else {
              console.log('gradlew lib:uploadArchives exited successfully')
              resolve()
            }
          })
        })
      })
  }
}

module.exports.default = MavenLooperPublisher
