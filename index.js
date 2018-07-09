const cp = require('child_process')
const path = require('path')

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
    console.log(
      'ern-container-publisher-looper-maven publishing:',
      url,
      process.env.LOOPER_MAVEN_POM_ARTIFACTID,
      process.env.LOOPER_MAVEN_POM_GROUPID,
      containerVersion
    )

    return new Promise((resolve, reject) => {
      const run = cp.spawn(
        path.join(__dirname, 'run.sh'),
        {
          cwd: containerPath,
          env: Object.assign(
            {
              LOOPER_MAVEN_REPOSITORY_URL: url,
              LOOPER_MAVEN_POM_VERSION: containerVersion
            },
            process.env
          )
        }
      )
        .on('error', reject)
        .on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`ern-container-publisher-looper-maven/run.sh exited with code ${code}`))
          } else {
            console.log('ern-container-publisher-looper-maven complete')
            resolve()
          }
        })

      run.stderr.pipe(process.stderr)
      run.stdout.pipe(process.stdout)
    })
  }
}

module.exports.default = MavenLooperPublisher
