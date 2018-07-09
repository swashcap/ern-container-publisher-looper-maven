#!/usr/bin/env bash
set -exo pipefail

# Get dirname of script
# https://stackoverflow.com/a/246128
DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Writing configuration to $PWD/lib/build.gradle"
cat "$DIRNAME/files/maven.gradle" >> lib/build.gradle

sanitize_periods() {
  echo "$1" | sed 's/\./\\./g'
}

SED_COMMAND="s#\${containerVersion}#$(sanitize_periods "$LOOPER_MAVEN_POM_VERSION")#"
SED_COMMAND="$SED_COMMAND; s#\${artifactId}#$(sanitize_periods "$LOOPER_MAVEN_POM_ARTIFACTID")#"
SED_COMMAND="$SED_COMMAND; s#\${groupId}#$(sanitize_periods "$LOOPER_MAVEN_POM_GROUPID")#"
SED_COMMAND="$SED_COMMAND; s#\${url}#$(sanitize_periods "$LOOPER_MAVEN_REPOSITORY_URL")#"

sed -i '' "$SED_COMMAND" lib/build.gradle

echo "Writing configuration to $PWD/gradle.properties"
cat "$DIRNAME/files/gradle-proxy-settings.properties" >> gradle.properties
echo "Wrote configuration to $PWD/gradle.properties"

echo "Writing configuration to $PWD/gradle/wrapper/gradle-wrapper.properties"
cat "$DIRNAME/files/gradle-proxy-settings.properties" >> gradle/wrapper/gradle-wrapper.properties
echo "Wrote configuration to $PWD/gradle/wrapper/gradle-wrapper.properties"

echo "Writing configuration to $PWD/.mvn/settings.xml"
mkdir -p .mvn
cp "$DIRNAME/files/mvn-settings.xml" .mvn/settings.xml
echo "Wrote configuration to $PWD/.mvn/settings.xml"

./gradlew lib:uploadArchives --info --debug

