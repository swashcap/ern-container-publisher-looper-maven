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
        console.log('Executing gradlew lib:uploadArchives')

        return new Promise((resolve, reject) => {
          const gradlew = cp.spawn(path.join(containerPath, 'gradlew'), ['lib:uploadArchives'])
            .on('error', reject)
            .on('exit', (code) => {
              if (code !== 0) {
                reject(new Error(`gradlew lib:uploadArchives exited with code ${code}`))
              }

              console.log('gradlew lib:uploadArchives exited successfully')
              resolve()
            })
          gradlew.stdout.pipe(process.stdout)
          gradlew.stderr.pipe(process.stderr)
        })
      })
  }
}

module.exports.default = MavenLooperPublisher
