const assert = require('assert')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const appendFile = promisify(fs.appendFile)

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
    const gradlePropertiesPath = path.join(containerPath, 'gradle/wrapper/gradle-wrapper.properties')
    console.log(`Writing configuration to ${gradlePath}`)
    console.log(`Writing properties to ${gradlePropertiesPath}`)

    return Promise.all([
      appendFile(gradlePath, `
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
      ),
      appendFile(gradlePropertiesPath, `
systemProp.http.proxyHost=proxy.wal-mart.com
systemProp.http.proxyPort=9080
systemProp.https.proxyHost=proxy.wal-mart.com
systemProp.https.proxyPort=9080
`
      )
    ])
      .then(() => {
        console.log(`Wrote configuration to ${gradlePath}`)
        console.log(`Wrote properties to ${gradlePropertiesPath}`)
        console.log(`Executing ./gradlew lib:uploadArchives in ${containerPath}`)

        process.chdir(containerPath)

        return new Promise((resolve, reject) => {
          const gradlew = cp.spawn('./gradlew', ['lib:uploadArchives', '--info', '--debug'])
            .on('error', (error) => {
              process.chdir(oldWD)
              reject(error)
            })
            .on('exit', (code) => {
              process.chdir(oldWD)

              if (code !== 0) {
                reject(new Error(`gradlew lib:uploadArchives exited with code ${code}`))
              } else {
                console.log('gradlew lib:uploadArchives exited successfully')
                resolve()
              }
            })

          gradlew.stderr.pipe(process.stderr)
          gradlew.stdout.pipe(process.stdout)
        })
      })
  }
}

module.exports.default = MavenLooperPublisher
